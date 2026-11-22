import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { createApiRouter } from "./routes/api.js";
import { createRedirectRouter } from "./routes/redirect.js";
import { createUiRouter } from "./routes/ui.js";
import { AnalyticsService } from "./services/analytics.service.js";
import { LinkService } from "./services/link.service.js";

export interface AppOptions {
  linkService?: LinkService;
  analyticsService?: AnalyticsService;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function createApp(options: AppOptions = {}) {
  const app = new Hono();

  const linkService = options.linkService || new LinkService();
  const analyticsService = options.analyticsService || new AnalyticsService();

  // 1. Security Headers
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
      referrerPolicy: "strict-origin-when-cross-origin",
    })
  );

  // 2. CORS configuration for API endpoints
  app.use(
    "/api/*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Accept"],
    })
  );

  // 3. Request Logging
  app.use("*", logger());

  // 4. Rate Limiting Middleware
  const rateLimitMax = options.rateLimitMax || Number(process.env.RATE_LIMIT_MAX) || 120;
  const rateLimitWindowMs =
    options.rateLimitWindowMs || Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

  app.use(
    "*",
    rateLimiter({
      max: rateLimitMax,
      windowMs: rateLimitWindowMs,
      message: "Too many requests. Please slow down.",
    })
  );

  // Stricter rate limit on link creation to protect against abuse
  app.use("/api/links", async (c, next) => {
    if (c.req.method === "POST") {
      return rateLimiter({
        max: Math.min(rateLimitMax, 30),
        windowMs: rateLimitWindowMs,
        message: "Too many link creation requests. Please try again later.",
      })(c, next);
    }
    await next();
  });

  // 5. Mount API Routes (/api/*)
  app.route("/api", createApiRouter(linkService, analyticsService));

  // 6. Mount Web UI Routes (/, /dashboard, /analytics/:code)
  app.route("/", createUiRouter(linkService, analyticsService));

  // 7. Mount Short URL Redirect Route (/:code)
  app.route("/", createRedirectRouter(linkService, analyticsService));

  // 8. Centralized Error and 404 Handlers
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  return app;
}
