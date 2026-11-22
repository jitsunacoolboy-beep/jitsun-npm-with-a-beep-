import { FC } from "hono/jsx";
import { LinkAnalytics } from "../types/index.js";
import { Layout } from "./layout.js";

interface AnalyticsProps {
  analytics: LinkAnalytics;
}

export const AnalyticsView: FC<AnalyticsProps> = ({ analytics }) => {
  const { link, totalClicks, clicksPerDay, topReferrers, topBrowsers, topOS, recentClicks } =
    analytics;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayClicks = clicksPerDay.find((d) => d.date === todayStr)?.count || 0;
  const topReferrerName = topReferrers[0]?.referrer || "None";
  const topBrowserName = topBrowsers[0]?.browser || "None";

  // Compute SVG bar chart geometry
  const maxDailyCount = Math.max(1, ...clicksPerDay.map((d) => d.count));
  const chartHeight = 180;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const barCount = clicksPerDay.length;
  const barWidth = Math.max(8, Math.min(36, usableWidth / (barCount * 1.5)));
  const step = usableWidth / Math.max(1, barCount - 1);

  return (
    <Layout title={`Analytics - /${link.code}`} currentPath="/dashboard">
      {/* Back button & Link Info Card */}
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
          <a href="/dashboard" style="color: var(--text-muted); font-size: 0.9rem;">
            &larr; Back to Dashboard
          </a>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <h1 style="font-size: 1.75rem; font-weight: 700; color: #fff;">/{link.code}</h1>
                {link.is_expired ? (
                  <span class="badge badge-expired">Expired</span>
                ) : (
                  <span class="badge badge-active">Active</span>
                )}
              </div>
              <div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem;">
                Target:{" "}
                <a
                  href={link.original_url}
                  target="_blank"
                  style="color: #60a5fa; word-break: break-all;"
                >
                  {link.original_url}
                </a>
              </div>
              <div style="color: var(--text-muted); font-size: 0.85rem;">
                Created: {new Date(link.created_at).toLocaleString()} | Expires:{" "}
                {link.expires_at ? new Date(link.expires_at).toLocaleString() : "Never"}
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <button
                type="button"
                class="btn btn-primary"
                onclick={`copyToClipboard('${link.short_url}')`}
              >
                📋 Copy Link
              </button>
              <a href={link.short_url} target="_blank" class="btn btn-secondary">
                Visit ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div class="grid-4" style="margin-bottom: 2rem;">
        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Total Clicks
          </div>
          <div style="font-size: 2.25rem; font-weight: 700; color: #3b82f6;">{totalClicks}</div>
        </div>

        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Clicks Today
          </div>
          <div style="font-size: 2.25rem; font-weight: 700; color: #10b981;">{todayClicks}</div>
        </div>

        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Top Referrer
          </div>
          <div style="font-size: 1.35rem; font-weight: 600; color: #f1f5f9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {topReferrerName}
          </div>
        </div>

        <div class="card">
          <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Top Browser
          </div>
          <div style="font-size: 1.35rem; font-weight: 600; color: #f1f5f9;">{topBrowserName}</div>
        </div>
      </div>

      {/* SVG Daily Clicks Bar Chart */}
      <div class="card" style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.15rem; font-weight: 600;">Clicks Over Time (Daily)</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            Last {clicksPerDay.length} days
          </span>
        </div>

        <div style="width: 100%; overflow-x: auto;">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style="width: 100%; min-width: 580px; height: auto;"
          >
            {/* Horizontal Grid lines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="#1e293b"
              stroke-dasharray="4"
            />
            <line
              x1={paddingX}
              y1={paddingY + usableHeight / 2}
              x2={chartWidth - paddingX}
              y2={paddingY + usableHeight / 2}
              stroke="#1e293b"
              stroke-dasharray="4"
            />
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="#334155"
            />

            {/* Bars and labels */}
            {clicksPerDay.map((item, index) => {
              const x =
                barCount === 1
                  ? chartWidth / 2 - barWidth / 2
                  : paddingX + index * step - barWidth / 2;
              const barH = (item.count / maxDailyCount) * usableHeight;
              const y = chartHeight - paddingY - barH;
              const displayDate = item.date.slice(5); // MM-DD

              return (
                <g key={item.date} class="chart-bar-group">
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barH, 3)}
                    rx="4"
                    fill={item.count > 0 ? "url(#barGradient)" : "#1e293b"}
                  >
                    <title>{`${item.date}: ${item.count} clicks`}</title>
                  </rect>

                  {/* Value on top of bar */}
                  {item.count > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      text-anchor="middle"
                      fill="#94a3b8"
                      font-size="11"
                      font-weight="600"
                    >
                      {item.count}
                    </text>
                  )}

                  {/* Date Label on X Axis */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - paddingY + 18}
                    text-anchor="middle"
                    fill="#64748b"
                    font-size="10"
                  >
                    {displayDate}
                  </text>
                </g>
              );
            })}

            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#8b5cf6" />
                <stop offset="100%" stop-color="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Referrers & Device Distribution Grid */}
      <div class="grid-2" style="margin-bottom: 2rem;">
        {/* Top Referrers */}
        <div class="card">
          <h2 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 1.25rem;">
            Top Referrers
          </h2>

          {topReferrers.length === 0 ? (
            <p style="color: var(--text-muted); font-size: 0.9rem;">No referrers recorded yet.</p>
          ) : (
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              {topReferrers.map((ref) => (
                <div key={ref.referrer}>
                  <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.35rem;">
                    <span style="font-weight: 500;">{ref.referrer}</span>
                    <span style="color: var(--text-muted);">
                      {ref.count} clicks ({ref.percentage}%)
                    </span>
                  </div>
                  <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div
                      style={`background: #3b82f6; height: 100%; width: ${ref.percentage}%; border-radius: 4px;`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Browsers & Platforms */}
        <div class="card">
          <h2 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 1.25rem;">
            Browsers & Operating Systems
          </h2>

          <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem;">
              Browsers
            </div>
            {topBrowsers.length === 0 ? (
              <p style="color: var(--text-muted); font-size: 0.85rem;">No data</p>
            ) : (
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                {topBrowsers.map((b) => (
                  <div key={b.browser}>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                      <span>{b.browser}</span>
                      <span style="color: var(--text-muted);">
                        {b.count} ({b.percentage}%)
                      </span>
                    </div>
                    <div style="background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden;">
                      <div
                        style={`background: #8b5cf6; height: 100%; width: ${b.percentage}%; border-radius: 3px;`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem;">
              Operating Systems
            </div>
            {topOS.length === 0 ? (
              <p style="color: var(--text-muted); font-size: 0.85rem;">No data</p>
            ) : (
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                {topOS.map((o) => (
                  <div key={o.os}>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                      <span>{o.os}</span>
                      <span style="color: var(--text-muted);">
                        {o.count} ({o.percentage}%)
                      </span>
                    </div>
                    <div style="background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden;">
                      <div
                        style={`background: #10b981; height: 100%; width: ${o.percentage}%; border-radius: 3px;`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Clicks Log */}
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--card-border);">
          <h2 style="font-size: 1.15rem; font-weight: 600;">Recent Clicks (Last 20)</h2>
        </div>

        {recentClicks.length === 0 ? (
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            No clicks recorded yet. Share your short link to start tracking!
          </div>
        ) : (
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Referrer</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.map((click) => (
                  <tr key={click.id}>
                    <td style="font-size: 0.85rem; font-family: monospace;">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span class="truncate" style="max-width: 180px;">
                        {click.referrer}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-neutral">{click.browser}</span>
                    </td>
                    <td>
                      <span class="badge badge-neutral">{click.os}</span>
                    </td>
                    <td>
                      <span
                        class="truncate text-muted"
                        style="max-width: 250px; font-size: 0.8rem;"
                        title={click.userAgent}
                      >
                        {click.userAgent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};
