ALTER TABLE "chapter_pages" ADD COLUMN "chapter_localization_id" uuid;--> statement-breakpoint
UPDATE "chapter_pages"
SET "chapter_localization_id" = COALESCE(
  (
    SELECT "chapter_localizations"."id"
    FROM "chapter_localizations"
    WHERE "chapter_localizations"."chapter_id" = "chapter_pages"."chapter_id"
      AND "chapter_localizations"."locale" = 'en'
    LIMIT 1
  ),
  (
    SELECT "chapter_localizations"."id"
    FROM "chapter_localizations"
    WHERE "chapter_localizations"."chapter_id" = "chapter_pages"."chapter_id"
    ORDER BY "chapter_localizations"."created_at" ASC
    LIMIT 1
  )
);--> statement-breakpoint
ALTER TABLE "chapter_pages" ALTER COLUMN "chapter_localization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "category" varchar(80) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "chapter_pages" ADD CONSTRAINT "chapter_pages_chapter_localization_id_chapter_localizations_id_fk" FOREIGN KEY ("chapter_localization_id") REFERENCES "public"."chapter_localizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chapter_pages_chapter_localization_page_idx" ON "chapter_pages" USING btree ("chapter_localization_id","page_number");--> statement-breakpoint
CREATE UNIQUE INDEX "title_localizations_locale_slug_idx" ON "title_localizations" USING btree ("locale","slug");
