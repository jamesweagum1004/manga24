CREATE TYPE "public"."title_format" AS ENUM('manga', 'manhwa');--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"deepseek_model" varchar(80) DEFAULT 'deepseek-v4-flash' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "titles" ADD COLUMN "format" "title_format" DEFAULT 'manga' NOT NULL;