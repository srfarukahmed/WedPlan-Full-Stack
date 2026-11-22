import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
import { demo } from "./demo";
import { API_URL, demoMode, proxyMode } from "./platform-mode";

export { demoMode };
const AUTH_URL = proxyMode ? undefined : process.env.NEXT_PUBLIC_AUTH_URL?.replace(/\/$/, "") || API_URL;
const auth = !demoMode ? createAuthClient({
  baseURL: AUTH_URL,
  plugins: [jwtClient()],
  fetchOptions: { credentials: "include" },
}) : null;

function unwrap(result) {
  if (result.error) throw new Error(result.error.message || "Authentication failed.");
  return result.data;
}

async function request(path, { method = "GET", body, protectedRoute = true } = {}) {
  const headers = new Headers();
  if (body && !(body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (protectedRoute) {
    const credentials = unwrap(await auth.token({ fetchOptions: { cache: "no-store" } }));
    if (!credentials?.token) throw new Error("Your session could not be verified.");
    headers.set("Authorization", "Bearer " + credentials.token);
  }
  const response = await fetch(API_URL + path, { method, credentials: "include", cache: "no-store", headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || (response.status === 404 ? "This record could not be found." : response.status === 401 || response.status === 403 ? "You do not have access to this action." : "The request failed. Please try again."));
  return data;
}
const recordPath = (prefix, id) => prefix + "/" + encodeURIComponent(id);
const live = {
  async session() {
    const result = unwrap(await auth.getSession());
    if (!result?.user) return null;
    if (result.user.isBlocked) return result.user;
    return request("/api/profile");
  },
  async login(values) {
    unwrap(await auth.signIn.email(values));
    return this.session();
  },
  async signup(values) {
    unwrap(await auth.signUp.email(values));
    return this.session();
  },
  async google(callbackURL, errorCallbackURL) {
    unwrap(await auth.signIn.social({ provider: "google", callbackURL, errorCallbackURL }));
  },
  async logout() { unwrap(await auth.signOut()); },
  async upload(file, purpose) {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Choose a JPEG, PNG, WebP, or AVIF image under 5 MB.");
    const body = new FormData();
    body.set("image", file);
    body.set("purpose", purpose);
    const data = await request("/api/uploads", { method: "POST", body, protectedRoute: purpose !== "registration" });
    if (!data?.url) throw new Error("The image upload did not return a URL.");
    return data.url;
  },
  updateProfile: (body) => request("/api/profile", { method: "PATCH", body }),
  catalog: () => request("/api/services", { protectedRoute: false }),
  service: (id) => request(recordPath("/api/services", id)),
  dashboard: () => request("/api/dashboard"),
  saveService: (id, body) => request(id ? recordPath("/api/vendor/services", id) : "/api/vendor/services", { method: id ? "PUT" : "POST", body }),
  patchService: (id, body, role) => request(recordPath("/api/" + role + "/services", id), { method: "PATCH", body }),
  removeService: (id, role) => request(recordPath("/api/" + role + "/services", id), { method: "DELETE" }),
  book: (serviceId, body) => request("/api/bookings", { method: "POST", body: { ...body, serviceId } }),
  updateBooking: (id, status) => request(recordPath("/api/bookings", id), { method: "PATCH", body: { status } }),
  block: (id, isBlocked) => request(recordPath("/api/admin/users", id), { method: "PATCH", body: { isBlocked } }),
  subscription: () => request("/api/payments/plan"),
  changePlan: (action) => request("/api/payments/plan", { method: "PATCH", body: { action } }),
  async checkout() {
    const { url } = await request("/api/payments/checkout", { method: "POST" });
    if (new URL(url).origin !== "https://checkout.stripe.com") throw new Error("Invalid Stripe Checkout URL.");
    return url;
  },
  payment: (id) => request("/api/payments/status?session_id=" + encodeURIComponent(id)),
};
export const platform = demoMode ? demo : live;
export const loadIntegrations = () => demoMode
  ? Promise.resolve({ google: false, stripe: true })
  : request("/api/integrations", { protectedRoute: false });