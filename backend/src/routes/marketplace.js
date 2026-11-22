import { randomUUID } from "node:crypto";
import { Router } from "express";
import { protect } from "../auth.js";
import { effectivePlan, person, userKey } from "../db.js";
import {
  blockSchema, bookingSchema, fail, listingSchema, profileSchema, ready, reviewSchema, statusSchema, todayInDhaka,
} from "../validation.js";

export function marketplace({ auth, config, stores, images }) {
  const router = Router();
  const { users, services, bookings, transactions, client } = stores;
  const guard = (...roles) => protect(auth, config, stores, ...roles);
  const idOf = (user) => String(user._id);
  const profileData = (user, privateFields) => user ? { ...person(user, privateFields), image: images.publicURL(user.image) } : null;
  const imageURLs = (values) => (values ?? []).map(images.publicURL);

  async function people(ids) {
    const keys = [...new Set(ids.filter(Boolean))].flatMap((id) => userKey(id)._id.$in);
    return new Map((await users.find({ _id: { $in: keys } }).toArray()).map((user) => [idOf(user), user]));
  }
  const serviceData = (service, vendor) => {
    const { _id, bookingRevision, ...listing } = service;
    return { id: _id, ...listing, images: imageURLs(listing.images), vendor: profileData(vendor) };
  };

  const publicationOrder = { createdAt: 1, _id: 1 };
  async function fitsPublicQuota(item, vendor, session) {
    if (effectivePlan(vendor) === "premium") return true;
    const allowed = await services.find({ vendorId: item.vendorId, ...ready }, { session }).sort(publicationOrder).limit(3).project({ _id: 1 }).toArray();
    return allowed.some(({ _id }) => _id === item._id);
  }
  function withinPublicationQuota(rows, vendors) {
    const listed = new Map();
    return rows.filter((row) => {
      const vendor = vendors.get(row.vendorId);
      if (!vendor) return false;
      if (effectivePlan(vendor) === "premium") return true;
      const count = listed.get(row.vendorId) ?? 0;
      if (count >= 3) return false;
      listed.set(row.vendorId, count + 1);
      return true;
    });
  }
  router.get("/services", async (_req, res) => {
    const rows = await services.find(ready).sort(publicationOrder).toArray();
    const vendors = await people(rows.map((service) => service.vendorId));
    const visible = withinPublicationQuota(rows, vendors).filter((row) => !vendors.get(row.vendorId).isBlocked);
    res.json(visible.reverse().map((row) => serviceData(row, vendors.get(row.vendorId))));
  });
  router.get("/services/:id", guard(), async (req, res) => {
    const item = await services.findOne({ _id: req.params.id, ...ready });
    const vendor = item && await users.findOne(userKey(item.vendorId));
    if (!vendor || vendor.isBlocked || !await fitsPublicQuota(item, vendor)) throw fail(404, "This service is unavailable or could not be found.");
    res.json(serviceData(item, vendor));
  });
  router.get("/profile", guard(), (req, res) => res.json(profileData(req.user, true)));
  router.patch("/profile", guard(), async (req, res) => {
    const profile = profileSchema.parse(req.body);
    if (req.user.role !== "vendor" && "businessName" in profile) throw fail(403, "Business profiles are available to vendors.");
    if (profile.image && profile.image !== images.publicURL(req.user.image) && !await images.owns(profile.image, "profile", idOf(req.user))) throw fail(400, "Upload a valid profile photo.");
    if (profile.image) profile.image = images.publicURL(profile.image);
    await users.updateOne({ _id: req.user._id }, { $set: { ...profile, updatedAt: new Date() } });
    res.sendStatus(204);
  });
  router.get("/dashboard", guard(), async (req, res) => {
    const user = req.user;
    const id = idOf(user);
    const admin = user.role === "admin";
    const vendor = user.role === "vendor";
    const [listings, requests, members, payments] = await Promise.all([
      admin || vendor ? services.find(admin ? {} : { vendorId: id }).sort({ createdAt: -1 }).toArray() : [],
      admin ? [] : bookings.find(vendor ? { vendorId: id } : { customerId: id }).sort({ createdAt: -1 }).toArray(),
      admin ? users.find({}).sort({ createdAt: -1 }).toArray() : [],
      admin ? transactions.find({ $or: [{ stripeSessionId: { $exists: true } }, { stripeInvoiceId: { $exists: true } }] }).sort({ createdAt: -1 }).toArray() : [],
    ]);
    const participants = await people([...listings.map((item) => item.vendorId), ...requests.flatMap((item) => [item.vendorId, item.customerId]), ...payments.map((item) => item.vendorId)]);
    const available = listings.filter((item) => item.status === "approved" && item.active);
    available.sort((a, b) => a.createdAt - b.createdAt || (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));
    const published = new Set(withinPublicationQuota(available, participants).map((item) => item._id));
    res.json({
      services: listings.map((item) => {
        const record = serviceData(item, participants.get(item.vendorId));
        return item.status === "approved" && item.active && !published.has(item._id)
          ? { ...record, active: false, pausedByPlan: true } : record;
      }),
      bookings: requests.map(({ _id, open, ...item }) => ({
        ...item, id: _id, service: item.service && { ...item.service, images: imageURLs(item.service.images) },
        vendor: profileData(participants.get(item.vendorId), true), customer: profileData(participants.get(item.customerId), true),
      })),
      users: members.map((member) => profileData(member, true)),
      transactions: payments.map(({ _id, vendorId, plan, amount, currency, status, createdAt }) => ({ id: _id, vendor: profileData(participants.get(vendorId), true), plan, amount, currency, status, createdAt })),
    });
  });

  async function validateListing(req) {
    const data = listingSchema.parse(req.body);
    if (!(await Promise.all(data.images.map((url) => images.owns(url, "service", idOf(req.user))))).every(Boolean)) throw fail(400, "Upload the service images before submitting.");
    return { ...data, images: imageURLs(data.images) };
  }
  router.post("/vendor/services", guard("vendor"), async (req, res) => {
    const data = await validateListing(req);
    await services.insertOne({ _id: randomUUID(), ...data, vendorId: idOf(req.user), status: "pending", active: false, createdAt: new Date() });
    res.sendStatus(201);
  });
  router.put("/vendor/services/:id", guard("vendor"), async (req, res) => {
    const data = await validateListing(req);
    const updated = await services.updateOne({ _id: req.params.id, vendorId: idOf(req.user) }, { $set: { ...data, status: "pending", active: false } });
    if (!updated.matchedCount) throw fail(404, "Service not found.");
    res.sendStatus(204);
  });
  function moderate(role) {
    return async (req, res) => {
      const changes = reviewSchema.parse(req.body);
      const scope = { _id: req.params.id, ...(role === "vendor" ? { vendorId: idOf(req.user) } : {}) };
      if ("status" in changes && role !== "admin") throw fail(403, "An admin must review listings.");
      await client.withSession((session) => session.withTransaction(async () => {
        const item = await services.findOne(scope, { session });
        if (!item) throw fail(404, "Service not found.");
        if (changes.active) {
          if (item.status !== "approved") throw fail(409, "Only approved services can be activated.");
          // Updating the vendor first serializes concurrent publication changes.
          const vendor = await users.findOneAndUpdate(userKey(item.vendorId), { $inc: { publicationRevision: 1 } }, { session, returnDocument: "after" });
          if (!vendor || vendor.isBlocked) throw fail(403, "This vendor cannot publish services.");
          const active = await services.countDocuments({ vendorId: item.vendorId, _id: { $ne: item._id }, ...ready }, { session });
          if (effectivePlan(vendor) !== "premium" && active >= 3) throw fail(409, "Free vendors can publish up to three active services.");
        }
        if (changes.status && changes.status !== "approved") changes.active = false;
        await services.updateOne(scope, { $set: changes }, { session });
      }));
      res.sendStatus(204);
    };
  }
  for (const role of ["admin", "vendor"]) {
    router.patch("/" + role + "/services/:id", guard(role), moderate(role));
    router.delete("/" + role + "/services/:id", guard(role), async (req, res) => {
      const result = await services.deleteOne({ _id: req.params.id, ...(role === "vendor" ? { vendorId: idOf(req.user) } : {}) });
      if (!result.deletedCount) throw fail(404, "Service not found.");
      res.sendStatus(204);
    });
  }

  router.post("/bookings", guard("customer"), async (req, res) => {
    const booking = bookingSchema.parse(req.body);
    if (booking.eventDate < todayInDhaka()) throw fail(400, "Choose today or a future event date.");
    try {
      await client.withSession((session) => session.withTransaction(async () => {
        const item = await services.findOneAndUpdate({ _id: booking.serviceId, ...ready }, { $inc: { bookingRevision: 1 } }, { session });
        const vendor = item && await users.findOne({ ...userKey(item.vendorId), role: "vendor", isBlocked: { $ne: true } }, { session });
        if (!item || !vendor || item.vendorId === idOf(req.user) || !await fitsPublicQuota(item, vendor, session)) throw fail(409, "This service is unavailable for booking.");
        const service = { id: item._id, serviceName: item.serviceName, images: item.images };
        await bookings.insertOne({ _id: randomUUID(), ...booking, service, vendorId: item.vendorId, customerId: idOf(req.user), status: "pending", open: true, createdAt: new Date() }, { session });
      }));
    } catch (error) {
      if (error.code === 11000) throw fail(409, "You already have an active request for this service and date.");
      throw error;
    }
    res.sendStatus(201);
  });
  router.patch("/bookings/:id", guard("customer", "vendor"), async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const customer = req.user.role === "customer";
    if (customer !== (status === "cancelled")) throw fail(403, "You cannot make this change.");
    const owner = { _id: req.params.id, [customer ? "customerId" : "vendorId"]: idOf(req.user) };
    const updated = await bookings.updateOne({ ...owner, status: "pending" }, { $set: { status, open: status === "accepted" } });
    if (!updated.matchedCount) {
      if (!await bookings.findOne(owner, { projection: { _id: 1 } })) throw fail(404, "Booking not found.");
      throw fail(409, "Only pending requests can be changed.");
    }
    res.sendStatus(204);
  });

  router.patch("/admin/users/:id", guard("admin"), async (req, res) => {
    const { isBlocked } = blockSchema.parse(req.body);
    const target = await users.updateOne({ ...userKey(req.params.id), role: { $in: ["vendor", "customer"] } }, { $set: { isBlocked } });
    if (!target.matchedCount) throw fail(404, "Manageable user not found.");
    res.sendStatus(204);
  });
  return router;
}