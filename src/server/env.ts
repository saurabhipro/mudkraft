import { z } from "zod";

/**
 * Server-only environment. Importing this module from a client component will
 * fail the build, which is the intent — these values must never reach the browser.
 *
 * Validation is eager: a misconfigured deployment should fail at boot with a
 * readable message rather than at the first database query with a stack trace.
 */
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
