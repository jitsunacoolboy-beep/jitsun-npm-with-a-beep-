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

describe("Redirect and Click Analytics Tracking", () => {
  let app: ReturnType<typeof createApp>;
  let linkService: LinkService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);

    linkService = new LinkService(db);
    analyticsService = new AnalyticsService(db);

    app = createApp({
      linkService,
      analyticsService,
      rateLimitMax: 1000,
    });
  });

  it("should redirect to target URL with 302 Found and record click", async () => {
    const link = linkService.createLink(
      { url: "https://example.com/target-destination", alias: "go-target" },
      "http://localhost:3000"
    );

    const res = await app.request("/go-target", {
      headers: {
        Referer: "https://twitter.com/post/123",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/target-destination");

    // Verify click was recorded
    const analytics = analyticsService.getAnalytics(link.code, "http://localhost:3000");
    expect(analytics.totalClicks).toBe(1);
    expect(analytics.topReferrers[0].referrer).toBe("twitter.com");
    expect(analytics.topBrowsers[0].browser).toBe("Safari");
    expect(analytics.topOS[0].os).toBe("iOS");
  });

  it("should return 404 for nonexistent short link", async () => {
    const res = await app.request("/nonexistent-link");
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("Link Not Found");
  });

  it("should return 410 Gone for expired short link", async () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    linkService.createLink(
      { url: "https://expired-page.com", alias: "old-promo", expiresAt: pastDate },
      "http://localhost:3000"
    );

    const res = await app.request("/old-promo");
    expect(res.status).toBe(410);
    const text = await res.text();
    expect(text).toContain("This link has expired");
  });
});
