ALTER TABLE "ads" ADD COLUMN "surface" varchar(16) DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "locale" varchar(8);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "pwa_ads_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "ad_locale_modes" jsonb DEFAULT '{"en":"inherit","es":"inherit","fr":"inherit","de":"inherit","pt":"inherit"}'::jsonb NOT NULL;