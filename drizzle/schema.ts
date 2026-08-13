// Domain model: Melody Hub stores searchable music metadata in MySQL and keeps audio/artwork bytes in object storage.
import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const musicTracks = mysqlTable(
  "music_tracks",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    artist: varchar("artist", { length: 180 }).notNull(),
    album: varchar("album", { length: 180 }),
    genre: varchar("genre", { length: 80 }),
    durationSeconds: int("durationSeconds").notNull().default(0),
    audioKey: varchar("audioKey", { length: 512 }).notNull(),
    audioUrl: text("audioUrl").notNull(),
    artworkKey: varchar("artworkKey", { length: 512 }),
    artworkUrl: text("artworkUrl"),
    audioMimeType: varchar("audioMimeType", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["published", "draft"]).default("published").notNull(),
    uploadedById: int("uploadedById").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("music_tracks_status_created_idx").on(table.status, table.createdAt),
    index("music_tracks_uploader_idx").on(table.uploadedById),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = typeof musicTracks.$inferInsert;
