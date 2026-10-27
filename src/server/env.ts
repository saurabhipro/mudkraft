import { z } from "zod";

/**
 * Server-only environment. Importing this module from a client component will
 * fail the build, which is the intent — these values must never reach the browser.
 *
 * Validation is eager: a misconfigured deployment should fail at boot with a
 * readable message rather than at the first database query with a stack trace.
 */
function emptyAsUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required — copy the pooled connection string from Neon"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters — generate with `openssl rand -base64 32`"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be an absolute URL, e.g. http://localhost:3000"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // SMTP is optional: without it the app boots normally and email sends are
  // skipped with a warning. Empty strings count as "not set" so a placeholder
  // line in .env does not fail validation.
  SMTP_HOST: emptyAsUndefined(z.string()),
  SMTP_PORT: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : Number(value)),
    z.number().int().positive().optional(),
  ),
  SMTP_USER: emptyAsUndefined(z.string()),
  SMTP_PASS: emptyAsUndefined(z.string()),
  SMTP_FROM: emptyAsUndefined(z.string().email("SMTP_FROM must be an email address")),

  // Razorpay is optional in the same spirit as SMTP: without keys the app boots
  // and the gateway payment option reports itself unavailable instead of
  // crashing. Test keys (rzp_test_...) and live keys (rzp_live_...) use the
  // exact same code path.
  RAZORPAY_KEY_ID: emptyAsUndefined(z.string()),
  RAZORPAY_KEY_SECRET: emptyAsUndefined(z.string()),
  // Set only once the webhook is registered in the Razorpay dashboard.
  RAZORPAY_WEBHOOK_SECRET: emptyAsUndefined(z.string()),

  // Bikriup runs the shop's back office: catalogue, stock, orders, reviews and
  // enquiries. Set BIKRIUP_API_URL (e.g. https://mudkraft.bikriup.com/api/v1) and
  // the secret key from Bikriup › Shop › Website & API to switch the site over;
  // without them the site keeps reading its own database.
  BIKRIUP_API_URL: emptyAsUndefined(z.string().url("BIKRIUP_API_URL must be an absolute URL")),
  BIKRIUP_SECRET_KEY: emptyAsUndefined(z.string().startsWith("bk_sec_", "BIKRIUP_SECRET_KEY starts with bk_sec_")),
  // The webhook signing secret (whsec_…) from the same page.
  BIKRIUP_WEBHOOK_SECRET: emptyAsUndefined(z.string()),
  // Where /admin sends staff, e.g. https://mudkraft.bikriup.com/admin
  BIKRIUP_ADMIN_URL: emptyAsUndefined(z.string().url()),
  // Public address that serves Bikriup's /uploads photos (defaults to the admin address's host).
  BIKRIUP_MEDIA_URL: emptyAsUndefined(z.string().url()),

  // SMS (MSG91) is optional: without it OTPs are printed to the server console
  // — the whole delivery-verification flow stays demoable with zero setup.
  MSG91_AUTH_KEY: emptyAsUndefined(z.string()),
  MSG91_SENDER_ID: emptyAsUndefined(z.string()),
  MSG91_DLT_TEMPLATE_ID: emptyAsUndefined(z.string()),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment:\n${details}\n\nSee .env.example for the full list.`);
}

export const serverEnv = parsed.data;

/**
 * The Cloudinary cloud name is deliberately public — it appears in every
 * delivery URL — so it lives in a NEXT_PUBLIC_ var usable from both sides.
 */
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
