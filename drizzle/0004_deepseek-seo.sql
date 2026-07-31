ALTER TABLE "title_localizations" ADD COLUMN "seo_title" varchar(70);--> statement-breakpoint
ALTER TABLE "title_localizations" ADD COLUMN "seo_description" varchar(170);--> statement-breakpoint
ALTER TABLE "title_localizations" ADD COLUMN "seo_keywords" text;