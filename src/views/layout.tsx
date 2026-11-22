import { Child, FC } from "hono/jsx";

export const Layout: FC<{ title: string; currentPath?: string; children: Child }> = ({
  title,
  currentPath = "/",
  children,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} | HonoLink</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --bg: #0b0f19;
              --card-bg: #131b2e;
              --card-border: #1f2d47;
              --card-hover: #17223b;
              --text: #f1f5f9;
              --text-muted: #94a3b8;
              --primary: #3b82f6;
              --primary-hover: #2563eb;
              --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              --accent: #8b5cf6;
              --success: #10b981;
              --danger: #ef4444;
              --warning: #f59e0b;
              --radius: 12px;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: var(--bg);
              color: var(--text);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              line-height: 1.5;
            }
            a {
              color: var(--primary);
              text-decoration: none;
              transition: color 0.15s ease;
            }
            a:hover {
              color: #60a5fa;
            }
            header {
              border-bottom: 1px solid var(--card-border);
              background: rgba(11, 15, 25, 0.8);
              backdrop-filter: blur(12px);
              position: sticky;
              top: 0;
              z-index: 50;
            }
            .header-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 1rem 1.5rem;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              font-size: 1.25rem;
              font-weight: 700;
              color: #fff;
              text-decoration: none;
            }
            .brand-badge {
              background: var(--primary-gradient);
              padding: 0.25rem 0.5rem;
              border-radius: 6px;
              font-size: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            nav {
              display: flex;
              gap: 1.5rem;
              align-items: center;
            }
            .nav-link {
              color: var(--text-muted);
              font-weight: 500;
              font-size: 0.95rem;
              padding: 0.4rem 0.75rem;
              border-radius: 6px;
              transition: all 0.2s ease;
            }
            .nav-link:hover, .nav-link.active {
              color: #fff;
              background: var(--card-border);
            }
            main {
              flex: 1;
              max-width: 1200px;
              width: 100%;
              margin: 0 auto;
              padding: 2.5rem 1.5rem;
            }
            footer {
              border-top: 1px solid var(--card-border);
              padding: 2rem 1.5rem;
              text-align: center;
              color: var(--text-muted);
              font-size: 0.875rem;
            }
            .card {
              background: var(--card-bg);
              border: 1px solid var(--card-border);
              border-radius: var(--radius);
              padding: 1.75rem;
              box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            }
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              font-weight: 600;
              font-size: 0.95rem;
              padding: 0.7rem 1.4rem;
              border-radius: 8px;
              border: none;
              cursor: pointer;
              transition: all 0.2s ease;
              text-decoration: none;
            }
            .btn-primary {
              background: var(--primary-gradient);
              color: white;
            }
            .btn-primary:hover {
              opacity: 0.95;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            .btn-secondary {
              background: #1e293b;
              color: var(--text);
              border: 1px solid var(--card-border);
            }
            .btn-secondary:hover {
              background: #334155;
              color: white;
            }
            .btn-danger {
              background: rgba(239, 68, 68, 0.15);
              color: #f87171;
              border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .btn-danger:hover {
              background: var(--danger);
              color: white;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              padding: 0.2rem 0.65rem;
              font-size: 0.75rem;
              font-weight: 600;
              border-radius: 9999px;
            }
            .badge-active {
              background: rgba(16, 185, 129, 0.15);
              color: #34d399;
              border: 1px solid rgba(16, 185, 129, 0.3);
            }
            .badge-expired {
              background: rgba(239, 68, 68, 0.15);
              color: #f87171;
              border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .badge-neutral {
              background: rgba(148, 163, 184, 0.15);
              color: #cbd5e1;
              border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .form-group {
              margin-bottom: 1.25rem;
            }
            label {
              display: block;
              margin-bottom: 0.5rem;
              font-size: 0.875rem;
              font-weight: 500;
              color: var(--text);
            }
            input[type="text"], input[type="url"], input[type="datetime-local"] {
              width: 100%;
              padding: 0.75rem 1rem;
              border-radius: 8px;
              border: 1px solid var(--card-border);
              background: #0d1322;
              color: white;
              font-size: 1rem;
              transition: border-color 0.2s;
            }
            input:focus {
              outline: none;
              border-color: var(--primary);
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
            }
            .grid-2 {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 1.5rem;
            }
            .grid-4 {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 1.25rem;
            }
            .toast {
              position: fixed;
              bottom: 2rem;
              right: 2rem;
              background: #10b981;
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-weight: 500;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
              display: none;
              animation: fadeIn 0.2s ease-in-out;
              z-index: 100;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.95rem;
            }
            th {
              text-align: left;
              padding: 0.875rem 1rem;
              border-bottom: 1px solid var(--card-border);
              color: var(--text-muted);
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.75rem;
              letter-spacing: 0.05em;
            }
            td {
              padding: 1rem;
              border-bottom: 1px solid var(--card-border);
              vertical-align: middle;
            }
            tr:hover td {
              background: rgba(255, 255, 255, 0.02);
            }
            .text-muted {
              color: var(--text-muted);
            }
            .truncate {
              max-width: 320px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              display: inline-block;
              vertical-align: middle;
            }
          `,
          }}
        />
      </head>
      <body>
        <header>
          <div class="header-container">
            <a href="/" class="brand">
              <span>⚡ HonoLink</span>
              <span class="brand-badge">Fast & Secure</span>
            </a>
            <nav>
              <a href="/" class={`nav-link ${currentPath === "/" ? "active" : ""}`}>
                Home
              </a>
              <a
                href="/dashboard"
                class={`nav-link ${currentPath === "/dashboard" ? "active" : ""}`}
              >
                Dashboard
              </a>
              <a href="/api/links" target="_blank" class="nav-link" title="View JSON API endpoints">
                REST API
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer>
          <p>
            Built with <strong>Hono</strong>, <strong>TypeScript</strong>, and{" "}
            <strong>better-sqlite3</strong>. High performance URL shortener with analytics.
          </p>
        </footer>

        <div id="toast" class="toast">
          Copied to clipboard!
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            function copyToClipboard(text, customMsg) {
              navigator.clipboard.writeText(text).then(() => {
                const toast = document.getElementById('toast');
                if (toast) {
                  toast.textContent = customMsg || 'Copied to clipboard!';
                  toast.style.display = 'block';
                  setTimeout(() => { toast.style.display = 'none'; }, 2500);
                }
              }).catch(err => {
                prompt("Copy this URL:", text);
              });
            }
          `,
          }}
        />
      </body>
    </html>
  );
};
