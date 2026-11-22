export const categories = ["Photography & Videography", "Wedding Venues", "Decoration & Florist", "Catering Services", "Makeup & Styling", "Wedding Fashion"];

const listingData = [
  ["Ever After Photography", "The Still Frame", "Dhaka", 45000, 1, 0, "Candid, editorial wedding photography with a balance of quiet moments and joyful celebrations. Includes eight hours of coverage and an edited digital gallery."],
  ["The Glasshouse Garden", "Garden House Events", "Gazipur", 120000, 2, 1, "An open-air garden and light-filled reception space for up to 200 guests. Site visits, ceremony setup, and on-site venue coordination are included."],
  ["Wildflower Wedding Studio", "Wildflower Studio", "Dhaka", 38000, 3, 2, "Seasonal flowers, hand-tied bouquets, and custom installations tailored to your venue, palette, and ceremony."],
  ["The Celebration Table", "Saffron & Salt", "Chattogram", 65000, 4, 3, "Wedding catering with a customizable menu, tasting consultation, and staffed dinner service."],
  ["Soft Glam Bridal Studio", "Studio Noor", "Dhaka", 18000, 5, 4, "Bridal makeup and hair styling designed around your features, outfit, and ceremony. A trial appointment is included."],
  ["The Heirloom Collection", "House of Ayna", "Sylhet", 29000, 6, 5, "Made-to-measure wedding attire with traditional craftsmanship, a private fitting, and alterations."],
];

export const demoAccounts = [
  { id: "couple", name: "Faruk Ahmed", role: "customer", email: "customer@farukahmed.example" },
  { id: "vendor-1", name: "Faruk Ahmed", businessName: "Faruk Ahmed Wedding Studio", role: "vendor", email: "vendor@farukahmed.example", subscriptionPlan: "free" },
  { id: "admin", name: "Faruk Ahmed", role: "admin", email: "admin@farukahmed.example" },
];
export const demoPassword = "WedPlanDemo26";
export const visible = (service) => service.status === "approved" && service.active;
export const nextReviewStatuses = (status) => status === "approved" ? ["rejected"] : status === "rejected" ? ["pending", "approved"] : ["approved", "rejected"];

const users = [
  ...demoAccounts,
  ...listingData.slice(1).map(([, businessName], index) => ({
    id: "vendor-" + (index + 2), name: "Faruk Ahmed", businessName: "Faruk Ahmed " + businessName, role: "vendor", email: "vendor" + (index + 2) + "@farukahmed.example", subscriptionPlan: "free",
  })),
];
const services = listingData.map(([serviceName, businessName, location, price, photo, category, description], index) => ({
  id: "service-" + (index + 1), vendorId: "vendor-" + (index + 1), vendor: users.find((user) => user.id === "vendor-" + (index + 1)),
  serviceName, category: categories[category], location, price, description, images: ["/photos/" + photo + ".jpg", "/photos/" + photo + "-detail.jpg"],
  active: true, status: "approved", createdAt: "2026-01-01T00:00:00.000Z",
}));
const pendingService = {
  ...services[0], id: "service-review", serviceName: "Engagement Portraits", price: 18000,
  description: "A relaxed two-hour portrait session with an edited digital gallery.", status: "pending", active: false,
};
const initial = {
  users, services: [...services, pendingService], bookings: [{
    id: "booking-demo", serviceId: "service-1", service: services[0], vendorId: "vendor-1", vendor: users[1],
    customerId: "couple", customer: users[0], eventDate: "2030-03-15", eventLocation: "Dhaka",
    message: "We would love a mix of candid and family portraits.", status: "pending", createdAt: "2026-01-02T00:00:00.000Z",
  }], transactions: [], checkout: null,
};

const storageKey = "wedplan-data-v1";
const sessionKey = "wedplan-session-v1";
const record = (items, id) => items.find((item) => item.id === id);
const slug = (text) => text.trim().toLowerCase();

