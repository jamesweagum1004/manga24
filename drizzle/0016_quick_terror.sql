ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenance_enabled" boolean DEFAULT false NOT NULL;
