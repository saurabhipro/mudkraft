import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Relative rather than aliased: this module is imported by standalone scripts
// (seed, price report) that run outside Next.js's module resolution.
import { serverEnv } from "../env";
import * as schema from "./schema";

/**
 * Neon's HTTP driver: one round trip per query, no connection pool to exhaust,
 * and it works in every Next.js runtime. It has no interactive transactions —
 * where a write must be atomic (creating an order and its items and its first
 * event, for example) use `db.batch([...])`, which Neon executes as a single
 * transaction. Generate UUIDs in application code so batched statements never
 * need to read back an id.
 */
const sql = neon(serverEnv.DATABASE_URL);

export const db = drizzle(sql, { schema, casing: "snake_case" });

export type Database = typeof db;
export { schema };
