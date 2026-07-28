ALTER TABLE "title_localizations" ADD COLUMN "slug" varchar(180);--> statement-breakpoint
UPDATE "title_localizations"
SET "slug" = "titles"."slug"
FROM "titles"
WHERE "title_localizations"."title_id" = "titles"."id"
  AND "title_localizations"."slug" IS NULL;--> statement-breakpoint
ALTER TABLE "title_localizations" ALTER COLUMN "slug" SET NOT NULL;
