CREATE TYPE "public"."ad_kind" AS ENUM('static', 'exoclick');--> statement-breakpoint
CREATE TYPE "public"."ad_position" AS ENUM('header', 'content');--> statement-breakpoint
CREATE TABLE "ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" "ad_kind" NOT NULL,
	"position" "ad_position" NOT NULL,
	"image_url" text,
	"click_url" text,
	"alt_text" varchar(240),
	"embed_code" text,
	"width" integer DEFAULT 728 NOT NULL,
	"height" integer DEFAULT 90 NOT NULL,
	"insert_after" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ads_placement_idx" ON "ads" USING btree ("position","is_active","sort_order");