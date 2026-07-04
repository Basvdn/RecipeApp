CREATE TABLE `ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`raw_text` text NOT NULL,
	`quantity` text,
	`unit` text,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`storage_key` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipe_tags` (
	`recipe_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`recipe_id`, `tag_id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`source_text` text,
	`prep_time_minutes` integer,
	`cook_time_minutes` integer,
	`total_time_minutes` integer,
	`ocr_raw_text` text,
	`has_special_ingredients` integer DEFAULT false NOT NULL,
	`selected_to_cook` integer DEFAULT false NOT NULL,
	`selected_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_category_name_idx` ON `tags` (`category`,`name`);