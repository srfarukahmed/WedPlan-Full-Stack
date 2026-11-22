import { createServer } from "node:http";
import { readConfig } from "./config.js";
import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";

try {
  const config = readConfig();
  for (const warning of config.integrationWarnings) console.warn(warning);
  const stores = await connectDatabase(config);
  const server = createServer();
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(config.PORT, "0.0.0.0", () => {
        server.off("error", reject);
        resolve();
      });
    });
    const { app } = createApp(config, stores);
    server.on("request", app);
  } catch (error) {
    server.close();
    await stores.client.close();
    throw error;
  }
  console.log("WedPlan API is listening on port " + config.PORT);
  function stop() {
    server.close(async () => { await stores.client.close(); });
  }
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
} catch (error) {
  console.error("WedPlan could not start:", error.message);
  process.exitCode = 1;
}