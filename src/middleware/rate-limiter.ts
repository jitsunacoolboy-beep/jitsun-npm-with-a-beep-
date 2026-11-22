import { Context, MiddlewareHandler } from "hono";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per windowMs
  message?: string;
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;
  const clients = new Map<string, ClientRecord>();

  // Cleanup expired entries periodically to prevent memory leaks
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of clients.entries()) {
        if (now >= record.resetAt) {
          clients.delete(key);
        }
      }
    },
    Math.max(windowMs, 30000)
  ).unref();

  return async (c: Context, next) => {
    // Extract client IP (handle proxies like X-Forwarded-For if present)
    const forwardedFor = c.req.header("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const key = `${c.req.method}:${ip}`;

    const now = Date.now();
    let record = clients.get(key);

    if (!record || now >= record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      clients.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", resetSeconds.toString());

    if (record.count > max) {
      c.header("Retry-After", resetSeconds.toString());

      const isJson =
        c.req.path.startsWith("/api") ||
        (c.req.header("Accept") && c.req.header("Accept")?.includes("application/json"));

      if (isJson) {
        return c.json(
          {
            success: false,
            error: message,
            retryAfter: resetSeconds,
          },
          429
        );
      }

      return c.html(
        `<!DOCTYPE html>
        <html>
        <head><title>429 Too Many Requests</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>429 - Too Many Requests</h1>
          <p>${message}</p>
          <p>Please wait <strong>${resetSeconds}</strong> seconds before retrying.</p>
          <a href="/">Return Home</a>
        </body>
        </html>`,
        429
      );
    }

    await next();
  };
}
