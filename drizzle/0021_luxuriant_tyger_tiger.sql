ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "reader_recommendation_count" integer DEFAULT 8 NOT NULL;
