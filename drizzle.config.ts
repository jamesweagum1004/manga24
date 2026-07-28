import { defineConfig } from "drizzle-kit";
import { getRequiredDatabaseUrl } from "./lib/env";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getRequiredDatabaseUrl()
  },
  strict: true,
  verbose: true
});
