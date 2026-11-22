import express from "express";
import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { connectDatabase } from "./db.js";

async function initialize() {
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = domain ? "https://" + domain : undefined;
  const config = readConfig({
    ...process.env,
    FRONTEND_URL: process.env.FRONTEND_URL || origin,
    PUBLIC_API_URL: process.env.PUBLIC_API_URL || origin,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || origin,
  });
  for (const warning of config.integrationWarnings) console.warn(warning);
  const stores = await connectDatabase(config);
  try {
    const { app } = createApp(config, stores, { uploadMaxMb: 4 });
    if (process.env.VERCEL === "1") app.set("trust proxy", 1);
    return app;
  } catch (error) {
    await stores.client.close();
    throw error;
  }
}

let appPromise;
const handler = express();
handler.disable("x-powered-by");
handler.use(async (req, res) => {
  appPromise ??= initialize().catch((error) => {
    appPromise = undefined;
    throw error;
  });
  let app;
  try {
    app = await appPromise;
  } catch (error) {
    console.error("WedPlan could not initialize:", error.name, error.code ?? "");
    return res.status(503).json({ message: "The WedPlan API is temporarily unavailable." });
  }
  app(req, res);
});

export default handler;
