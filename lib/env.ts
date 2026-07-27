import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://manga24:manga24@localhost:5432/manga24"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
});
