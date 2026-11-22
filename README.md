# ⚡ HonoLink - Production-Ready URL Shortener with Analytics

A high-performance, full-stack URL shortener and analytics engine built with Node.js, TypeScript, **Hono**, SQLite (`better-sqlite3`), and server-rendered **Hono JSX**.

---

## 🌟 Key Features

1. **Short Link Creation**:
   - Shorten any valid HTTP/HTTPS URL.
   - Collision-resistant 6-character random alphanumeric code generator (~56.8 billion combinations).
   - Optional custom alias validation (`^[a-zA-Z0-9_-]{3,50}$`) preventing system collisions.
   - Optional expiration timestamp (ISO 8601 / datetime picker) with automatic 410 Gone handling.

2. **Redirect & Click Tracking**:
   - Sub-millisecond redirects (`302 Found`) directly to destination targets.
   - Click tracking capturing UTC timestamp, referrer domain, user agent, browser family, operating system, and IP address.
   - Denormalized link click counters updated atomically using SQLite transactions.

3. **In-Depth Analytics Dashboard**:
   - Link summary card with status badges (Active / Expired) and target preview.
   - Summary metrics: Total Clicks, Clicks Today, Top Referrer, Top Browser.
   - Responsive **SVG Daily Clicks Bar Chart** (pure vector graphics, zero heavy client JavaScript).
   - Top referrers and platform/OS breakdown with progress bars and percentage distribution.
   - Audit table with the 20 most recent clicks.

4. **Clean, Responsive UI**:
   - Built entirely with **Hono JSX** (SSR HTML) — zero separate client frontend frameworks needed.
   - Modern dark design system with fluid CSS, interactive copy-to-clipboard toast feedback, and quick search filter.
   - Dedicated views: Home (`/`), Links Dashboard (`/dashboard`), and Link Analytics (`/analytics/:code`).

5. **REST API**:
   - Clean, standardized JSON responses under `/api/*` with HTTP status codes (200, 201, 400, 404, 409, 410, 429, 500).
   - Strict request body validation powered by `zod` and `@hono/zod-validator`.

6. **Security & Performance**:
   - SQLite WAL mode (`Write-Ahead Logging`) with foreign key enforcement and indexed queries.
   - Sliding-window in-memory rate limiting middleware with `X-RateLimit-*` and `Retry-After` headers.
   - Security headers provided by `hono/secure-headers` (CSP, X-Frame-Options, X-Content-Type-Options).
   - CORS middleware enabled for API consumers.
   - Centralized error handling and structured request logging.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+ / 22+ / 24+
- **Language**: TypeScript (Strict Mode)
- **Framework**: `hono` v4 + `@hono/node-server`
- **Validation**: `zod` + `@hono/zod-validator`
- **Database**: `better-sqlite3` (WAL mode enabled)
- **Frontend / Templating**: Hono JSX (Server-Side Rendered)
- **Testing**: Vitest
- **Code Quality**: ESLint (Flat Config) + Prettier
- **Containerization**: Docker multi-stage build

---

## 📁 Project Structure

```
├── src/
│   ├── db/
│   │   ├── index.ts              # SQLite connection pool & pragmas
│   │   └── schema.sql            # Table DDL & index definitions
│   ├── middleware/
│   │   ├── rate-limiter.ts       # Sliding window rate limiter
│   │   └── error-handler.ts      # Centralized error & 404 handlers
│   ├── routes/
│   │   ├── api.ts                # REST API routes (/api/links, /api/health)
│   │   ├── redirect.ts           # Short link redirect (/ :code)
│   │   └── ui.tsx                # SSR HTML routes (/, /dashboard, /analytics/:code)
│   ├── schemas/
│   │   └── link.schema.ts        # Zod validation schemas
│   ├── services/
│   │   ├── link.service.ts       # Link creation, lookup, deletion, expiry logic
│   │   └── analytics.service.ts  # Click recording & metric aggregations
│   ├── types/
│   │   └── index.ts              # TypeScript domain types & interfaces
│   ├── utils/
│   │   ├── nanoid.ts             # Cryptographically secure code generator
│   │   └── user-agent.ts         # User-agent browser & OS parser
│   ├── views/
│   │   ├── layout.tsx            # Base HTML wrapper & theme CSS
│   │   ├── home.tsx              # Landing page & creation form
│   │   ├── dashboard.tsx         # Links management table
│   │   └── analytics.tsx         # Analytics charts & breakdowns
│   ├── app.ts                    # Hono app factory with middlewares
│   └── index.ts                  # Server entry point (@hono/node-server)
├── tests/
│   ├── api.test.ts               # API endpoint integration tests
│   ├── redirect.test.ts          # Redirect & tracking integration tests
│   ├── services.test.ts          # Unit tests for services & DB
│   └── rate-limiter.test.ts      # Rate limiting middleware tests
├── .env.example                  # Environment configuration template
├── Dockerfile                    # Multi-stage production container
├── eslint.config.mjs             # ESLint 9 configuration
├── tsconfig.json                 # Strict TypeScript configuration
└── vitest.config.ts              # Vitest test configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0

### 1. Installation
```bash
git clone <repository-url>
cd hono-url-shortener
npm install
```

### 2. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```
Default `.env` settings:
```ini
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
BASE_URL=http://localhost:3000
DATABASE_PATH=./data/urls.db
RATE_LIMIT_MAX=120
RATE_LIMIT_WINDOW_MS=60000
```

