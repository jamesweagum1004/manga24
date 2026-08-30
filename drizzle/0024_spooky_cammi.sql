ALTER TABLE "site_settings" ADD COLUMN "indexnow_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "indexnow_key" varchar(128);