function read() {
  return JSON.parse(localStorage.getItem(storageKey)) ?? structuredClone(initial);
}
function write(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}
function session(data) {
  return record(data.users, localStorage.getItem(sessionKey)) ?? null;
}
function requireUser(data, role) {
  const user = session(data);
  if (!user || user.isBlocked || (role && user.role !== role)) throw new Error("You do not have access to this action.");
  return user;
}
function authenticate(user) {
  if (user.isBlocked) throw new Error("This account has been blocked.");
  localStorage.setItem(sessionKey, user.id);
  return user;
}
async function digest(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
const demoEntitled = (user) => user?.subscriptionPlan === "premium" && Date.parse(user.subscriptionExpiresAt) > Date.now();
const demoPlan = (user) => demoEntitled(user) && user.planPreference !== "free" ? "premium" : "free";
function publicUser(user) {
  if (!user) return null;
  const { passwordHash, salt, ...profile } = user;
  return { ...profile, subscriptionPlan: demoPlan(user), premiumValidUntil: demoEntitled(user) ? user.subscriptionExpiresAt : null };
}
function publishedIds(data) {
  const counts = new Map();
  return new Set(data.services.filter(visible).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).filter((service) => {
    const vendor = record(data.users, service.vendorId);
    if (!vendor || vendor.isBlocked) return false;
    if (demoPlan(vendor) === "premium") return true;
    const count = counts.get(vendor.id) ?? 0;
    counts.set(vendor.id, count + 1);
    return count < 3;
  }).map((service) => service.id));
}
function enrich(data, items) {
  return items.map((service) => ({ ...service, vendor: publicUser(record(data.users, service.vendorId)) }));
}
function checkLimit(data, vendor, service) {
  const active = data.services.filter((item) => item.vendorId === vendor.id && item.id !== service.id && visible(item));
  if (visible(service) && demoPlan(vendor) !== "premium" && active.length >= 3) {
    throw new Error("Free vendors can publish up to three active services.");
  }
}

