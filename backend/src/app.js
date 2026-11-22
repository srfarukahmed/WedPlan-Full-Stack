import express from "express";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { ZodError } from "zod";
import { toNodeHandler } from "better-auth/node";
import { createAuth, protect } from "./auth.js";
import { imageStore } from "./images.js";
import { marketplace } from "./routes/marketplace.js";
import { paymentRoutes } from "./routes/payments.js";
import { fail } from "./validation.js";

export function createApp(config, stores, { stripe, uploadMaxMb = 5 } = {}) {
  const app = express();
  const images = imageStore(config, stores);
  const auth = createAuth(config, stores, images.owns);
  const payment = paymentRoutes({ auth, config, stores, stripe, images });
  app.disable("x-powered-by");
  if (process.env.RENDER === "true") app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: [config.FRONTEND_URL, config.BETTER_AUTH_URL], credentials: true }));
  app.get("/health", async (_req, res) => {
    await stores.db.command({ ping: 1 });
    res.json({ status: "ok" });
  });
  app.get("/api/images/:id", images.serve);
  app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), payment.webhook);
  app.get("/api/integrations", (_req, res) => res.json({
    google: Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET),
    stripe: Boolean(stripe || (config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET && config.STRIPE_PRICE_ID)),
  }));
  app.all("/api/auth/*path", (req, _res, next) => {
    req.headers["x-wedplan-client-ip"] = req.ip;
    next();
  }, toNodeHandler(auth));
  app.use(express.json({ limit: "64kb" }));

  const uploadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { message: "Too many image uploads. Try again shortly." } });
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: uploadMaxMb * 1024 * 1024, files: 1, fields: 1, fieldSize: 32 } });
  app.post("/api/uploads", uploadLimit, upload.single("image"), (req, res, next) => {
    const { purpose } = req.body ?? {};
    if (!["registration", "profile", "service"].includes(purpose)) throw fail(400, "Select a valid upload purpose.");
    if (purpose === "registration") return next();
    return protect(auth, config, stores, ...(purpose === "service" ? ["vendor"] : []))(req, res, next);
  }, async (req, res) => {
    if (!req.file) throw fail(400, "Choose an image to upload.");
    const url = await images.save(req.file.buffer, req.body.purpose, req.user && String(req.user._id));
    res.status(201).json({ url });
  });
  app.use("/api", marketplace({ auth, config, stores, images }), payment.router);
  app.use((_req, _res, next) => next(fail(404, "This API route does not exist.")));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ZodError) return res.status(400).json({ message: error.issues.map((issue) => [issue.path.join("."), issue.message].filter(Boolean).join(" — ")).join(" ") });
    if (error instanceof multer.MulterError) return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Choose an image up to " + uploadMaxMb + " MB." : "Upload one image at a time." });
    if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body." });
    if (error.type === "entity.too.large") return res.status(413).json({ message: "Request is too large." });
    if (Number.isInteger(error.status) && error.status >= 400 && error.status < 600) return res.status(error.status).json({ message: error.message });
    console.error("Unhandled request error:", error.name, error.code ?? "");
    return res.status(500).json({ message: "The request could not be completed. Please try again." });
  });
  return { app, auth, images };
}