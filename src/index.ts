import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { createApp } from "./app.js";
import { closeDb, getDb } from "./db/index.js";

// Load environment variables
dotenv.config();

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

// Ensure DB is initialized
getDb();

const app = createApp();

console.log(
  `Starting Hono URL Shortener on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`
);

const server = serve({
  fetch: app.fetch,
  port,
  hostname: host,
});

// Graceful shutdown handling
function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    closeDb();
    console.log("SQLite database connection closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