export const demo = {
  async session() { return publicUser(session(read())); },
  async login({ email, password }) {
    const user = read().users.find((item) => item.email === slug(email));
    const valid = user && (user.passwordHash ? user.passwordHash === await digest(user.salt + password) : password === demoPassword);
    if (!valid) throw new Error("Incorrect email or password.");
    return publicUser(authenticate(user));
  },
  async signup({ name, email, password, image, role }) {
    const salt = crypto.randomUUID();
    const passwordHash = await digest(salt + password);
    const data = read();
    if (data.users.some((user) => user.email === slug(email))) throw new Error("This email is already registered.");
    const user = { id: crypto.randomUUID(), name, email: slug(email), image, role: role === "vendor" ? "vendor" : "customer", subscriptionPlan: "free", salt, passwordHash };
    data.users.push(user);
    write(data);
    return publicUser(authenticate(user));
  },
  async logout() { localStorage.removeItem(sessionKey); },
  async upload(file) {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Choose a JPEG, PNG, WebP, or AVIF image under 5 MB.");
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/webp", 0.76);
  },
  async updateProfile(profile) {
    const data = read();
    const user = requireUser(data);
    const { name, image, phone, businessName, bio } = profile;
    Object.assign(user, { name, image, phone, bio, ...(user.role === "vendor" ? { businessName } : {}) });
    write(data);
    return publicUser(user);
  },
  async catalog() {
    const data = read();
    const allowed = publishedIds(data);
    return enrich(data, data.services.filter((item) => allowed.has(item.id)));
  },
  async service(id) {
    requireUser(read());
    const item = (await this.catalog()).find((service) => service.id === id);
    if (!item) throw new Error("This service is unavailable or could not be found.");
    return item;
  },
  async dashboard() {
    const data = read();
    const user = requireUser(data);
    const allowed = publishedIds(data);
    const bookings = data.bookings.filter((item) => user.role === "vendor" ? item.vendorId === user.id : item.customerId === user.id);
    return {
      services: enrich(data, data.services.filter((item) => user.role === "admin" || (user.role === "vendor" && item.vendorId === user.id))).map((item) => visible(item) && !allowed.has(item.id) && !record(data.users, item.vendorId)?.isBlocked ? { ...item, active: false, pausedByPlan: true } : item),
      bookings: bookings.map((item) => ({
        ...item, service: record(data.services, item.serviceId) ?? item.service,
        vendor: publicUser(record(data.users, item.vendorId)) ?? item.vendor,
        customer: publicUser(record(data.users, item.customerId)) ?? item.customer,
      })),
      users: user.role === "admin" ? data.users.map(publicUser) : [],
      transactions: user.role === "admin" ? data.transactions.map((item) => ({ ...item, vendor: publicUser(record(data.users, item.vendorId)) })) : [],
    };
  },
  async saveService(id, changes) {
    const data = read();
    const vendor = requireUser(data, "vendor");
    const service = id ? record(data.services, id) : null;
    if (id && service?.vendorId !== vendor.id) throw new Error("Service not found.");
    if (service) {
      Object.assign(service, changes, { active: false, status: "pending" });
    } else {
      data.services.push({ ...changes, id: crypto.randomUUID(), vendorId: vendor.id, createdAt: new Date().toISOString(), status: "pending", active: false });
    }
    write(data);
  },
  async patchService(id, changes) {
    const data = read();
    const user = requireUser(data);
    const service = record(data.services, id);
    if (!service || (user.role !== "admin" && (user.role !== "vendor" || service.vendorId !== user.id))) throw new Error("Service not found.");
    if (changes.status && (user.role !== "admin" || !nextReviewStatuses(service.status).includes(changes.status))) throw new Error("This status transition is unavailable.");
    if (changes.active && (changes.status ?? service.status) !== "approved") throw new Error("Only approved services can be active.");
    const updated = { ...service, ...changes };
    if (updated.status !== "approved") updated.active = false;
    checkLimit(data, record(data.users, service.vendorId), updated);
    Object.assign(service, updated);
    write(data);
  },
  async removeService(id) {
    const data = read();
    const user = requireUser(data);
    const service = record(data.services, id);
    if (!service || (user.role !== "admin" && (user.role !== "vendor" || service.vendorId !== user.id))) throw new Error("Service not found.");
    data.services = data.services.filter((item) => item.id !== id);
    write(data);
  },
  async book(id, details) {
    const data = read();
    const customer = requireUser(data, "customer");
    const service = record(data.services, id);
    const vendor = service && record(data.users, service.vendorId);
    if (!service || !publishedIds(data).has(service.id) || vendor?.isBlocked || customer.id === service.vendorId) throw new Error("This service is unavailable for booking.");
    const duplicate = data.bookings.some((item) => item.serviceId === id && item.customerId === customer.id && item.eventDate === details.eventDate && ["pending", "accepted"].includes(item.status));
    if (duplicate) throw new Error("You already requested this service for that date.");
    data.bookings.push({
      ...details, id: crypto.randomUUID(), serviceId: id, vendorId: service.vendorId, customerId: customer.id,
      service, vendor: publicUser(vendor), customer: publicUser(customer), status: "pending", createdAt: new Date().toISOString(),
    });
    write(data);
  },
  async updateBooking(id, status) {
    const data = read();
    const user = requireUser(data);
    const item = record(data.bookings, id);
    const customerAction = user.role === "customer" && item?.customerId === user.id && status === "cancelled";
    const vendorAction = user.role === "vendor" && item?.vendorId === user.id && ["accepted", "rejected"].includes(status);
    if (item?.status !== "pending" || (!customerAction && !vendorAction)) throw new Error("This booking can no longer be changed.");
    item.status = status;
    write(data);
  },
  async block(id, isBlocked) {
    const data = read();
    const admin = requireUser(data, "admin");
    const user = record(data.users, id);
    if (!user || user.id === admin.id || user.role === "admin") throw new Error("This account cannot be changed.");
    user.isBlocked = isBlocked;
    write(data);
  },
  async subscription() {
    const data = read();
    const profile = requireUser(data, "vendor");
    return { profile: publicUser(profile), configured: true, price: { amount: 2490, currency: "bdt", interval: "month", count: 1 } };
  },
  async changePlan(action) {
    const data = read();
    const vendor = requireUser(data, "vendor");
    if (!demoEntitled(vendor)) throw new Error("This account has no unexpired Premium period.");
    if (action === "choose-free" || action === "choose-premium") {
      vendor.planPreference = action === "choose-free" ? "free" : "premium";
      write(data);
      return publicUser(vendor);
    }
    vendor.cancelAtPeriodEnd = action === "end-renewal";
    if (action === "end-now") {
      vendor.subscriptionPlan = "free";
      vendor.subscriptionExpiresAt = null;
      data.services.filter((item) => item.vendorId === vendor.id && visible(item)).slice(3).forEach((item) => { item.active = false; });
    }
    write(data);
    return publicUser(vendor);
  },
  async checkout() {
    const data = read();
    const vendor = requireUser(data, "vendor");
    if (demoEntitled(vendor)) throw new Error("This account already has paid Premium time.");
    data.checkout = { id: crypto.randomUUID(), vendorId: vendor.id };
    write(data);
    return "/payment/demo";
  },
  async completeCheckout(confirmed) {
    const data = read();
    const vendor = requireUser(data, "vendor");
    const checkout = data.checkout;
    if (checkout?.vendorId !== vendor.id) throw new Error("Start a demo checkout from your subscription page.");
    if (confirmed) {
      vendor.subscriptionPlan = "premium";
      vendor.planPreference = "premium";
      vendor.subscriptionExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
      vendor.cancelAtPeriodEnd = false;
      data.transactions.push({ id: checkout.id, vendorId: vendor.id, plan: "premium", amount: 2490, currency: "BDT", status: "paid", createdAt: new Date().toISOString() });
    }
    data.checkout = null;
    write(data);
  },
  async payment() {
    const data = read();
    const vendor = requireUser(data, "vendor");
    return { status: demoEntitled(vendor) ? "paid" : "pending", premiumActive: demoPlan(vendor) === "premium" };
  },
};