import { FC } from "hono/jsx";
import { LinkWithStatus } from "../types/index.js";
import { Layout } from "./layout.js";

interface DashboardProps {
  links: LinkWithStatus[];
}

export const DashboardView: FC<DashboardProps> = ({ links }) => {
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const activeCount = links.filter((l) => !l.is_expired).length;
  const expiredCount = links.filter((l) => l.is_expired).length;

  return (
    <Layout title="Dashboard" currentPath="/dashboard">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 2rem; font-weight: 700;">Links Dashboard</h1>
          <p style="color: var(--text-muted);">Manage all created shortened links and view stats</p>
        </div>
        <a href="/" class="btn btn-primary">
          + Create New Link
        </a>
      </div>

      {/* Summary Stat Cards */}
      <div class="grid-4" style="margin-bottom: 2rem;">
        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Total Links
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #fff;">{links.length}</div>
        </div>

        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Total Clicks
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">{totalClicks}</div>
        </div>

        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Active Links
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #10b981;">{activeCount}</div>
        </div>

        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Expired Links
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">{expiredCount}</div>
        </div>
      </div>

      {/* Links List */}
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.15rem; font-weight: 600;">All Short Links</h2>
          <input
            type="text"
            id="searchInput"
            placeholder="Search links..."
            style="width: 240px; padding: 0.4rem 0.8rem; font-size: 0.875rem;"
            onkeyup="filterLinks()"
          />
        </div>

        {links.length === 0 ? (
          <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
            <p style="font-size: 1.1rem; margin-bottom: 1rem;">No links created yet.</p>
            <a href="/" class="btn btn-primary">
              Create Your First Link
            </a>
          </div>
        ) : (
          <div style="overflow-x: auto;">
            <table id="linksTable">
              <thead>
                <tr>
                  <th>Short Link</th>
                  <th>Original URL</th>
                  <th>Status</th>
                  <th>Clicks</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const createdDate = new Date(link.created_at).toLocaleDateString();
                  const expiresText = link.expires_at
                    ? new Date(link.expires_at).toLocaleDateString()
                    : "Never";

                  return (
                    <tr key={link.id} class="link-row">
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <a
                            href={link.short_url}
                            target="_blank"
                            style="font-weight: 600; font-family: monospace;"
                          >
                            /{link.code}
                          </a>
                          <button
                            type="button"
                            class="btn btn-secondary"
                            style="padding: 0.2rem 0.45rem; font-size: 0.75rem;"
                            title="Copy link"
                            onclick={`copyToClipboard('${link.short_url}')`}
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td>
                        <a
                          href={link.original_url}
                          target="_blank"
                          class="truncate text-muted"
                          title={link.original_url}
                        >
                          {link.original_url}
                        </a>
                      </td>
                      <td>
                        {link.is_expired ? (
                          <span class="badge badge-expired">Expired</span>
                        ) : (
                          <span class="badge badge-active">Active</span>
                        )}
                      </td>
                      <td>
                        <span style="font-weight: 700; color: #fff; background: rgba(59, 130, 246, 0.15); padding: 0.2rem 0.5rem; border-radius: 6px;">
                          {link.clicks}
                        </span>
                      </td>
                      <td class="text-muted" style="font-size: 0.85rem;">
                        {createdDate}
                      </td>
                      <td class="text-muted" style="font-size: 0.85rem;">
                        {expiresText}
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 0.4rem; justify-content: flex-end;">
                          <a
                            href={`/analytics/${link.code}`}
                            class="btn btn-secondary"
                            style="padding: 0.35rem 0.7rem; font-size: 0.8rem;"
                            title="View Analytics"
                          >
                            📊 Stats
                          </a>
                          <form
                            action={`/links/${link.code}/delete`}
                            method="post"
                            style="display: inline;"
                            onsubmit="return confirm('Are you sure you want to delete this link?');"
                          >
                            <button
                              type="submit"
                              class="btn btn-danger"
                              style="padding: 0.35rem 0.7rem; font-size: 0.8rem;"
                              title="Delete Link"
                            >
                              🗑️
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          function filterLinks() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const rows = document.querySelectorAll('.link-row');
            rows.forEach(row => {
              const text = row.textContent || row.innerText;
              row.style.display = text.toLowerCase().includes(filter) ? '' : 'none';
            });
          }
        `,
        }}
      />
    </Layout>
  );
};
