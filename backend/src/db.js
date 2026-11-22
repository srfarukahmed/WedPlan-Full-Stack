import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

export const userKey = (id) => ({
  _id: { $in: ObjectId.isValid(id) ? [id, new ObjectId(id)] : [id] },
});
export function hasPremiumValidity(user, now = Date.now()) {
  return user?.subscriptionPlan === "premium" && new Date(user.subscriptionExpiresAt).getTime() > now;
}
export function effectivePlan(user, now = Date.now()) {
  return hasPremiumValidity(user, now) && user.planPreference !== "free" ? "premium" : "free";
}
export function person(user, privateFields = false) {
  if (!user) return null;
  const { _id, name, image, businessName, bio, role, email, phone, isBlocked, subscriptionExpiresAt, cancelAtPeriodEnd } = user;
  return { id: String(_id ?? user.id), name, image, businessName, bio, subscriptionPlan: effectivePlan(user),
    ...(privateFields ? { role, email, phone, isBlocked: !!isBlocked, subscriptionExpiresAt, premiumValidUntil: hasPremiumValidity(user) ? subscriptionExpiresAt : null, cancelAtPeriodEnd } : {}) };
}

export async function connectDatabase(config) {
  const client = new MongoClient(config.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  try {
    const db = client.db(config.MONGODB_DB);
    const collections = {
      client, db, users: db.collection("users"), services: db.collection("services"),
      bookings: db.collection("bookings"), transactions: db.collection("transactions"),
      images: new GridFSBucket(db, { bucketName: "images" }),
    };
    const { users, services, bookings, transactions } = collections;
    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      services.createIndex({ vendorId: 1, status: 1, active: 1 }),
      services.createIndex({ status: 1, active: 1, createdAt: -1 }),
      bookings.createIndex({ vendorId: 1, createdAt: -1 }),
      bookings.createIndex({ customerId: 1, createdAt: -1 }),
      bookings.createIndex({ customerId: 1, serviceId: 1, eventDate: 1 }, { unique: true, partialFilterExpression: { open: true } }),
      transactions.createIndex({ vendorId: 1, createdAt: -1 }),
      transactions.createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
      transactions.createIndex({ vendorId: 1, checkoutOpen: 1 }, { unique: true, partialFilterExpression: { checkoutOpen: true } }),
    ]);
    return collections;
  } catch (error) {
    await client.close();
    throw error;
  }
}