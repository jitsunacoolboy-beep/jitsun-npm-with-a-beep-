import Database from "better-sqlite3";
import { getDb } from "../db/index.js";
import {
  BrowserStat,
  ClickRecordInput,
  DailyClickStat,
  LinkAnalytics,
  LinkWithStatus,
  OSStat,
  ReferrerStat,
} from "../types/index.js";
import { parseUserAgent } from "../utils/user-agent.js";
import { formatShortUrl, isExpired, LinkError } from "./link.service.js";

export class AnalyticsService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  /**
   * Record a click event and atomically increment link's total click counter.
   */
  recordClick(input: ClickRecordInput): void {
    const now = input.timestamp || new Date().toISOString();
    const parsedUa = parseUserAgent(input.userAgent);

    let referrerHost: string | null = null;
    if (input.referrer && input.referrer.trim() !== "") {
      try {
        const parsedUrl = new URL(input.referrer);
        referrerHost = parsedUrl.hostname || input.referrer;
      } catch {
        referrerHost = input.referrer;
      }
    }

    const insertClick = this.db.prepare<
      [number, string, string | null, string | null, string | null, string | null, string | null]
    >(`
      INSERT INTO clicks (link_id, timestamp, referrer, user_agent, ip, browser, os)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const incrementClick = this.db.prepare<[number]>(`
      UPDATE links SET clicks = clicks + 1 WHERE id = ?
    `);

    // Execute atomically inside SQLite transaction
    const recordTransaction = this.db.transaction(() => {
      insertClick.run(
        input.linkId,
        now,
        referrerHost,
        input.userAgent || null,
        input.ip || null,
        input.browser || parsedUa.browser,
        input.os || parsedUa.os
      );
      incrementClick.run(input.linkId);
    });

    recordTransaction();
  }

  /**
   * Fetch aggregate analytics for a link:
   * - Total clicks
   * - Clicks per day (last 30 days)
   * - Top referrers with percentages
   * - Top browsers and operating systems
   * - Recent clicks log
   */
  getAnalytics(code: string, baseUrl: string): LinkAnalytics {
    const link = this.db
      .prepare<[string], LinkWithStatus>(
        "SELECT id, code, original_url, created_at, expires_at, clicks FROM links WHERE code = ? COLLATE NOCASE"
      )
      .get(code.trim());

    if (!link) {
      throw new LinkError(`Short link with code "${code}" not found`, 404);
    }

    link.is_expired = isExpired(link.expires_at);
    link.short_url = formatShortUrl(baseUrl, link.code);

    const totalClicks = link.clicks;

    // Daily clicks (grouped by YYYY-MM-DD UTC)
    const dailyRows = this.db
      .prepare<[number], { date: string; count: number }>(
        `
        SELECT substr(timestamp, 1, 10) as date, COUNT(*) as count
        FROM clicks
        WHERE link_id = ?
        GROUP BY date
        ORDER BY date ASC
      `
      )
      .all(link.id);

    // Ensure last 7 days are represented even if 0 clicks for smooth chart
    const clicksPerDay = this.fillDailyStats(dailyRows);

    // Referrers
    const referrerRows = this.db
      .prepare<[number], { referrer: string | null; count: number }>(
        `
        SELECT COALESCE(referrer, 'Direct / None') as referrer, COUNT(*) as count
        FROM clicks
        WHERE link_id = ?
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `
      )
      .all(link.id);

    const topReferrers: ReferrerStat[] = referrerRows.map((r) => ({
      referrer: r.referrer || "Direct / None",
      count: r.count,
      percentage: totalClicks > 0 ? Math.round((r.count / totalClicks) * 100) : 0,
    }));

    // Browsers
    const browserRows = this.db
      .prepare<[number], { browser: string | null; count: number }>(
        `
        SELECT COALESCE(browser, 'Other') as browser, COUNT(*) as count
        FROM clicks
        WHERE link_id = ?
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
      `
      )
      .all(link.id);

    const topBrowsers: BrowserStat[] = browserRows.map((b) => ({
      browser: b.browser || "Other",
      count: b.count,
      percentage: totalClicks > 0 ? Math.round((b.count / totalClicks) * 100) : 0,
    }));

    // OS
    const osRows = this.db
      .prepare<[number], { os: string | null; count: number }>(
        `
        SELECT COALESCE(os, 'Other') as os, COUNT(*) as count
        FROM clicks
        WHERE link_id = ?
        GROUP BY os
        ORDER BY count DESC
        LIMIT 5
      `
      )
      .all(link.id);

    const topOS: OSStat[] = osRows.map((o) => ({
      os: o.os || "Other",
      count: o.count,
      percentage: totalClicks > 0 ? Math.round((o.count / totalClicks) * 100) : 0,
    }));

    // Recent 20 clicks
    const recentClicksRows = this.db
      .prepare<
        [number],
        {
          id: number;
          timestamp: string;
          referrer: string | null;
          browser: string | null;
          os: string | null;
          user_agent: string | null;
        }
      >(
        `
        SELECT id, timestamp, referrer, browser, os, user_agent
        FROM clicks
        WHERE link_id = ?
        ORDER BY timestamp DESC
        LIMIT 20
      `
      )
      .all(link.id);

    const recentClicks = recentClicksRows.map((c) => ({
      id: c.id,
      timestamp: c.timestamp,
      referrer: c.referrer || "Direct / None",
      browser: c.browser || "Unknown",
      os: c.os || "Unknown",
      userAgent: c.user_agent || "Unknown",
    }));

    return {
      link,
      totalClicks,
      clicksPerDay,
      topReferrers,
      topBrowsers,
      topOS,
      recentClicks,
    };
  }

  private fillDailyStats(rows: { date: string; count: number }[]): DailyClickStat[] {
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.date, r.count);
    }

    // Generate dates for the last 7 days
    const result: DailyClickStat[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({
        date: dateStr,
        count: map.get(dateStr) || 0,
      });
    }

    // Also include any older dates that have clicks
    for (const r of rows) {
      if (!result.some((res) => res.date === r.date)) {
        result.push(r);
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
}
