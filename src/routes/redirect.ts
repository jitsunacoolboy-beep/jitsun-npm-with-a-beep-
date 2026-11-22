import { Hono } from "hono";
import { RESERVED_WORDS } from "../schemas/link.schema.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { LinkService } from "../services/link.service.js";

export function createRedirectRouter(
  linkService = new LinkService(),
  analyticsService = new AnalyticsService()
) {
  const router = new Hono();

  router.get("/:code", async (c, next) => {
    const code = c.req.param("code");

    // Don't intercept static, api, dashboard, or favicon
    if (RESERVED_WORDS.has(code.toLowerCase())) {
      return next();
    }

    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;
    const link = linkService.getLinkByCode(code, baseUrl);

    if (!link) {
      return c.html(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Not Found - 404</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 16px; padding: 3rem 2rem; max-width: 480px; text-align: center; border: 1px solid #334155; }
            h1 { color: #f87171; margin-bottom: 0.5rem; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 2rem; }
            a { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Not Found</h1>
            <p>The shortened link <code>/${code}</code> does not exist or may have been deleted.</p>
            <a href="/">Create a New Link</a>
          </div>
        </body>
        </html>`,
        404
      );
    }

    // Check if expired
    if (link.is_expired) {
      const expiredDateStr = link.expires_at ? new Date(link.expires_at).toUTCString() : "Unknown";
      return c.html(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Expired - 410 Gone</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 16px; padding: 3rem 2rem; max-width: 480px; text-align: center; border: 1px solid #334155; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(239, 68, 68, 0.2); color: #f87171; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-bottom: 1rem; }
            h1 { margin-bottom: 0.5rem; font-size: 1.75rem; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 2rem; }
            .date { color: #cbd5e1; font-weight: 500; }
            a { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">410 Gone</span>
            <h1>This link has expired</h1>
            <p>The short link <code>/${link.code}</code> expired on <br><span class="date">${expiredDateStr}</span> and is no longer available.</p>
            <a href="/">Go to Homepage</a>
          </div>
        </body>
        </html>`,
        410
      );
    }

    // Record click details
    const referrer = c.req.header("referer") || null;
    const userAgent = c.req.header("user-agent") || null;
    const forwardedFor = c.req.header("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    try {
      analyticsService.recordClick({
        linkId: link.id,
        referrer,
        userAgent,
        ip,
      });
    } catch (e) {
      console.error("Failed to record click analytics:", e);
    }

    // Redirect to original destination
    return c.redirect(link.original_url, 302);
  });

  return router;
}
