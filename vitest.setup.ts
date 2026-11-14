/**
 * A complete, fake server environment so `src/server/env.ts` validates when a
 * test imports anything that reads it. None of these values reach a service.
 */
const testEnv: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0000",
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "test-google-id",
  GOOGLE_CLIENT_SECRET: "test-google-secret",
  CLOUDINARY_API_KEY: "test-cloudinary-key",
  CLOUDINARY_API_SECRET: "test-cloudinary-secret",
  RAZORPAY_KEY_ID: "rzp_test_UnitTestKey",
  RAZORPAY_KEY_SECRET: "unit-test-key-secret",
  RAZORPAY_WEBHOOK_SECRET: "unit-test-webhook-secret-0123456789abcdef",
  BIKRIUP_API_URL: "http://bikriup.test/api/v1",
  BIKRIUP_SECRET_KEY: "bk_sec_unittest",
  BIKRIUP_WEBHOOK_SECRET: "whsec_unittest",
};

for (const [key, value] of Object.entries(testEnv)) process.env[key] = value;
for (const key of [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "ALERT_EMAIL",
  "MSG91_AUTH_KEY",
]) {
  delete process.env[key];
}
