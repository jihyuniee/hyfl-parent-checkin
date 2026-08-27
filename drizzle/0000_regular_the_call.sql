CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`guardian_name` text NOT NULL,
	`relationship` text NOT NULL,
	`party_size` integer DEFAULT 1 NOT NULL,
	`checked_in_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`event_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`target_grades` text DEFAULT '1,2,3' NOT NULL,
	`opens_at` text,
	`closes_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_year` integer NOT NULL,
	`grade` integer NOT NULL,
	`class_no` integer NOT NULL,
	`student_no` integer NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_identity_idx` ON `students` (`school_year`,`grade`,`class_no`,`student_no`);