/**
 * Single entry point for the Drizzle schema. drizzle-kit reads this file, and
 * the query builder needs every table and relation registered here for the
 * relational (`db.query.*`) API to resolve.
 */
export * from "./auth";
export * from "./pricing";
export * from "./catalog";
export * from "./reviews";
export * from "./orders";
export * from "./workshops";
