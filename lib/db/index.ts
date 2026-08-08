import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const isDbConfigured = Boolean(process.env.DATABASE_URL);

export class DbNotConfiguredError extends Error {
  constructor() {
    super("Keine Datenbank konfiguriert. Bitte DATABASE_URL setzen.");
    this.name = "DbNotConfiguredError";
  }
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Lazy: only touches process.env.DATABASE_URL when a query actually runs,
// so builds/pages that never query still work without it being set.
export function getDb() {
  if (!isDbConfigured) throw new DbNotConfiguredError();
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return _db;
}
