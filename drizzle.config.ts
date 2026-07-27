import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so it does not get .env.local automatically.
// dotenv does not overwrite variables that are already set, so the first call wins.
config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  // Every column is named explicitly in the schema, so this only governs any
  // future column added without one. It must match the runtime client.
  casing: "snake_case",
  // Warn before generating a migration that would drop or truncate data.
  strict: true,
  verbose: true,
});
