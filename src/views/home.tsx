import { FC } from "hono/jsx";
import { LinkWithStatus } from "../types/index.js";
import { Layout } from "./layout.js";

interface HomeProps {
  createdLink?: LinkWithStatus | null;
  error?: string | null;
}

export const HomeView: FC<HomeProps> = ({ createdLink, error }) => {
  return (
    <Layout title="Lightning Fast URL Shortener" currentPath="/">
      <div style="max-width: 760px; margin: 0 auto; text-align: center;">
        {/* Hero */}
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-size: 2.75rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            Shorter Links, Smarter Insights
          </h1>
          <p style="font-size: 1.15rem; color: var(--text-muted); max-width: 580px; margin: 0 auto;">
            Create clean, memorable short links with custom aliases, automatic expiration, and
            real-time click analytics.
          </p>
        </div>

        {/* Error notification if any */}
        {error && (
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Banner if link was created */}
        {createdLink && (
          <div
            class="card"
            style="border-color: #3b82f6; background: #13223f; margin-bottom: 2rem; text-align: left; animation: fadeIn 0.3s ease;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <span class="badge badge-active">Link Created Successfully!</span>
              <span class="badge badge-neutral">Code: {createdLink.code}</span>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center; background: #0b1220; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--card-border); margin-bottom: 1rem; flex-wrap: wrap;">
              <a
                href={createdLink.short_url}
                target="_blank"
                id="createdShortUrl"
                style="font-size: 1.25rem; font-weight: 700; color: #60a5fa; word-break: break-all;"
              >
                {createdLink.short_url}
              </a>
              <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                <button
                  type="button"
                  class="btn btn-primary"
                  style="padding: 0.5rem 1rem; font-size: 0.85rem;"
                  onclick={`copyToClipboard('${createdLink.short_url}')`}
                >
                  📋 Copy
                </button>
                <a
                  href={`/analytics/${createdLink.code}`}
                  class="btn btn-secondary"
                  style="padding: 0.5rem 1rem; font-size: 0.85rem;"
                >
                  📊 Analytics
                </a>
              </div>
            </div>

            <div style="font-size: 0.875rem; color: var(--text-muted);">
              <strong>Destination:</strong>{" "}
              <span class="truncate" style="max-width: 500px;">
                {createdLink.original_url}
              </span>
              {createdLink.expires_at && (
                <div style="margin-top: 0.25rem;">
                  <strong>Expires:</strong> {new Date(createdLink.expires_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shorten Form Card */}
        <div class="card" style="text-align: left;">
          <form action="/" method="post">
            <div class="form-group">
              <label for="url">Destination Long URL *</label>
              <div style="display: flex; gap: 0.5rem;">
                <input
                  type="url"
                  id="url"
                  name="url"
                  placeholder="https://example.com/very/long/url/to/shorten"
                  required
                  autofocus
                />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label for="alias">
                  Custom Alias <span class="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="alias"
                  name="alias"
                  placeholder="e.g. spring-sale-2026"
                  pattern="^[a-zA-Z0-9_-]{3,50}$"
                  title="3 to 50 alphanumeric characters, hyphens or underscores"
                />
              </div>

              <div class="form-group">
                <label for="expiresAt">
                  Expiration Date <span class="text-muted">(Optional)</span>
                </label>
                <input type="datetime-local" id="expiresAt" name="expiresAt" />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%; font-size: 1.05rem; padding: 0.85rem;"
            >
              Shorten URL &rarr;
            </button>
          </form>
        </div>

        {/* Feature Highlights */}
        <div class="grid-4" style="margin-top: 3.5rem; text-align: left;">
          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚡</div>
            <h3 style="font-size: 1.05rem; margin-bottom: 0.25rem;">High Velocity</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Instant redirection powered by SQLite WAL mode and Hono router.
            </p>
          </div>

          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📊</div>
            <h3 style="font-size: 1.05rem; margin-bottom: 0.25rem;">Deep Analytics</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Track daily clicks, top referrers, browsers, and user agents in real time.
            </p>
          </div>

          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🏷️</div>
            <h3 style="font-size: 1.05rem; margin-bottom: 0.25rem;">Custom Branded</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Assign custom aliases for brand campaigns or marketing efforts.
            </p>
          </div>

          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏳</div>
            <h3 style="font-size: 1.05rem; margin-bottom: 0.25rem;">Auto-Expiry</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Schedule links to automatically expire after a specific timestamp.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
