import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default(
    process.env.NODE_ENV === "production" ? "https://manga24.net" : "http://localhost:3000"
  )
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
});

const databaseUrlSchema = z.string().trim().url();

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getOptionalDatabaseUrl() {
  const rawValue = process.env.DATABASE_URL?.trim();
  if (!rawValue) {
    return null;
  }

  const result = databaseUrlSchema.safeParse(rawValue);
  if (!result.success) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  return result.data;
}

export function getRequiredDatabaseUrl() {
  const databaseUrl = getOptionalDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database commands and writes.");
  }

  return databaseUrl;
}