### 3. Development Server
Run with hot reload via `tsx`:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

### 4. Build & Production Run
Compile TypeScript and start the compiled application:
```bash
npm run build
npm start
```

### 5. Running Tests
Run the automated Vitest test suite:
```bash
npm test
```

### 6. Linting and Formatting
Check and enforce code quality:
```bash
npm run lint          # Check ESLint rules
npm run format:check  # Check Prettier formatting
npm run format        # Automatically format files
```

---

## 📡 REST API Documentation

### Base URL: `/api`

### 1. Health Check
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "uptime": 124.5,
  "timestamp": "2026-11-22T17:40:00.000Z"
}
```

---

### 2. Create Short Link
```http
POST /api/links
Content-Type: application/json

{
  "url": "https://github.com/honojs/hono",
  "alias": "hono-repo",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```
- `url` *(string, required)*: Valid HTTP or HTTPS URL (max 2048 chars).
- `alias` *(string, optional)*: Custom short code (3-50 chars, `[a-zA-Z0-9_-]`).
- `expiresAt` *(string, optional)*: Future ISO 8601 date string.

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "hono-repo",
    "original_url": "https://github.com/honojs/hono",
    "created_at": "2026-11-22T17:41:00.000Z",
    "expires_at": "2026-12-31T23:59:59.000Z",
    "clicks": 0,
    "is_expired": false,
    "short_url": "http://localhost:3000/hono-repo"
  }
}
```
**Error Responses:**
- `400 Bad Request`: Validation failure (invalid URL, past date, reserved alias).
- `409 Conflict`: Custom alias is already in use.
- `429 Too Many Requests`: Rate limit exceeded.

---

### 3. List All Short Links
```http
GET /api/links
```
**Response (200 OK):**
```json
{
  "success": true,
  "total": 1,
  "data": [
    {
      "id": 1,
      "code": "hono-repo",
      "original_url": "https://github.com/honojs/hono",
      "created_at": "2026-11-22T17:41:00.000Z",
      "expires_at": "2026-12-31T23:59:59.000Z",
      "clicks": 14,
      "is_expired": false,
      "short_url": "http://localhost:3000/hono-repo"
    }
  ]
}
```

---

### 4. Get Link Details
```http
GET /api/links/:code
```
**Response (200 OK):** Returns link object.
**Error Response:** `404 Not Found` if code does not exist.

---

### 5. Delete Short Link
```http
DELETE /api/links/:code
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Link \"hono-repo\" successfully deleted"
}
```

---

### 6. Get Link Analytics
```http
GET /api/links/:code/analytics
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "link": {
      "id": 1,
      "code": "hono-repo",
      "original_url": "https://github.com/honojs/hono",
      "clicks": 42,
      "is_expired": false,
      "short_url": "http://localhost:3000/hono-repo"
    },
    "totalClicks": 42,
    "clicksPerDay": [
      { "date": "2026-11-20", "count": 12 },
      { "date": "2026-11-21", "count": 18 },
      { "date": "2026-11-22", "count": 12 }
    ],
    "topReferrers": [
      { "referrer": "twitter.com", "count": 25, "percentage": 60 },
      { "referrer": "Direct / None", "count": 17, "percentage": 40 }
    ],
    "topBrowsers": [
      { "browser": "Chrome", "count": 28, "percentage": 67 },
      { "browser": "Safari", "count": 14, "percentage": 33 }
    ],
    "topOS": [
      { "os": "macOS", "count": 22, "percentage": 52 },
      { "os": "iOS", "count": 20, "percentage": 48 }
    ],
    "recentClicks": [
      {
        "id": 105,
        "timestamp": "2026-11-22T17:42:15.000Z",
        "referrer": "twitter.com",
        "browser": "Chrome",
        "os": "macOS",
        "userAgent": "Mozilla/5.0..."
      }
    ]
  }
}
```

---

## 🐳 Running with Docker

### Build the Docker image
```bash
docker build -t honolink:latest .
```

### Run the container
```bash
docker run -d \
  --name honolink \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e BASE_URL=http://localhost:3000 \
  honolink:latest
```

---

## 💡 Assumptions Made

1. **Storage Engine**: `better-sqlite3` was selected because SQLite provides zero-latency synchronous disk writes with zero network hops, and WAL mode (`journal_mode = WAL`) handles concurrent reads and atomic writes efficiently for link redirection and analytics.
2. **Frontend Architecture**: Rendered entirely server-side using **Hono JSX** with inline scoped CSS and lightweight vanilla JavaScript helpers (for clipboard copy and search filter). No client-side React or bundler overhead.
3. **Short Code Generation**: Random 6-character Base62 alphanumeric strings (`0-9a-zA-Z`) yield ~56.8 billion possibilities, making accidental collision improbable while keeping URLs short.
4. **Collision Handling**: Custom aliases are checked for uniqueness before insertion. If an alias already exists, an HTTP `409 Conflict` is returned. System reserved routes (`api`, `dashboard`, `analytics`, `health`, etc.) are blocked.
5. **Expiration Policy**: Expired links are retained in the database so their historical analytics remain viewable on `/dashboard` and `/analytics/:code`, but redirect requests (`/:code`) immediately return `410 Gone`.
6. **Rate Limiting**: Sliding window in-memory rate limiting operates per IP address. For distributed multi-instance clusters, this can easily be swapped for Redis if needed.
