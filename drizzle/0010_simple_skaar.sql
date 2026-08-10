ALTER TYPE "public"."locale" ADD VALUE 'fr';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'de';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'pt';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "enabled_locales" jsonb DEFAULT '["en","es"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "logo" jsonb;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "favicon" jsonb;--> statement-breakpoint
ALTER TABLE "storage_configs" ADD COLUMN "provider" varchar(40) DEFAULT 'backblaze-b2' NOT NULL;--> statement-breakpoint
ALTER TABLE "storage_configs" ADD COLUMN "bunny_storage_zone" varchar(160);--> statement-breakpoint
ALTER TABLE "storage_configs" ADD COLUMN "bunny_endpoint" text;--> statement-breakpoint
ALTER TABLE "storage_configs" ADD COLUMN "encrypted_bunny_access_key" text;