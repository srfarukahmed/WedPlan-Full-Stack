import { z } from "zod";

const optional = z.preprocess((value) => typeof value === "string" ? value.trim() || undefined : value, z.string().min(1).optional());
const origin = z.url().transform((value) => new URL(value).origin);
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1), MONGODB_DB: z.string().min(1).default("wedplan"),
  FRONTEND_URL: origin, PUBLIC_API_URL: origin, BETTER_AUTH_URL: origin,
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: optional, GOOGLE_CLIENT_SECRET: optional,
  STRIPE_SECRET_KEY: optional, STRIPE_WEBHOOK_SECRET: optional, STRIPE_PRICE_ID: optional,
  IMGBB_API_KEY: optional,
});
export function readConfig(env = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) throw new Error("Configure environment variables: " + result.error.issues.map((issue) => issue.path.join(".")).join(", "));
  const config = result.data;
  const integrationWarnings = [];
  if ((config.GOOGLE_CLIENT_ID || config.GOOGLE_CLIENT_SECRET)
      && (!config.GOOGLE_CLIENT_ID?.endsWith(".apps.googleusercontent.com") || !config.GOOGLE_CLIENT_SECRET)) {
    integrationWarnings.push("Google sign-in is disabled. Set the Google OAuth web client ID and client secret.");
    delete config.GOOGLE_CLIENT_ID;
    delete config.GOOGLE_CLIENT_SECRET;
  }
  if ((config.STRIPE_SECRET_KEY || config.STRIPE_WEBHOOK_SECRET || config.STRIPE_PRICE_ID)
      && (!/^(?:sk_test_|rk_test_|rkcs_test_)\S+$/.test(config.STRIPE_SECRET_KEY ?? "")
        || !/^whsec_\S+$/.test(config.STRIPE_WEBHOOK_SECRET ?? "")
        || !/^price_\S+$/.test(config.STRIPE_PRICE_ID ?? ""))) {
    integrationWarnings.push("Stripe checkout is disabled. Set a test API key, webhook signing secret and recurring price ID.");
    delete config.STRIPE_SECRET_KEY;
    delete config.STRIPE_WEBHOOK_SECRET;
    delete config.STRIPE_PRICE_ID;
  }
  return { ...config, integrationWarnings };
}