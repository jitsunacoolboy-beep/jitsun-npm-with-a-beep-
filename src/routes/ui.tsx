import { Hono } from "hono";
import { AnalyticsService } from "../services/analytics.service.js";
import { LinkError, LinkService } from "../services/link.service.js";
import { AnalyticsView } from "../views/analytics.js";
import { DashboardView } from "../views/dashboard.js";
import { HomeView } from "../views/home.js";

export function createUiRouter(
  linkService = new LinkService(),
  analyticsService = new AnalyticsService()
) {
  const router = new Hono();

  // GET / - Home page
  router.get("/", (c) => {
    return c.html(<HomeView createdLink={null} error={null} />);
  });

  // POST / - Create short link via HTML form
  router.post("/", async (c) => {
    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;

    try {
      const body = await c.req.parseBody();
      const url = (body.url as string)?.trim();
      const alias = (body.alias as string)?.trim() || undefined;
      const rawExpiresAt = (body.expiresAt as string)?.trim() || undefined;

      if (!url) {
        return c.html(
          <HomeView createdLink={null} error="Please provide a valid destination URL" />,
          400
        );
      }

      // Convert local datetime input (e.g. 2026-11-23T18:00) to ISO string if provided
      let expiresAt: string | undefined = undefined;
      if (rawExpiresAt) {
        const parsedDate = new Date(rawExpiresAt);
        if (isNaN(parsedDate.getTime())) {
          return c.html(
            <HomeView createdLink={null} error="Invalid expiration date format" />,
            400
          );
        }
        if (parsedDate.getTime() <= Date.now()) {
          return c.html(
            <HomeView createdLink={null} error="Expiration date must be in the future" />,
            400
          );
        }
        expiresAt = parsedDate.toISOString();
      }

      const createdLink = linkService.createLink(
        {
          url,
          alias,
          expiresAt,
        },
        baseUrl
      );

      return c.html(<HomeView createdLink={createdLink} error={null} />, 201);
    } catch (err) {
      const errorMessage =
        err instanceof LinkError
          ? err.message
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred";

      return c.html(<HomeView createdLink={null} error={errorMessage} />, 400);
    }
  });

  // GET /dashboard - Dashboard page
  router.get("/dashboard", (c) => {
    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;
    const links = linkService.getAllLinks(baseUrl);
    return c.html(<DashboardView links={links} />);
  });

  // POST /links/:code/delete - Delete link from dashboard
  router.post("/links/:code/delete", (c) => {
    const code = c.req.param("code");
    linkService.deleteLink(code);
    return c.redirect("/dashboard", 303);
  });

  // GET /analytics/:code - Analytics page for a short link
  router.get("/analytics/:code", (c) => {
    const code = c.req.param("code");
    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;

    try {
      const analytics = analyticsService.getAnalytics(code, baseUrl);
      return c.html(<AnalyticsView analytics={analytics} />);
    } catch (err) {
      if (err instanceof LinkError) {
        return c.html(
          `<!DOCTYPE html>
          <html>
            <head><title>Link Not Found</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
              <h1>Link Not Found</h1>
              <p>${err.message}</p>
              <a href="/dashboard" style="color: #3b82f6;">&larr; Return to Dashboard</a>
            </body>
          </html>`,
          404
        );
      }
      throw err;
    }
  });

  return router;
}
