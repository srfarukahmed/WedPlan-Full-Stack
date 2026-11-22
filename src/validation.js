import { z } from "zod";

export const categories = ["Photography & Videography", "Wedding Venues", "Decoration & Florist", "Catering Services", "Makeup & Styling", "Wedding Fashion"];
export const fail = (status, message) => Object.assign(new Error(message), { status });
const text = (max, min = 1) => z.string().trim().min(min).max(max);
export const listingSchema = z.object({
  serviceName: text(120), category: z.enum(categories), description: text(2500), price: z.number().int().min(1).max(100000000),
  location: text(120), images: z.array(z.url().max(1024)).min(1).max(4),
}).strict();
export const profileSchema = z.object({
  name: text(100), image: z.url().max(1024).nullable().optional(), phone: text(32, 0).optional(),
  bio: text(1000, 0).optional(), businessName: text(100, 0).optional(),
}).strict();
export const bookingSchema = z.object({
  serviceId: text(100), eventDate: z.iso.date(), eventLocation: text(160), message: text(1500, 0).default(""),
}).strict();
export const statusSchema = z.object({ status: z.enum(["accepted", "rejected", "cancelled"]) }).strict();
export const blockSchema = z.object({ isBlocked: z.boolean() }).strict();
export const reviewSchema = z.union([
  z.object({ active: z.boolean() }).strict(),
  z.object({ status: z.enum(["approved", "pending", "rejected"]) }).strict(),
]);
export const ready = { status: "approved", active: true };
export function todayInDhaka(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return [values.year, values.month, values.day].join("-");
}