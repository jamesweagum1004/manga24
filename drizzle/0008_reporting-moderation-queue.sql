CREATE TYPE "public"."report_priority" AS ENUM('normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('child_safety', 'copyright', 'privacy', 'wrong_rating', 'broken', 'spam', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('new', 'reviewing', 'actioned', 'rejected', 'closed');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" varchar(40) NOT NULL,
	"target_key" varchar(360) NOT NULL,
	"target_url" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"priority" "report_priority" DEFAULT 'normal' NOT NULL,
	"status" "report_status" DEFAULT 'new' NOT NULL,
	"details" text NOT NULL,
	"reporter_name" varchar(160),
	"reporter_email" varchar(320),
	"rights_holder" varchar(240),
	"original_work" text,
	"signature" varchar(240),
	"reporter_fingerprint" varchar(64) NOT NULL,
	"resolution" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_queue_idx" ON "reports" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "reports_fingerprint_idx" ON "reports" USING btree ("reporter_fingerprint","created_at");