import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "../../db/schema";
import { getOptionalDatabaseUrl, getRequiredDatabaseUrl } from "../env";

type Database = PostgresJsDatabase<typeof schema>;

let queryClient: Sql | null = null;
let database: Database | null = null;

function createDatabase(url: string) {
  queryClient = postgres(url, {
    max: 5,
    prepare: false
  });
  database = drizzle(queryClient, { schema });
  return database;
}

export function getDb() {
  const databaseUrl = getRequiredDatabaseUrl();
  return database ?? createDatabase(databaseUrl);
}

export function getDbOrNull() {
  const databaseUrl = getOptionalDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  return database ?? createDatabase(databaseUrl);
}

export function getQueryClient() {
  if (!queryClient) {
    getDb();
  }

  if (!queryClient) {
    throw new Error("Database client could not be initialized.");
  }

  return queryClient;
}
