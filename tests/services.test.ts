import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { AnalyticsService } from "../src/services/analytics.service.js";
import { LinkError, LinkService } from "../src/services/link.service.js";

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

describe("LinkService and AnalyticsService", () => {
  let db: Database.Database;
  let linkService: LinkService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);
    linkService = new LinkService(db);
    analyticsService = new AnalyticsService(db);
  });

  describe("LinkService", () => {
    it("should create a link with an auto-generated short code", () => {
      const link = linkService.createLink(
        { url: "https://example.com/test-page" },
        "http://localhost:3000"
      );

      expect(link.id).toBeDefined();
      expect(link.code).toHaveLength(6);
      expect(link.original_url).toBe("https://example.com/test-page");
      expect(link.short_url).toBe(`http://localhost:3000/${link.code}`);
      expect(link.clicks).toBe(0);
      expect(link.is_expired).toBe(false);
    });

    it("should create a link with a custom alias", () => {
      const link = linkService.createLink(
        { url: "https://google.com", alias: "my-custom-link" },
        "http://localhost:3000"
      );

      expect(link.code).toBe("my-custom-link");
      expect(link.short_url).toBe("http://localhost:3000/my-custom-link");
    });

    it("should throw 409 Conflict when alias is already in use", () => {
      linkService.createLink(
        { url: "https://first.com", alias: "unique-alias" },
        "http://localhost:3000"
      );

      expect(() => {
        linkService.createLink(
          { url: "https://second.com", alias: "unique-alias" },
          "http://localhost:3000"
        );
      }).toThrowError(LinkError);
    });

    it("should respect expiration timestamps", () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const expiredLink = linkService.createLink(
        { url: "https://expired.com", expiresAt: pastDate },
        "http://localhost:3000"
      );

      const fetched = linkService.getLinkByCode(expiredLink.code, "http://localhost:3000");
      expect(fetched?.is_expired).toBe(true);

      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const activeLink = linkService.createLink(
        { url: "https://active.com", expiresAt: futureDate },
        "http://localhost:3000"
      );
      const fetchedActive = linkService.getLinkByCode(activeLink.code, "http://localhost:3000");
      expect(fetchedActive?.is_expired).toBe(false);
    });

    it("should delete a link and return true", () => {
      const link = linkService.createLink(
        { url: "https://delete-me.com" },
        "http://localhost:3000"
      );

      const deleted = linkService.deleteLink(link.code);
      expect(deleted).toBe(true);

      const fetched = linkService.getLinkByCode(link.code, "http://localhost:3000");
      expect(fetched).toBeNull();
    });
  });

  describe("AnalyticsService", () => {
    it("should record clicks and increment link click counter", () => {
      const link = linkService.createLink(
        { url: "https://analytics-test.com" },
        "http://localhost:3000"
      );

      analyticsService.recordClick({
        linkId: link.id,
        referrer: "https://news.ycombinator.com/item?id=123",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
        ip: "192.168.1.1",
      });

      analyticsService.recordClick({
        linkId: link.id,
        referrer: "https://news.ycombinator.com/item?id=456",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
        ip: "192.168.1.2",
      });

      const analytics = analyticsService.getAnalytics(link.code, "http://localhost:3000");
      expect(analytics.totalClicks).toBe(2);
      expect(analytics.link.clicks).toBe(2);

      // Referrer breakdown
      expect(analytics.topReferrers.length).toBeGreaterThan(0);
      expect(analytics.topReferrers[0].referrer).toBe("news.ycombinator.com");
      expect(analytics.topReferrers[0].count).toBe(2);

      // Recent clicks
      expect(analytics.recentClicks).toHaveLength(2);
      expect(analytics.recentClicks[0].browser).toBeDefined();
    });
  });
});
