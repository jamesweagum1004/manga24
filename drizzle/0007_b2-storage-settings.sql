CREATE TABLE "storage_configs" (
	"format" "title_format" PRIMARY KEY NOT NULL,
	"bucket_name" varchar(160) NOT NULL,
	"endpoint" text NOT NULL,
	"region" varchar(80) NOT NULL,
	"key_id" varchar(255) NOT NULL,
	"encrypted_application_key" text NOT NULL,
	"bunny_public_url" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
