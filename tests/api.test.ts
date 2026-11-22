import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
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

describe("REST API Endpoints (/api/*)", () => {
  let app: ReturnType<typeof createApp>;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);

    const linkService = new LinkService(db);
    const analyticsService = new AnalyticsService(db);

    app = createApp({
      linkService,
      analyticsService,
      rateLimitMax: 1000,
    });
  });

  it("GET /api/health should return 200 OK", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });

  it("POST /api/links should create short link and return 201", async () => {
    const res = await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com/hono-shortener",
        alias: "hono-test",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.code).toBe("hono-test");
    expect(body.data.original_url).toBe("https://example.com/hono-shortener");
    expect(body.data.short_url).toContain("/hono-test");
  });

  it("POST /api/links should fail with 400 when URL is invalid", async () => {
    const res = await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "not-a-valid-url",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.details).toBeDefined();
  });

  it("POST /api/links should fail with 409 when alias already exists", async () => {
    await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://first.com",
        alias: "duplicate-alias",
      }),
    });

    const duplicateRes = await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://second.com",
        alias: "duplicate-alias",
      }),
    });

    expect(duplicateRes.status).toBe(409);
    const body = await duplicateRes.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("already in use");
  });

  it("GET /api/links should list created links", async () => {
    await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example1.com", alias: "link-one" }),
    });

    await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example2.com", alias: "link-two" }),
    });

    const res = await app.request("/api/links");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.total).toBe(2);
    expect(body.data).toHaveLength(2);
  });

  it("GET /api/links/:code should retrieve single link", async () => {
    await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/find-me", alias: "find-me" }),
    });

    const res = await app.request("/api/links/find-me");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.code).toBe("find-me");
  });

  it("DELETE /api/links/:code should remove link", async () => {
    await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://to-delete.com", alias: "delete-code" }),
    });

    const deleteRes = await app.request("/api/links/delete-code", {
      method: "DELETE",
    });

    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);

    // Verify it is gone
    const checkRes = await app.request("/api/links/delete-code");
    expect(checkRes.status).toBe(404);
  });

  it("GET /api/links/:code/analytics should return analytics data", async () => {
    await app.request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://stats-test.com", alias: "stats-code" }),
    });

    const res = await app.request("/api/links/stats-code/analytics");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalClicks).toBe(0);
    expect(body.data.clicksPerDay).toBeDefined();
    expect(body.data.topReferrers).toBeDefined();
  });
});
