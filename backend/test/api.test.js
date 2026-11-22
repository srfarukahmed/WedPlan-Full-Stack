import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Stripe from "stripe";
import { connectDatabase } from "../src/db.js";
import { createApp } from "../src/app.js";

const uri = process.env.WEDPLAN_TEST_MONGODB_URI;
test("MongoDB API lifecycle, authenticated role boundaries, GridFS and signed Stripe events", { skip: !uri, timeout: 60000 }, async () => {
  const signing = new Stripe("sk_test_wedplan_example");
  const checkoutId = "cs_test_FarukCheckoutExample123";
  const subscription = {
    id: "sub_faruk_123", created: Math.floor(Date.now() / 1000) - 1, status: "active",
    items: { data: [{ price: { id: "price_test" }, current_period_end: Math.floor(Date.now() / 1000) + 3600 }] },
  };
  const checkout = { id: checkoutId, status: "open", url: "https://checkout.stripe.com/c/pay/faruk", currency: "usd", amount_total: 2490 };
  let rejectCheckout = true;
  let rejectCheckoutLookup = false;
  let checkoutCreations = 0;
  const stripe = {
    webhooks: signing.webhooks,
    checkout: { sessions: {
      create: async (params) => {
        if (rejectCheckout) {
          rejectCheckout = false;
          throw Object.assign(new Error("Test price rejected"), { type: "StripeInvalidRequestError" });
        }
        checkoutCreations++;
        checkout.metadata = params.metadata;
        checkout.client_reference_id = params.client_reference_id;
        subscription.metadata = params.subscription_data.metadata;
        return checkout;
      },
      retrieve: async () => {
        if (rejectCheckoutLookup) throw Object.assign(new Error("Test access interrupted"), { type: "StripePermissionError" });
        return checkout;
      },
    } },
    prices: { retrieve: async () => ({ active: true, livemode: false, type: "recurring", recurring: { interval: "month", interval_count: 1 }, currency: "usd", unit_amount: 2490 }) },
    subscriptions: {
      retrieve: async () => subscription,
      update: async (_id, options) => {
        subscription.cancel_at_period_end = options.cancel_at_period_end;
        return subscription;
      },
      cancel: async (_id, options) => {
        assert.deepEqual(options, { invoice_now: false, prorate: false });
        subscription.status = "canceled";
        return subscription;
      },
    },
  };
  const config = {
    MONGODB_URI: uri, MONGODB_DB: "wedplan_test_" + randomUUID().replaceAll("-", ""),
    BETTER_AUTH_SECRET: "testing-only-faruk-ahmed-auth-secret-2026", STRIPE_WEBHOOK_SECRET: "whsec_dev_integration",
    STRIPE_PRICE_ID: "price_test", FRONTEND_URL: "http://localhost:3000",
    GOOGLE_CLIENT_ID: "wedplan-fixture.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "local-google-fixture",
  };
  const stores = await connectDatabase(config);
  let server;
  try {
    const port = Number(process.env.WEDPLAN_TEST_PORT || 4137);
    const base = "http://localhost:" + port;
    Object.assign(config, { PUBLIC_API_URL: base, BETTER_AUTH_URL: base });
    const { app } = createApp(config, stores, { stripe });
    server = app.listen(port);
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const call = async (path, { method = "GET", body, session, expect = 200, headers = {} } = {}) => {
      const response = await fetch(base + path, { method, headers: {
        origin: config.FRONTEND_URL,
        ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Cookie: session.cookie, ...(session.token ? { Authorization: "Bearer " + session.token } : {}) } : {}),
        ...headers,
      }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
      const content = response.headers.get("content-type")?.includes("json") ? await response.json() : await response.text();
      assert.equal(response.status, expect, path + " " + JSON.stringify(content));
      return { response, content };
    };
    const signup = (role, alias = role, extra = {}) => call("/api/auth/sign-up/email", {
      method: "POST", body: { name: "Faruk Ahmed", email: alias + "@farukahmed.example", password: "FarukTesting2026", role, ...extra },
      expect: role === "admin" ? 400 : 200,
    });
    const authenticated = async (response) => {
      const cookie = response.headers.getSetCookie().map((line) => line.split(";")[0]).join("; ");
      assert.match(cookie, /better-auth\.session_token=/);
      const { content } = await call("/api/auth/token", { session: { cookie } });
      assert.ok(content.token);
      return { cookie, token: content.token };
    };
    const login = async (alias) => authenticated((await call("/api/auth/sign-in/email", {
      method: "POST", body: { email: alias + "@farukahmed.example", password: "FarukTesting2026" },
    })).response);
    const upload = async (session, purpose, file, expect = 201) => {
      const body = new FormData();
      body.set("purpose", purpose);
      body.set("image", new Blob([file], { type: "image/jpeg" }), "wedding.jpg");
      return (await call("/api/uploads", { method: "POST", body, session, expect })).content;
    };
    const details = async (session) => (await call("/api/dashboard", { session })).content;
    await call("/health");
    assert.deepEqual((await call("/api/integrations")).content, { google: true, stripe: true });
    const oauth = await call("/api/auth/sign-in/social", { method: "POST", body: {
      provider: "google",
      callbackURL: config.FRONTEND_URL + "/dashboard",
      errorCallbackURL: config.FRONTEND_URL + "/sign-in?oauth=google",
    } });
    const authorization = new URL(oauth.content.url);
    assert.equal(authorization.origin, "https://accounts.google.com");
    assert.equal(authorization.searchParams.get("redirect_uri"), base + "/api/auth/callback/google");
    await signup("admin");
    const photo = await readFile(new URL("../seed-assets/1.jpg", import.meta.url));
    const avatar = await upload(null, "registration", photo);
    await signup("customer", "customer", { image: avatar.url });
    await signup("vendor");
    await signup("vendor", "other-vendor");
    await signup("customer", "admin");
    await stores.users.updateOne({ email: "admin@farukahmed.example" }, { $set: { role: "admin" } });
    const [customer, vendor, admin, outsider] = await Promise.all(["customer", "vendor", "admin", "other-vendor"].map(login));
    assert.equal((await call("/api/profile", { session: customer })).content.image, avatar.url);
    await stores.users.updateOne({ email: "customer@farukahmed.example" }, { $set: { image: avatar.url.replace(base, "http://localhost:4000") } });
    assert.equal((await call("/api/profile", { session: customer })).content.image, avatar.url);
    await call("/api/profile", { session: customer, method: "PATCH", body: { name: "Faruk Ahmed", role: "admin" }, expect: 400 });
    await call("/api/profile", { session: { ...vendor, token: "invalid.jwt.token" }, expect: 401 });
    await call("/api/dashboard", { session: { ...vendor, cookie: "" }, expect: 401 });
    await upload(vendor, "service", new TextEncoder().encode("not-an-image"), 400);
    await upload(customer, "service", photo, 403);
    const image = await upload(vendor, "service", photo);
    const imageResponse = await fetch(image.url);
    assert.equal(imageResponse.status, 200);
    assert.equal(imageResponse.headers.get("content-type"), "image/webp");
    assert.ok((await imageResponse.arrayBuffer()).byteLength > 1000);
    assert.equal(await stores.db.collection("images.files").countDocuments(), 2);
    assert.ok(await stores.db.collection("images.chunks").countDocuments() >= 2);
    const listing = { serviceName: "Faruk Ahmed Photography", category: "Photography & Videography", description: "Edited wedding photography.", price: 35000, location: "Dhaka", images: [image.url] };
    await call("/api/vendor/services", { session: outsider, method: "POST", body: listing, expect: 400 });
    for (let index = 0; index < 4; index++) await call("/api/vendor/services", { session: vendor, method: "POST", body: { ...listing, serviceName: listing.serviceName + " " + index }, expect: 201 });
    const services = (await details(vendor)).services;
    assert.equal(services.length, 4);
    assert.equal((await call("/api/services")).content.length, 0);
    const svc = services[0].id;
    const patch = (path, session, body, expect = 204) => call(path, { session, method: "PATCH", body, expect });
    await patch("/api/admin/services/" + svc, vendor, { status: "approved" }, 403);
    await patch("/api/vendor/services/" + svc, outsider, { active: true }, 404);
    for (const { id } of services) await patch("/api/admin/services/" + id, admin, { status: "approved" });
    const publication = await Promise.all(services.map(({ id }) => fetch(base + "/api/vendor/services/" + id, {
      method: "PATCH", headers: { cookie: vendor.cookie, authorization: "Bearer " + vendor.token, "Content-Type": "application/json" }, body: JSON.stringify({ active: true }),
    })));
    assert.deepEqual(publication.map((response) => response.status).sort(), [204, 204, 204, 409]);
    const active = (await call("/api/services")).content;
    assert.equal(active.length, 3);
    const selected = active[0].id;
    await call("/api/services/" + selected, { expect: 401 });
    await call("/api/services/" + selected, { session: customer });
    const booking = { serviceId: selected, eventDate: "2099-01-01", eventLocation: "Dhaka", message: "Faruk Ahmad booking test" };
    await call("/api/bookings", { session: vendor, method: "POST", body: booking, expect: 403 });
    await call("/api/bookings", { session: customer, method: "POST", body: booking, expect: 201 });
    await call("/api/bookings", { session: customer, method: "POST", body: booking, expect: 409 });
    const entry = (await details(customer)).bookings[0];
    await patch("/api/bookings/" + entry.id, outsider, { status: "accepted" }, 404);
    await patch("/api/bookings/" + entry.id, vendor, { status: "accepted" });
    await patch("/api/bookings/" + entry.id, customer, { status: "cancelled" }, 409);
    await call("/api/bookings", { session: customer, method: "POST", body: { ...booking, eventDate: "2099-01-02" }, expect: 201 });
    await patch("/api/bookings/" + (await details(customer)).bookings[0].id, customer, { status: "cancelled" });
    const userId = (await call("/api/profile", { session: customer })).content.id;
    await patch("/api/admin/users/" + userId, admin, { isBlocked: true });
    await call("/api/profile", { session: customer, expect: 403 });
    await patch("/api/admin/users/" + userId, admin, { isBlocked: false });

    await call("/api/payments/plan", { session: customer, expect: 403 });
    const freePlan = (await call("/api/payments/plan", { session: vendor })).content;
    assert.equal(freePlan.profile.subscriptionPlan, "free");
    assert.equal(freePlan.price.amount, 24.9);
    await patch("/api/payments/plan", vendor, { action: "end-now" }, 409);
    await call("/api/payments/checkout", { session: customer, method: "POST", expect: 403 });
    await call("/api/payments/checkout", { session: vendor, method: "POST", expect: 502 });
    assert.equal(await stores.transactions.countDocuments({ status: "failed", checkoutOpen: false }), 1);
    await call("/api/payments/checkout", { session: vendor, method: "POST" });
    const payment = "/api/payments/status?session_id=" + checkoutId;
    assert.equal((await call(payment, { session: vendor })).content.status, "pending");
    rejectCheckoutLookup = true;
    await call("/api/payments/checkout", { session: vendor, method: "POST", expect: 502 });
    const checkoutDuringLookupFailure = await stores.transactions.findOne({ stripeSessionId: checkoutId });
    assert.equal(checkoutDuringLookupFailure.status, "pending");
    assert.equal(checkoutDuringLookupFailure.checkoutOpen, true);
    rejectCheckoutLookup = false;
    await call("/api/payments/checkout", { session: vendor, method: "POST" });
    assert.equal(checkoutCreations, 1);
    await call(payment, { session: outsider, expect: 404 });
    const webhook = async (type, data, valid = true) => {
      const payload = JSON.stringify({ id: "evt_" + randomUUID(), type, created: Math.floor(Date.now() / 1000), livemode: false, data: { object: data } });
      const header = valid ? signing.webhooks.generateTestHeaderString({ payload, secret: config.STRIPE_WEBHOOK_SECRET }) : "bad-signature";
      const response = await fetch(base + "/api/payments/webhook", { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": header }, body: payload });
      assert.equal(response.status, valid ? 200 : 400, await response.text());
    };
    // Local checkout expiry must never replace a completed Stripe session awaiting its webhook.
    await stores.transactions.updateOne({ stripeSessionId: checkoutId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    checkout.status = "complete";
    await call("/api/payments/checkout", { session: vendor, method: "POST", expect: 409 });
    assert.equal((await stores.transactions.findOne({ stripeSessionId: checkoutId })).status, "pending");
    config.STRIPE_PRICE_ID = "price_replacement";
    const success = { ...checkout, mode: "subscription", payment_status: "paid", subscription: subscription.id };
    await webhook("checkout.session.completed", success, false);
    assert.equal((await call("/api/profile", { session: vendor })).content.subscriptionPlan, "free");
    await webhook("checkout.session.completed", success);
    await webhook("checkout.session.completed", success);
    config.STRIPE_PRICE_ID = "price_test";
    assert.equal((await call(payment, { session: vendor })).content.status, "paid");
    assert.equal((await call("/api/profile", { session: vendor })).content.subscriptionPlan, "premium");
    assert.equal((await details(admin)).transactions.length, 1);
    const renewal = { id: "in_faruk_renewal", billing_reason: "subscription_cycle", subscription: subscription.id, currency: "usd", amount_paid: 2490, created: Math.floor(Date.now() / 1000) };
    await webhook("invoice.paid", renewal);
    await webhook("invoice.paid", renewal);
    assert.equal((await details(admin)).transactions.length, 2);
    const inactive = (await details(vendor)).services.find((item) => !item.active);
    await patch("/api/vendor/services/" + inactive.id, vendor, { active: true });
    assert.equal((await call("/api/services")).content.length, 4);
    const beforeSelection = (await call("/api/payments/plan", { session: vendor })).content.profile;
    const choose = (account, action, expect = 200) => call("/api/payments/plan", { method: "PATCH", session: account, body: { action }, expect });
    await choose(customer, "choose-premium", 403);
    await choose(outsider, "choose-premium", 409);
    const selectedFree = (await choose(vendor, "choose-free")).content;
    assert.equal(selectedFree.subscriptionPlan, "free");
    assert.equal(selectedFree.premiumValidUntil, beforeSelection.premiumValidUntil);
    assert.equal(selectedFree.cancelAtPeriodEnd, beforeSelection.cancelAtPeriodEnd);
    assert.equal((await call("/api/services")).content.length, 3);
    assert.equal((await details(vendor)).services.filter(item => item.pausedByPlan).length, 1);
    await call("/api/payments/checkout", { session: vendor, method: "POST", expect: 409 });
    const selectedPremium = (await choose(vendor, "choose-premium")).content;
    assert.equal(selectedPremium.subscriptionPlan, "premium");
    assert.equal(selectedPremium.premiumValidUntil, beforeSelection.premiumValidUntil);
    assert.equal((await call("/api/services")).content.length, 4);
    assert.equal((await details(admin)).transactions.length, 2);
    const vendorRecord = await stores.users.findOne({ email: "vendor@farukahmed.example" });
    await stores.users.updateOne({ _id: vendorRecord._id }, { $set: { subscriptionExpiresAt: new Date(Date.now() - 60000) } });
    assert.equal((await call("/api/services")).content.length, 3);
    await stores.users.updateOne({ _id: vendorRecord._id }, { $set: { subscriptionExpiresAt: vendorRecord.subscriptionExpiresAt } });
    const ending = (await call("/api/payments/plan", { method: "PATCH", session: vendor, body: { action: "end-renewal" } })).content;
    assert.equal(ending.cancelAtPeriodEnd, true);
    const scheduled = (await call("/api/payments/plan", { session: vendor })).content.profile;
    assert.equal(scheduled.subscriptionPlan, "premium");
    assert.equal(scheduled.cancelAtPeriodEnd, true);
    const renewed = (await call("/api/payments/plan", { method: "PATCH", session: vendor, body: { action: "resume-renewal" } })).content;
    assert.equal(renewed.cancelAtPeriodEnd, false);
    const downgraded = (await call("/api/payments/plan", { method: "PATCH", session: vendor, body: { action: "end-now" } })).content;
    assert.equal(downgraded.subscriptionPlan, "free");
    await webhook("customer.subscription.deleted", subscription);
    assert.equal((await call("/api/profile", { session: vendor })).content.subscriptionPlan, "free");
    assert.equal((await call("/api/services")).content.length, 3);
    assert.deepEqual((await call(payment, { session: vendor })).content, { status: "paid", premiumActive: false });
    // Exercise the remaining write paths in the disposable test database.
    const newPhoto = await upload(customer, "profile", photo);
    await patch("/api/profile", customer, { name: "Faruk Ahmed Test", phone: "01700000000", bio: "Updated profile", image: newPhoto.url });
    const updatedProfile = (await call("/api/profile", { session: customer })).content;
    assert.equal(updatedProfile.name, "Faruk Ahmed Test");
    assert.equal(updatedProfile.phone, "01700000000");
    assert.equal(updatedProfile.image, newPhoto.url);
    await patch("/api/profile", vendor, { name: "Faruk Ahmed", businessName: "Sample Wedding Studio" });
    assert.equal((await call("/api/profile", { session: vendor })).content.businessName, "Sample Wedding Studio");

    await patch("/api/admin/services/" + selected, admin, { status: "rejected" });
    await call("/api/services/" + selected, { session: customer, expect: 404 });
    await patch("/api/admin/services/" + selected, admin, { status: "approved" });
    const freeSlot = (await details(vendor)).services.find(item => item.id !== selected && item.active);
    await patch("/api/vendor/services/" + freeSlot.id, vendor, { active: false });
    await patch("/api/vendor/services/" + selected, vendor, { active: true });
    await patch("/api/vendor/services/" + selected, vendor, { active: false });
    await call("/api/services/" + selected, { session: customer, expect: 404 });
    await patch("/api/vendor/services/" + selected, vendor, { active: true });

    await call("/api/bookings", { session: customer, method: "POST", body: { ...booking, eventDate: "2099-01-03" }, expect: 201 });
    const rejectedBooking = (await details(customer)).bookings.find(item => item.eventDate === "2099-01-03");
    await patch("/api/bookings/" + rejectedBooking.id, vendor, { status: "rejected" });
    assert.equal((await details(customer)).bookings.find(item => item.id === rejectedBooking.id).status, "rejected");

    const edited = { ...listing, serviceName: "Faruk Ahmed Updated Listing" };
    await call("/api/vendor/services/" + selected, { session: vendor, method: "PUT", body: edited, expect: 204 });
    assert.equal((await details(vendor)).services.find(item => item.id === selected).status, "pending");
    await call("/api/vendor/services/" + selected, { session: outsider, method: "DELETE", expect: 404 });
    await call("/api/vendor/services/" + selected, { session: vendor, method: "DELETE", expect: 204 });
    assert.ok((await details(customer)).bookings.some(item => item.service.id === selected));
    const adminDelete = (await details(vendor)).services[0].id;
    await call("/api/admin/services/" + adminDelete, { session: admin, method: "DELETE", expect: 204 });
    assert.ok(!(await details(vendor)).services.some(item => item.id === adminDelete));

    await call("/api/auth/sign-out", { session: vendor, method: "POST", body: {} });
    await call("/api/profile", { session: vendor, expect: 401 });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await stores.db.dropDatabase();
    await stores.client.close();
  }
});