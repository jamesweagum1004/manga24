ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "show_published_date" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "show_author" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "show_chapters" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_sections" jsonb;
