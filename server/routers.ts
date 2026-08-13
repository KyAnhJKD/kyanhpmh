// API contract: public visitors can list published tracks; only the owner-backed admin session can create new tracks.
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createMusicTrack, listMusicTracksForAdmin, listPublishedMusicTracks } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

export const MAX_AUDIO_BYTES = 18 * 1024 * 1024;
export const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AUDIO_MIME_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/aac"] as const;
export const ALLOWED_ARTWORK_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const base64Value = z.string().min(1).max(25 * 1024 * 1024);

export const musicUploadSchema = z.object({
  title: z.string().trim().min(1, "Hãy nhập tên bài hát.").max(180),
  artist: z.string().trim().min(1, "Hãy nhập tên nghệ sĩ.").max(180),
  album: z.string().trim().max(180).optional(),
  genre: z.string().trim().max(80).optional(),
  durationSeconds: z.number().int().min(0).max(14_400),
  audioFileName: z.string().trim().min(1).max(180),
  audioMimeType: z.enum(ALLOWED_AUDIO_MIME_TYPES),
  audioBase64: base64Value,
  artworkFileName: z.string().trim().max(180).optional(),
  artworkMimeType: z.enum(ALLOWED_ARTWORK_MIME_TYPES).optional(),
  artworkBase64: z.string().max(3 * 1024 * 1024).optional(),
});

export type MusicUploadInput = z.infer<typeof musicUploadSchema>;

export function safeStorageFilename(fileName: string) {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return normalized.slice(-120) || "audio-file";
}

export function decodeAndValidateUpload(input: MusicUploadInput) {
  const audioBytes = Buffer.from(input.audioBase64, "base64");
  if (audioBytes.length === 0 || audioBytes.length > MAX_AUDIO_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Tệp nhạc phải có dung lượng từ 1 byte đến 18 MB." });
  }

  let artworkBytes: Buffer | undefined;
  if (input.artworkBase64) {
    if (!input.artworkMimeType || !input.artworkFileName) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ảnh bìa cần có tên và định dạng hợp lệ." });
    }
    artworkBytes = Buffer.from(input.artworkBase64, "base64");
    if (artworkBytes.length === 0 || artworkBytes.length > MAX_ARTWORK_BYTES) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ảnh bìa phải có dung lượng từ 1 byte đến 2 MB." });
    }
  }

  return { audioBytes, artworkBytes };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  music: router({
    listPublished: publicProcedure.query(() => listPublishedMusicTracks()),
    listForAdmin: adminProcedure.query(() => listMusicTracksForAdmin()),
    upload: adminProcedure.input(musicUploadSchema).mutation(async ({ ctx, input }) => {
      const { audioBytes, artworkBytes } = decodeAndValidateUpload(input);
      const folder = `melody-hub/music/${ctx.user.id}/${Date.now()}`;
      const audio = await storagePut(`${folder}/${safeStorageFilename(input.audioFileName)}`, audioBytes, input.audioMimeType);

      const artwork = artworkBytes && input.artworkFileName && input.artworkMimeType
        ? await storagePut(`${folder}/${safeStorageFilename(input.artworkFileName)}`, artworkBytes, input.artworkMimeType)
        : undefined;

      await createMusicTrack({
        title: input.title,
        artist: input.artist,
        album: input.album || null,
        genre: input.genre || null,
        durationSeconds: input.durationSeconds,
        audioKey: audio.key,
        audioUrl: audio.url,
        artworkKey: artwork?.key ?? null,
        artworkUrl: artwork?.url ?? null,
        audioMimeType: input.audioMimeType,
        status: "published",
        uploadedById: ctx.user.id,
      });

      return { success: true, audioUrl: audio.url, artworkUrl: artwork?.url ?? null };
    }),
  }),
});

export type AppRouter = typeof appRouter;
