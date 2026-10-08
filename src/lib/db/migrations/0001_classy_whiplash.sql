CREATE TABLE `food_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`meal` text NOT NULL,
	`name` text NOT NULL,
	`quantity` text,
	`calories` integer NOT NULL,
	`protein_g` integer NOT NULL,
	`carbs_g` integer NOT NULL,
	`fat_g` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nutrition_goals` (
	`id` integer PRIMARY KEY NOT NULL,
	`calories` integer NOT NULL,
	`protein_g` integer NOT NULL,
	`carbs_g` integer NOT NULL,
	`fat_g` integer NOT NULL
);
