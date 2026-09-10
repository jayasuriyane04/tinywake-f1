CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`online` integer NOT NULL,
	`rssi` integer,
	`config` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`device_id` text,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_created_at` ON `events` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`text` text NOT NULL,
	`source` text NOT NULL,
	`latency` real,
	`confidence` real,
	`duration` real NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	`scenario` text NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_created_at` ON `sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_device_created` ON `sessions` (`device_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
