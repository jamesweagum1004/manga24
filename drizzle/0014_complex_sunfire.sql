ALTER TABLE "titles" ADD COLUMN IF NOT EXISTS "display_locales" jsonb DEFAULT '["en","es","fr","de","pt"]'::jsonb NOT NULL;
