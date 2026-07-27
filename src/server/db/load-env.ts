import { config } from "dotenv";

/**
 * Side-effect module: loads .env.local then .env into process.env.
 *
 * Import this FIRST in any standalone script, before anything that reaches
 * src/server/env — that module validates eagerly at evaluation time and will
 * throw if the variables are not yet present. Module imports evaluate in source
 * order, so position matters here; do not let an import sorter move it.
 *
 * dotenv does not overwrite variables that are already set, so .env.local wins
 * over .env, and a real shell variable wins over both.
 */
config({ path: ".env.local" });
config({ path: ".env" });
