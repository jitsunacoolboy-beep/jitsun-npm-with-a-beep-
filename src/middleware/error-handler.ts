import { Context, ErrorHandler, NotFoundHandler } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import { LinkError } from "../services/link.service.js";

function isApiRequest(c: Context): boolean {
  const path = c.req.path;
  const accept = c.req.header("Accept") || "";
  return path.startsWith("/api") || accept.includes("application/json");
}

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error(`[Error] ${c.req.method} ${c.req.path}:`, err);

  const isApi = isApiRequest(c);

  // 1. Zod validation errors
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    if (isApi) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: errorDetails,
        },
        400
      );
    }

    return c.html(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Validation Error</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
        </head>
        <body style="padding: 2rem; max-width: 600px; margin: auto;">
          <h2>Validation Error</h2>
          <ul>
            ${errorDetails.map((d) => `<li><strong>${d.field}:</strong> ${d.message}</li>`).join("")}
          </ul>
          <p><a href="javascript:history.back()">&larr; Go Back</a></p>
        </body>
      </html>`,
      400
    );
  }

  // 2. Custom Link business errors (duplicate alias, expired link, not found)
  if (err instanceof LinkError) {
    const statusCode = err.statusCode as ContentfulStatusCode;
    if (isApi) {
      return c.json(
        {
          success: false,
          error: err.message,
        },
        statusCode
      );
    }

    return c.html(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Error - ${err.statusCode}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 12px; padding: 2.5rem; max-width: 480px; text-align: center; border: 1px solid #334155; }
            h1 { color: #f43f5e; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; }
            a { display: inline-block; margin-top: 1.5rem; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; }
            a:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Error (${err.statusCode})</h1>
            <p>${err.message}</p>
            <a href="/">Return to Home</a>
          </div>
        </body>
      </html>`,
      statusCode
    );
  }

  // 3. Fallback internal server error
  const statusCode = (
    "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500
  ) as ContentfulStatusCode;
  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;

  if (isApi) {
    return c.json(
      {
        success: false,
        error: message,
      },
      statusCode
    );
  }

  return c.html(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Server Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #1e293b; border-radius: 12px; padding: 2.5rem; max-width: 480px; text-align: center; border: 1px solid #334155; }
          h1 { color: #ef4444; margin-bottom: 0.5rem; }
          p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; }
          a { display: inline-block; margin-top: 1.5rem; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>500 - Server Error</h1>
          <p>${message}</p>
          <a href="/">Return to Home</a>
        </div>
      </body>
    </html>`,
    statusCode
  );
};

export const notFoundHandler: NotFoundHandler = (c: Context) => {
  const isApi = isApiRequest(c);

  if (isApi) {
    return c.json(
      {
        success: false,
        error: `Endpoint not found: ${c.req.method} ${c.req.path}`,
      },
      404
    );
  }

  return c.html(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Not Found</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #1e293b; border-radius: 16px; padding: 3rem 2rem; max-width: 500px; text-align: center; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; margin-bottom: 1rem; }
          h1 { margin: 0 0 1rem; font-size: 2rem; color: #f8fafc; }
          p { color: #94a3b8; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; }
          .actions { display: flex; gap: 1rem; justify-content: center; }
          .btn-primary { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; }
          .btn-secondary { background: #334155; color: #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; }
          .btn-primary:hover { background: #2563eb; }
          .btn-secondary:hover { background: #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">404 Error</span>
          <h1>Page Not Found</h1>
          <p>The short link or page you are trying to access does not exist or may have been removed.</p>
          <div class="actions">
            <a href="/" class="btn-primary">Return Home</a>
            <a href="/dashboard" class="btn-secondary">View Dashboard</a>
          </div>
        </div>
      </body>
    </html>`,
    404
  );
};
