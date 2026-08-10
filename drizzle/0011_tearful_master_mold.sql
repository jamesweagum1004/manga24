ALTER TABLE "site_settings" ADD COLUMN "pwa_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "pwa_prompt_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "pwa_prompt_threshold" integer DEFAULT 3 NOT NULL;