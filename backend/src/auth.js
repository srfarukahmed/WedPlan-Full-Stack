import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { createLocalJWKSet, jwtVerify } from "jose";
import { userKey } from "./db.js";
import { fail } from "./validation.js";

export const validPassword = (value) => typeof value === "string" && value.length >= 6 && /[A-Z]/.test(value) && /[a-z]/.test(value);

function jwksModel(secret) {
  // Isolate encrypted signing keys when the Better Auth secret changes.
  const version = createHash("sha256").update("wedplan-jwks:").update(secret).digest("hex").slice(0, 16);
  return "wedplan_jwks_" + version;
}

export function createAuth(config, stores, verifyImage) {
  return betterAuth({
    appName: "WedPlan",
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [...new Set([config.FRONTEND_URL, config.BETTER_AUTH_URL])],
    database: mongodbAdapter(stores.db, { client: stores.client }),
    emailAndPassword: { enabled: true, minPasswordLength: 6, maxPasswordLength: 128 },
    advanced: { useSecureCookies: config.BETTER_AUTH_URL.startsWith("https:"), ipAddress: { ipAddressHeaders: ["x-wedplan-client-ip"] } },
    socialProviders: config.GOOGLE_CLIENT_ID ? { google: { clientId: config.GOOGLE_CLIENT_ID, clientSecret: config.GOOGLE_CLIENT_SECRET } } : {},
    user: {
      modelName: "users",
      additionalFields: {
        role: { type: "string", defaultValue: "customer" },
        isBlocked: { type: "boolean", defaultValue: false, input: false },
        businessName: { type: "string", required: false, input: false },
        phone: { type: "string", required: false, input: false },
        bio: { type: "string", required: false, input: false },
      },
    },
    rateLimit: { enabled: true, window: 60, max: 100, customRules: {
      "/sign-in/email": { window: 60, max: 12 }, "/sign-up/email": { window: 60, max: 8 },
    } },
    plugins: [jwt({ schema: { jwks: { modelName: jwksModel(config.BETTER_AUTH_SECRET) } }, jwt: {
      issuer: config.BETTER_AUTH_URL, audience: "wedplan-api", expirationTime: "5m",
      definePayload: ({ user, session }) => ({ sub: user.id, sid: session.id }),
    } })],
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path === "/sign-up/email") {
          const { role = "customer", image, password, name } = context.body ?? {};
          if (!["vendor", "customer"].includes(role)) throw new APIError("BAD_REQUEST", { message: "Choose a customer or vendor account." });
          if (!validPassword(password)) throw new APIError("BAD_REQUEST", { message: "Use at least six characters, including uppercase and lowercase letters." });
          if (typeof name !== "string" || !name.trim() || name.trim().length > 100) throw new APIError("BAD_REQUEST", { message: "Enter a name up to 100 characters." });
          if (image && !await verifyImage(image, "registration")) throw new APIError("BAD_REQUEST", { message: "Upload a valid profile image." });
          return { context: { ...context, body: { ...context.body, name: name.trim(), role } } };
        }
        // The application profile endpoint is the only public profile writer.
        if (context.path === "/update-user") throw new APIError("FORBIDDEN", { message: "Use WedPlan profile settings." });
      }),
    },
    databaseHooks: {
      user: { create: { before: async (user) => ({ data: { ...user, role: user.role === "vendor" ? "vendor" : "customer", isBlocked: false } }) } },
      session: { create: { before: async (session) => {
        const user = await stores.users.findOne(userKey(session.userId));
        if (user?.isBlocked) throw new APIError("FORBIDDEN", { message: "This account has been blocked." });
      } } },
    },
  });
}

export function protect(auth, config, stores, ...roles) {
  return async (req, _res, next) => {
    const match = /^Bearer (\S+)$/i.exec(req.get("authorization") ?? "");
    if (!match) throw fail(401, "Sign in to continue.");
    const keys = createLocalJWKSet(await auth.api.getJwks());
    let payload;
    try {
      ({ payload } = await jwtVerify(match[1], keys, { issuer: config.BETTER_AUTH_URL, audience: "wedplan-api", requiredClaims: ["sub", "exp", "sid"] }));
    } catch { throw fail(401, "Your session is invalid or expired."); }
    const user = await stores.users.findOne(userKey(payload.sub));
    if (!user) throw fail(401, "Sign in to continue.");
    if (user.isBlocked || (roles.length && !roles.includes(user.role))) throw fail(403, "You do not have access to this action.");
    const current = await auth.api.getSession({ headers: new Headers({ cookie: req.get("cookie") ?? "" }) });
    if (!current || current.user.id !== payload.sub || current.session.id !== payload.sid) throw fail(401, "Sign in to continue.");
    req.user = user;
    next();
  };
}