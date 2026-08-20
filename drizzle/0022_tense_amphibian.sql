CREATE TABLE IF NOT EXISTS "title_view_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_id" uuid NOT NULL REFERENCES "public"."titles"("id") ON DELETE cascade,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "title_view_events_viewed_at_idx" ON "title_view_events" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "title_view_events_title_viewed_at_idx" ON "title_view_events" USING btree ("title_id","viewed_at");
