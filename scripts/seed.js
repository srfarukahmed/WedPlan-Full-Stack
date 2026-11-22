import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { readConfig } from "../src/config.js";
import { connectDatabase } from "../src/db.js";
import { createApp } from "../src/app.js";
import { categories } from "../src/validation.js";
import { validPassword } from "../src/auth.js";

const config = readConfig();
const stores = await connectDatabase(config);
const { auth, images } = createApp(config, stores);

async function account(role, required = false) {
  const prefix = "FARUK_" + role.toUpperCase();
  const email = process.env[prefix + "_EMAIL"]?.trim().toLowerCase();
  const password = process.env[prefix + "_PASSWORD"];
  if (!password && !required) return null;
  if (!email || !validPassword(password)) throw new Error(prefix + " credentials are missing or invalid.");
  const existing = await stores.users.findOne({ email });
  if (existing) {
    if (existing.role !== role) throw new Error("The seed email is already used by an account with a different role.");
    return existing;
  }
  await auth.api.signUpEmail({ body: { name: "Faruk Ahmed", email, password, role: role === "vendor" ? "vendor" : "customer" } });
  if (role === "admin") await stores.users.updateOne({ email, role: "customer" }, { $set: { role: "admin" } });
  if (role === "vendor") await stores.users.updateOne({ email }, { $set: { businessName: "Faruk Ahmed Wedding Studio" } });
  return stores.users.findOne({ email });
}

try {
  const admin = await account("admin", true);
  const vendor = await account("vendor");
  await account("customer");
  const includeCatalog = process.argv.includes("--catalog");
  if (includeCatalog && !vendor) throw new Error("Configure a dedicated vendor account to seed the catalog.");
  if (includeCatalog && vendor) {
    const names = ["Wedding Photography", "Garden Wedding Venue", "Wedding Flowers", "Wedding Catering", "Bridal Styling", "Wedding Attire"];
    const descriptions = [
      "Full-day wedding photography with portraits and an edited digital gallery.",
      "A private garden setting with ceremony and reception space.",
      "Seasonal flowers for the ceremony, reception, and wedding party.",
      "A customizable reception menu, tasting, and dinner service.",
      "Bridal makeup and hairstyling with an advance trial.",
      "Custom wedding attire with fittings and alterations.",
    ];
    const catalogEmail = "catalog-vendor@farukahmed.example";
    let catalogVendor = await stores.users.findOne({ email: catalogEmail });
    if (!catalogVendor) {
      await auth.api.signUpEmail({ body: { name: "Faruk Ahmed", email: catalogEmail, password: "Aa" + randomBytes(24).toString("hex"), role: "vendor" } });
      catalogVendor = await stores.users.findOne({ email: catalogEmail });
    }
    if (catalogVendor.role !== "vendor") throw new Error("The catalog vendor email is already in use.");
    for (let index = 0; index < categories.length; index++) {
      const vendorId = String((index < 3 ? vendor : catalogVendor)._id);
      const id = "faruk-service-" + (index + 1);
      if (await stores.services.findOne({ _id: id })) continue;
      const photos = await Promise.all([index + 1 + ".jpg", index + 1 + "-detail.jpg"].map(async (photo) => {
        const buffer = await readFile(new URL("../seed-assets/" + photo, import.meta.url));
        return images.save(buffer, "service", vendorId);
      }));
      await stores.services.insertOne({ _id: id, vendorId, serviceName: "Faruk Ahmed " + names[index],
        category: categories[index], description: descriptions[index], location: ["Dhaka", "Gazipur", "Dhaka", "Chattogram", "Dhaka", "Sylhet"][index],
        price: [45000, 120000, 38000, 65000, 18000, 29000][index], images: photos, status: "approved",
        active: true, createdAt: new Date(),
      });
    }
  }
  console.log("Faruk Ahmed admin account is ready:", admin.email);
} finally { await stores.client.close(); }