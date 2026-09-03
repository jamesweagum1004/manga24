ALTER TABLE "tags" ADD COLUMN "name_fr" varchar(120);--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "name_de" varchar(120);--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "name_pt" varchar(120);--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "translations_generated_at" timestamp with time zone;