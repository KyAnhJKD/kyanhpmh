import { describe, expect, it } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { appRouter, decodeAndValidateUpload, musicUploadSchema, safeStorageFilename } from "./routers";

const validPayload = {
  title: "Một bài nhạc",
  artist: "Melody Hub",
  durationSeconds: 184,
  audioFileName: "bai nhac.mp3",
  audioMimeType: "audio/mpeg" as const,
  audioBase64: Buffer.from("tiny-mp3-content").toString("base64"),
};

describe("music upload validation", () => {
  it("accepts an allowed audio payload and decodes its bytes", () => {
    const parsed = musicUploadSchema.parse(validPayload);
    expect(decodeAndValidateUpload(parsed).audioBytes.toString()).toBe("tiny-mp3-content");
  });

  it("rejects a payload whose artwork metadata is incomplete", () => {
    const parsed = musicUploadSchema.parse({ ...validPayload, artworkBase64: Buffer.from("cover").toString("base64") });
    expect(() => decodeAndValidateUpload(parsed)).toThrow("Ảnh bìa cần có tên và định dạng hợp lệ");
  });

  it("rejects an unsupported file type before upload begins", () => {
    expect(() => musicUploadSchema.parse({ ...validPayload, audioMimeType: "text/plain" })).toThrow();
  });

  it("normalizes untrusted filenames before creating storage keys", () => {
    expect(safeStorageFilename("../../Bài hát mới!!!.mp3")).toBe("Bai-hat-moi-.mp3");
  });

  it("blocks a standard user before reaching admin music management", async () => {
    const ctx = {
      user: {
        id: 9,
        openId: "listener-only",
        email: null,
        name: "Listener",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext;

    await expect(appRouter.createCaller(ctx).music.listForAdmin()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });
});
