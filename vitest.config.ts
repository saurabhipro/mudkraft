import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Unit tests for the server code that moves money: signature checks,
 * settlement, the Razorpay webhook, env rules, redaction and rate limits.
 * Everything external (Razorpay, Bikriup, the database, email) is mocked;
 * no test needs a network or real secrets. Run with `npm test`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
