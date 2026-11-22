import assert from "node:assert/strict";
import test from "node:test";
import { validPassword } from "../src/auth.js";
import { readConfig } from "../src/config.js";
import { effectivePlan } from "../src/db.js";
import { bookingSchema, profileSchema, reviewSchema, todayInDhaka } from "../src/validation.js";

test("Password policy, Dhaka date boundaries and protected update fields", () => {
  assert.equal(validPassword("FarukA"), true);
  assert.equal(validPassword("farukahmed"), false);
  assert.equal(validPassword("Aa"), false);
  assert.equal(todayInDhaka(new Date("2026-11-21T18:05:00Z")), "2026-11-22");
  assert.equal(bookingSchema.safeParse({ serviceId: "x", eventDate: "2027-02-29", eventLocation: "Dhaka" }).success, false);
  assert.equal(profileSchema.safeParse({ name: "Faruk Ahmed", role: "admin" }).success, false);
  assert.equal(reviewSchema.safeParse({ status: "approved", active: true }).success, false);
});
test("Incomplete provider credentials leave core features available", () => {
  const result = readConfig({
    MONGODB_URI: "mongodb://localhost:27017",
    FRONTEND_URL: "http://localhost:3000", PUBLIC_API_URL: "http://localhost:4000", BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "faruk-wedplan-local-test-only-auth-secret",
    GOOGLE_CLIENT_ID: " wedplan.apps.googleusercontent.com ", STRIPE_SECRET_KEY: "sk_live_example",
  });
  assert.equal(result.GOOGLE_CLIENT_ID, undefined);
  assert.equal(result.STRIPE_SECRET_KEY, undefined);
  assert.equal(result.integrationWarnings.length, 2);
});
test("Premium expires at the recorded Stripe period end", () => {
  const user = { subscriptionPlan: "premium", subscriptionExpiresAt: "2028-01-01T00:00:00Z" };
  const end = Date.parse(user.subscriptionExpiresAt);
  assert.equal(effectivePlan(user, end - 1), "premium");
  assert.equal(effectivePlan(user, end), "free");
});