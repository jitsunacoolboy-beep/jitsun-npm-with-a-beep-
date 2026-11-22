import Database from "better-sqlite3";
import { getDb } from "../db/index.js";
import { CreateLinkInput, Link, LinkWithStatus } from "../types/index.js";
import { generateShortCode } from "../utils/nanoid.js";

export class LinkError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "LinkError";
  }
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function formatShortUrl(baseUrl: string, code: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}/${code}`;
}

export class LinkService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  /**
   * Create a new shortened link with optional custom alias and expiry.
   */
  createLink(input: CreateLinkInput, baseUrl: string): LinkWithStatus {
    const now = new Date().toISOString();

    let code = input.alias ? input.alias.trim() : "";
    if (code) {
      // Check if alias already taken
      const existing = this.db
        .prepare<[string], Link>("SELECT * FROM links WHERE code = ? COLLATE NOCASE")
        .get(code);

      if (existing) {
        throw new LinkError(`The alias "${code}" is already in use. Please choose another.`, 409);
      }
    } else {
      // Generate a collision-free short code
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const candidate = generateShortCode(6);
        const existing = this.db
          .prepare<[string], { id: number }>("SELECT id FROM links WHERE code = ?")
          .get(candidate);
        if (!existing) {
          code = candidate;
          break;
        }
        attempts++;
      }
      if (!code) {
        throw new LinkError("Failed to generate a unique short code. Please try again.", 500);
      }
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;

    const stmt = this.db.prepare<[string, string, string, string | null]>(
      "INSERT INTO links (code, original_url, created_at, expires_at, clicks) VALUES (?, ?, ?, ?, 0)"
    );

    const info = stmt.run(code, input.url.trim(), now, expiresAt);
    const linkId = Number(info.lastInsertRowid);

    const link = this.db.prepare<[number], Link>("SELECT * FROM links WHERE id = ?").get(linkId);

    if (!link) {
      throw new LinkError("Failed to retrieve created link", 500);
    }

    return {
      ...link,
      is_expired: isExpired(link.expires_at),
      short_url: formatShortUrl(baseUrl, link.code),
    };
  }

  /**
   * Find link by short code.
   */
  getLinkByCode(code: string, baseUrl: string): LinkWithStatus | null {
    const link = this.db
      .prepare<[string], Link>("SELECT * FROM links WHERE code = ? COLLATE NOCASE")
      .get(code.trim());

    if (!link) return null;

    return {
      ...link,
      is_expired: isExpired(link.expires_at),
      short_url: formatShortUrl(baseUrl, link.code),
    };
  }

  /**
   * Fetch all links ordered by newest first.
   */
  getAllLinks(baseUrl: string): LinkWithStatus[] {
    const links = this.db.prepare<[], Link>("SELECT * FROM links ORDER BY created_at DESC").all();

    return links.map((link) => ({
      ...link,
      is_expired: isExpired(link.expires_at),
      short_url: formatShortUrl(baseUrl, link.code),
    }));
  }

  /**
   * Delete a link by code.
   */
  deleteLink(code: string): boolean {
    const result = this.db
      .prepare<[string]>("DELETE FROM links WHERE code = ? COLLATE NOCASE")
      .run(code.trim());

    return result.changes > 0;
  }
}
