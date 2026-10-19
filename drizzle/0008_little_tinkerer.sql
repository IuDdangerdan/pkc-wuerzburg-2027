CREATE TABLE `content_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`history` text DEFAULT '[]' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`name` text NOT NULL,
	`storage_key` text,
	`legacy_path` text,
	`mime` text DEFAULT 'application/pdf' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`history` text DEFAULT '[]' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hotel_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `wiki` ADD `archived` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki` ADD `summary` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki` ADD `position` integer DEFAULT 0 NOT NULL;