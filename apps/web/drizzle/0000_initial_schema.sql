-- TideCheck schema: spots, sessions, alerts, and api_cache
-- Replaces the default template schema

CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `password_hash` text,
  `name` text,
  `apple_id` text,
  `is_admin` integer DEFAULT false,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
CREATE UNIQUE INDEX IF NOT EXISTS `users_apple_id_unique` ON `users` (`apple_id`);

CREATE TABLE IF NOT EXISTS `spots` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `latitude` real NOT NULL,
  `longitude` real NOT NULL,
  `noaa_station_id` text,
  `spot_type` text NOT NULL,
  `description` text,
  `timezone` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `spot_id` text NOT NULL REFERENCES `spots`(`id`) ON DELETE CASCADE,
  `session_type` text NOT NULL,
  `date` text NOT NULL,
  `rating` integer,
  `notes` text,
  `conditions_snapshot` text,
  `catch_count` integer,
  `created_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `alerts` (
  `id` text PRIMARY KEY NOT NULL,
  `spot_id` text NOT NULL REFERENCES `spots`(`id`) ON DELETE CASCADE,
  `alert_type` text NOT NULL,
  `threshold_json` text NOT NULL,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `api_cache` (
  `key` text PRIMARY KEY NOT NULL,
  `data` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);
