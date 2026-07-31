ALTER TABLE "admins" ADD COLUMN "username" varchar(80);--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_username_unique" UNIQUE("username");