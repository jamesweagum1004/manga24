ALTER TABLE "ads" ADD COLUMN "target_countries" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE TABLE "site_visit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_key" varchar(64) NOT NULL,
	"country_code" varchar(2),
	"pathname" varchar(500) NOT NULL,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "site_visit_events_visited_at_idx" ON "site_visit_events" USING btree ("visited_at");--> statement-breakpoint
CREATE INDEX "site_visit_events_country_visited_at_idx" ON "site_visit_events" USING btree ("country_code","visited_at");--> statement-breakpoint
CREATE INDEX "site_visit_events_visitor_visited_at_idx" ON "site_visit_events" USING btree ("visitor_key","visited_at");
