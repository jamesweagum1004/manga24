CREATE TABLE "title_view_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "title_view_events" ADD CONSTRAINT "title_view_events_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "title_view_events_viewed_at_idx" ON "title_view_events" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "title_view_events_title_viewed_at_idx" ON "title_view_events" USING btree ("title_id","viewed_at");