CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `plans` ADD `car_role` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `car_seats` integer;