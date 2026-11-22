import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { createLinkSchema } from "../schemas/link.schema.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { LinkError, LinkService } from "../services/link.service.js";

export function createApiRouter(
  linkService = new LinkService(),
  analyticsService = new AnalyticsService()
) {
  const router = new Hono();

  // Health check endpoint
  router.get("/health", (c) => {
    return c.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/links - Create short link
  router.post(
    "/links",
    zValidator("json", createLinkSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: "Validation failed",
            details: result.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          400
        );
      }
    }),
    async (c) => {
      const body = c.req.valid("json");
      const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;

      try {
        const link = linkService.createLink(
          {
            url: body.url,
            alias: body.alias,
            expiresAt: body.expiresAt,
          },
          baseUrl
        );

        return c.json(
          {
            success: true,
            data: link,
          },
          201
        );
      } catch (err) {
        if (err instanceof LinkError) {
          return c.json(
            { success: false, error: err.message },
            err.statusCode as ContentfulStatusCode
          );
        }
        throw err;
      }
    }
  );

  // GET /api/links - List all short links
  router.get("/links", (c) => {
    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;
    const links = linkService.getAllLinks(baseUrl);

    return c.json({
      success: true,
      data: links,
      total: links.length,
    });
  });

  // GET /api/links/:code - Get single link by code
  router.get("/links/:code", (c) => {
    const code = c.req.param("code");
    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;

    const link = linkService.getLinkByCode(code, baseUrl);
    if (!link) {
      return c.json({ success: false, error: `Link with code "${code}" not found` }, 404);
    }

    return c.json({
      success: true,
      data: link,
    });
  });

  // DELETE /api/links/:code - Delete link by code
  router.delete("/links/:code", (c) => {
    const code = c.req.param("code");
    const deleted = linkService.deleteLink(code);

    if (!deleted) {
      return c.json({ success: false, error: `Link with code "${code}" not found` }, 404);
    }

    return c.json({
      success: true,
      message: `Link "${code}" successfully deleted`,
    });
  });

  // GET /api/links/:code/analytics - Get analytics for a link
  router.get("/links/:code/analytics", (c) => {
    const code = c.req.param("code");
    const baseUrl = process.env.BASE_URL || new URL(c.req.url).origin;

    try {
      const analytics = analyticsService.getAnalytics(code, baseUrl);
      return c.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      if (err instanceof LinkError) {
        return c.json(
          { success: false, error: err.message },
          err.statusCode as ContentfulStatusCode
        );
      }
      throw err;
    }
  });

  return router;
}
