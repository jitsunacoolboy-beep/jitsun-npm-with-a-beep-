import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { AnalyticsService } from "../src/services/analytics.service.js";
import { LinkService } from "../src/services/link.service.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  original_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT DEFAULT NULL,
  clicks INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  referrer TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  ip TEXT DEFAULT NULL,
  browser TEXT DEFAULT NULL,
  os TEXT DEFAULT NULL,
  FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);
`;

describe("Rate Limiting Middleware", () => {
  it("should rate limit requests when limit is exceeded", async () => {
    const db = new Database(":memory:");
    db.exec(SCHEMA);

    const app = createApp({
      linkService: new LinkService(db),
      analyticsService: new AnalyticsService(db),
      rateLimitMax: 3, // Allow only 3 requests
      rateLimitWindowMs: 10000,
    });

    const headers = { "x-forwarded-for": "203.0.113.195" };

    // Requests 1-3 should pass
    const res1 = await app.request("/api/health", { headers });
    expect(res1.status).toBe(200);
    expect(res1.headers.get("X-RateLimit-Remaining")).toBe("2");

    const res2 = await app.request("/api/health", { headers });
    expect(res2.status).toBe(200);
    expect(res2.headers.get("X-RateLimit-Remaining")).toBe("1");

    const res3 = await app.request("/api/health", { headers });
    expect(res3.status).toBe(200);
    expect(res3.headers.get("X-RateLimit-Remaining")).toBe("0");

    // Request 4 should be rejected with 429 Too Many Requests
    const res4 = await app.request("/api/health", { headers });
    expect(res4.status).toBe(429);
    expect(res4.headers.get("Retry-After")).toBeDefined();

    const data = await res4.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Too many requests");
  });
});
