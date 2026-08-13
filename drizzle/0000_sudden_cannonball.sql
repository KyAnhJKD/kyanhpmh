CREATE TABLE `music_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`artist` varchar(180) NOT NULL,
	`album` varchar(180),
	`genre` varchar(80),
	`durationSeconds` int NOT NULL DEFAULT 0,
	`audioKey` varchar(512) NOT NULL,
	`audioUrl` text NOT NULL,
	`artworkKey` varchar(512),
	`artworkUrl` text,
	`audioMimeType` varchar(100) NOT NULL,
	`status` enum('published','draft') NOT NULL DEFAULT 'published',
	`uploadedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `music_tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `music_tracks_status_created_idx` ON `music_tracks` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `music_tracks_uploader_idx` ON `music_tracks` (`uploadedById`);