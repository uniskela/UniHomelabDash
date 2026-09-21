CREATE TABLE IF NOT EXISTS `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`provider_id` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `activity_events_created_at_idx` ON `activity_events` (`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `activity_events_type_idx` ON `activity_events` (`type`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_event_id` text,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`provider_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`dedupe_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `alerts_dedupe_key_idx` ON `alerts` (`dedupe_key`) WHERE `dedupe_key` IS NOT NULL AND `status` = 'open';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `alerts_status_idx` ON `alerts` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `alerts_created_at_idx` ON `alerts` (`created_at`);
