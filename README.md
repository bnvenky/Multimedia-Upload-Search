# MediaVault — Multimedia Upload & Search

A full-stack web app to **upload, preview and search** images, videos, audio and PDFs, with **ranked, typo-tolerant search**, **secure JWT sessions with rotating refresh tokens**, and **real-time updates**.

| | |
|---|---|
| **Frontend** | React 19 (Hooks) · **Redux Toolkit** (client state) · **TanStack Query** (server state) · **Tailwind CSS v4** + **SASS** theme tokens · React Router 7 · Vite 8 |
| **Backend** | Node.js · **Express 5** · **MongoDB Atlas** (Mongoose 9) · **Cloudinary** · **JWT** · **Socket.IO** · Zod · Pino |
| **Docs & tooling** | **Swagger / OpenAPI 3** (generated from the validation schemas) · **Postman** collection · ESLint · GitHub Actions · Docker |

> **Live demo:** https://multimedia-upload-search-pntz.onrender.com

![Library](docs/screenshots/library.png)

<table>
  <tr>
    <td><img src="docs/screenshots/search-ranking.png" alt="Ranked search with score breakdown" /></td>
    <td><img src="docs/screenshots/dashboard.png" alt="Dashboard" /></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/realtime-notification.png" alt="Real-time upload notification" /></td>
    <td><img src="docs/screenshots/pdf-preview.png" alt="PDF preview" /></td>
  </tr>
</table>

---

## Contents

1. [Requirements coverage](#-requirements-coverage)
2. [Architecture](#-architecture)
3. [Getting started](#-getting-started)
4. [API](#-api)
5. [Security](#-security)
6. [Search & ranking](#-search--ranking)
7. [Real-time updates](#-real-time-updates)
8. [Deployment](#-deployment)
9. [Troubleshooting](#-troubleshooting)
10. [Assumptions, trade-offs & next steps](#-assumptions-trade-offs--next-steps)

---

## ✅ Requirements coverage

| Requirement | Implementation |
|---|---|
| Upload & preview images, videos, audio, PDFs | Drag-and-drop multi-file upload with per-file metadata, live progress, cancel & retry. Previews stream straight from Cloudinary: image viewer, video player, audio player with waveform, inline PDF. |
| Secure authentication | Register / login / refresh / logout / logout-everywhere. 15-min JWT access token kept **in memory**, refresh token in an **HTTP-only cookie** with **rotation + reuse detection**. |
| Protected routes | Every `/files` and `/search` endpoint requires a Bearer token; React routes are guarded too. |
| Search by keywords (name, tags) | Matches title, file name, tags and description — **typo-tolerant** (`wildlfe` → *wildlife*) and prefix-aware (`presen` → *presentation*). |
| Rank by relevance (views, date, tags) | `0.70·relevance + 0.20·popularity + 0.10·freshness` with field weights; each result shows *why* it ranked (see [Search & ranking](#-search--ranking)). |
| Cloudinary storage + MongoDB metadata | Files stored in Cloudinary (chunked for large videos); URL, type, size, dimensions, duration, pages and thumbnails stored in MongoDB. |
| Swagger / OpenAPI | Interactive docs at **`/api/docs`**, spec at `/api/docs/openapi.json` and [`docs/openapi.json`](docs/openapi.json). |
| Error handling | One error envelope with stable codes, field-level validation details and request IDs. In the UI every failure (API, upload, validation, network) is shown as a **toast** through one shared handler, plus inline field errors on forms. |
| Input validation (type/size limits) | Zod on every request; uploads checked by **magic bytes** (not just extension), per-type size limits, SVG blocked. |
| README / deployment | This file, Docker image, `render.yaml`, `railway.json`, `vercel.json`, CI workflow. |
| ⭐ Bonus: real-time | Socket.IO: new uploads appear instantly for everyone with a toast; edits and deletes sync live. |
| ⭐ Bonus: advanced search | Filters for type, tags, date range and owner scope; fuzzy matching; autocomplete; popular tags; 6 sort orders + *trending*. |
| ⭐ Bonus: ranking algorithm | Two-stage retrieve-then-rerank engine with an explainable score breakdown. |

---

## 🏗 Architecture

```mermaid
flowchart LR
  subgraph Browser["Browser — React 19"]
    UI["Pages & components<br/>(Tailwind CSS)"]
    RQ["TanStack Query<br/>server state & cache"]
    RX["Redux Toolkit<br/>session · upload queue · UI"]
    UI --> RQ
    UI --> RX
  end

  subgraph API["Node.js — Express 5"]
    MW["Middleware<br/>helmet · cors · rate limits · auth · validation · upload"]
    CT["Controllers"]
    SV["Services<br/>auth · session · files · search"]
    BUS(("Event bus"))
    WS["Socket.IO gateway"]
    MW --> CT --> SV --> BUS --> WS
  end

  RQ -- "REST + Bearer JWT" --> MW
  RX -- "multipart upload (XHR progress)" --> MW
  UI <-- "file:uploaded / updated / deleted" --> WS
  SV --> DB[("MongoDB Atlas<br/>users · sessions · files · search index")]
  SV --> CDN["Cloudinary<br/>storage & transformations"]
  UI -- "previews & thumbnails" --> CDN
```

**Why this shape**

- **Layered backend.** `routes → middleware → controllers → services → models`. Controllers only translate HTTP; business rules live in services; request/response shapes are Zod schemas.
- **Dependency injection.** `createApp({ storage, events })` wires everything together, so the storage provider can be swapped (e.g. S3, GCS) without touching services.
- **One source of truth for validation and docs.** The same Zod schemas validate requests and generate the Swagger spec, so the docs cannot drift from the API.
- **Server state vs client state.** TanStack Query owns everything that comes from the API (caching, pagination, background refetch, invalidation). Redux owns what only the browser knows: the session, the upload queue with progress, theme and toasts.
- **Domain events.** Services publish facts (“file uploaded”); the WebSocket gateway subscribes. For multiple instances, only the event bus changes (e.g. Redis pub/sub).

<details>
<summary><strong>Upload flow</strong></summary>

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API (Express)
  participant C as Cloudinary
  participant M as MongoDB
  participant S as Socket.IO clients
  B->>B: Validate type & size instantly
  B->>A: POST /api/v1/files (multipart, Bearer JWT)
  A->>A: Rate limit · stream to temp file with size limits
  A->>A: Detect real type from magic bytes · per-type limit
  A->>C: Upload (chunked for large files)
  C-->>A: URL, format, dimensions, duration, pages
  A->>M: Save metadata + search index
  alt database write fails
    A->>C: Delete uploaded asset (compensating action)
  end
  A-->>B: 201 Created + file
  A-)S: file:uploaded (public → everyone, private → owner)
  A->>A: Temp file removed when the response closes
```
</details>

### Project structure

```
.
├── backend/                     Node.js + Express API (JavaScript, CommonJS)
│   ├── src/
│   │   ├── index.js             Entry point: DB connection, HTTP + WebSocket server, graceful shutdown
│   │   ├── app.js               Express app: security headers, CORS, logging, routes, docs, error handling
│   │   ├── config/              Validated environment, logger, database
│   │   ├── routes/              URL → middleware chain → controller
│   │   ├── controllers/         HTTP in/out only
│   │   ├── schemas/             Zod request/response schemas (validation + Swagger)
│   │   ├── services/            Business logic: auth, sessions, tokens, files, search, Cloudinary storage
│   │   ├── models/              Mongoose models and indexes
│   │   ├── middleware/          authenticate, validate, rate-limit, upload, trusted-origin, error-handler
│   │   ├── utils/               ranking, text analysis, media type detection, query builders, errors
│   │   ├── docs/                OpenAPI path definitions
│   │   ├── events/              Domain event bus
│   │   └── sockets/             Socket.IO gateway
│   └── scripts/                 seed.js · dev-memory.js · export-openapi.js
├── frontend/                    React app (.jsx)
│   └── src/
│       ├── api/                 HTTP client, session refresh, query client & keys, upload with progress
│       ├── store/               Redux Toolkit slices (auth, uploads, ui, toasts) + listener middleware
│       ├── hooks/               TanStack Query hooks, real-time, URL-synced filters
│       ├── pages/               Library, Upload, File details, Dashboard, Login, Register
│       ├── components/          common · layout · files · search · upload
│       ├── routes/              Lazy-loaded routes and guards
│       ├── styles/              theme.scss (SASS design tokens) + index.css (Tailwind theme)
│       └── utils/               formatting, media rules, validation, class helpers
├── docs/                        openapi.json · postman_collection.json · screenshots
├── Dockerfile · docker-compose.yml · render.yaml · railway.json
└── .github/workflows/ci.yml
```

---

## 🚀 Getting started

**Prerequisites:** Node.js **22.12+** (developed on Node 25; CI runs Node 22) and npm 10+. For real uploads you also need a MongoDB Atlas cluster and a Cloudinary account.

```bash
git clone https://github.com/bnvenky/Multimedia-Upload-Search.git
cd Multimedia-Upload-Search
npm run install:all
```

### Option A — instant demo (no accounts needed)

Runs the API on an **in-memory MongoDB** pre-filled with demo users and 16 media files (served from Cloudinary's public demo cloud):

```bash
npm run dev:demo
```

Open **http://localhost:5173** and sign in with **`demo@mediavault.dev` / `Demo@1234`** (or `sam@mediavault.dev`). Open a second browser window as the other user to watch real-time updates.

> Uploading new files still needs a valid `CLOUDINARY_URL` in `backend/.env`.

### Option B — with MongoDB Atlas & Cloudinary

```bash
cp backend/.env.example backend/.env      # then fill in the values below
npm run seed                              # optional: demo users + sample library
npm run dev                               # API on :5000, web app on :5173
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | Atlas connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `CLOUDINARY_URL` | `cloudinary://<api_key>:<api_secret>@<cloud_name>` (the key needs upload permission) |
| `JWT_ACCESS_SECRET` | ≥ 32 random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_ORIGINS` | Allowed browser origins, comma-separated (default `http://localhost:5173`) |
| `COOKIE_SAME_SITE` / `COOKIE_SECURE` | `lax` for same-site setups; `none` + `true` when frontend and API are on different sites |

All variables are validated at startup; see [`backend/.env.example`](backend/.env.example) for the full list. The frontend needs no `.env` in development: Vite proxies `/api` and `/socket.io` to the API, so the refresh cookie stays first-party.

### Option C — Docker (production build)

```bash
docker compose up --build   # MongoDB + app on http://localhost:5000
```

### Useful scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` / `dev:demo` | API + web app together |
| root | `npm run lint` | Lint both apps |
| backend | `npm run seed` | Demo accounts and media |
| backend | `npm run docs:export` | Regenerate `docs/openapi.json` |
| frontend | `npm run build` | Production build |

---

## 📡 API

Base path **`/api/v1`**. Interactive docs: **http://localhost:5000/api/docs** (click *Authorize* after logging in). Import [`docs/postman_collection.json`](docs/postman_collection.json) into Postman; login saves the token automatically.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | – | Create an account → access token + refresh cookie |
| `POST` | `/auth/login` | – | Sign in (per-account brute-force protection) |
| `POST` | `/auth/refresh` | cookie | Rotate refresh token, get new access token (`204` if not signed in) |
| `POST` | `/auth/logout` · `/auth/logout-all` | cookie · JWT | Revoke this session · all sessions |
| `GET` | `/auth/me` | JWT | Current user |
| `POST` | `/files` (alias **`/upload`**) | JWT | Upload one file (`multipart/form-data`: `file`, `title`, `description`, `tags`, `visibility`) |
| `GET` | `/files` | JWT | Browse: `type`, `tags`, `from`, `to`, `scope=all\|mine`, `sort=newest\|oldest\|views\|size\|name\|trending`, `page`, `limit` |
| `GET` | `/files/:id` | JWT | File details (records a de-duplicated view); PDFs include one preview image per page |
| `GET` | `/files/:id/download` | JWT | Signed, 10-minute link to the original file (same access rules) |
| `PATCH` | `/files/:id` | JWT (owner) | Update title, description, tags, visibility |
| `DELETE` | `/files/:id` | JWT (owner) | Delete from Cloudinary and MongoDB |
| `GET` | `/files/stats` | JWT | Your file count, storage and views per type |
| `GET` | **`/search?query=video`** | JWT | Ranked search + all browse filters, `sort=relevance\|…` |
| `GET` | `/search/suggestions?q=` | JWT | Autocomplete (tags & titles) |
| `GET` | `/search/tags` | JWT | Most used tags |
| `GET` | `/health` · `/health/ready` | – | Liveness · readiness (database + storage) |

**Response envelope**

```jsonc
// success
{ "success": true, "data": { "items": [ … ] }, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNextPage": true } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed — email: Must be a valid email address", "details": [ … ], "requestId": "5d1f…" } }
```

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `TOKEN_ROTATED`, `SESSION_REVOKED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `RATE_LIMITED`, `STORAGE_ERROR`, `INTERNAL_ERROR`.

---

## 🔐 Security

**Authentication & sessions**

- **Passwords:** bcrypt (cost 12). Rules: 8–72 bytes with an uppercase letter, a lowercase letter and a number (checked in the API and shown live in the form). Login responses take the same time whether or not the email exists.
- **Access token:** JWT, HS256 with the algorithm pinned, **15-minute** expiry. Issuer, audience, token type and a unique `jti` are all verified. The frontend keeps it **only in memory**, never `localStorage`.
- **Refresh token:** 384-bit random value stored as a **SHA-256 hash**. It lives in an **HTTP-only, path-scoped** (`/api/v1/auth`) cookie that is `SameSite` and `Secure` in production, and expires after 7 days (a TTL index cleans up old sessions).
- **Rotation with reuse detection:** every refresh consumes the token atomically. Replaying an old token revokes the whole session family, which stops a stolen token. A 10-second grace window keeps two tabs refreshing at once from logging the user out.
- **Signing out:** logout revokes the current session; *logout everywhere* revokes all of the user's sessions.

**Request hardening**

- **CSRF:** `SameSite` cookies plus an **Origin allow-list check** on the cookie endpoints (refresh and logout).
- **Rate limits:** global per IP, stricter on auth endpoints, **failed logins per IP + account**, and a per-user upload quota.
- **Validation:** strict Zod schemas on params, query and body. Unknown fields are rejected, which also blocks NoSQL operator injection such as `{"email": {"$ne": null}}`.
- **Headers:** Helmet with a tight **Content-Security-Policy** (media only from Cloudinary) and HSTS. CORS uses an allow-list, JSON bodies are capped at 100 KB, and `x-powered-by` is disabled.

**File uploads**

- **Stream handling:** the body is streamed to a temp file (never buffered in memory), with limits on size, field count and file count enforced while it arrives.
- **Type checks:** an allow-list of MIME types and extensions rejects files early. The **real type is then detected from magic bytes**, so a renamed `.exe` or HTML file is refused.
- **Size and names:** per-type size limits apply; SVG is blocked because it can carry scripts; file names are sanitized.
- **Cleanup:** temp files are always deleted. If saving metadata fails, the Cloudinary asset is removed again.

**Authorization and errors**

- **Access control:** only the owner (or an admin) can edit or delete a file. Other users' **private files return 404**, so their existence is not revealed.
- **No leaks:** production errors never expose stack traces or internals. Every error carries a request ID, and logs redact tokens, cookies and passwords.

---

## 🔎 Search & ranking

Search is a **two-stage "retrieve, then re-rank" engine**, the same pattern large search systems use, built on plain MongoDB so it runs anywhere (Atlas, local, or a local in-memory instance).

1. **Indexing (on save).** A Mongoose hook normalizes the title, file name, tags and description: it lowercases, strips accents, and splits camelCase, `snake_case` and digits. The resulting words and their **character trigrams** (`video` → `␣␣v ␣vi vid ide deo eo␣`) are stored on the document with a multikey index.
2. **Retrieval (MongoDB).** The query is analyzed the same way. MongoDB returns documents sharing trigrams with it, within the viewer's access rules and filters, ordered by trigram overlap (at most 500 candidates).
3. **Ranking (Node.js).** Each candidate is scored:

```
score = 0.70 × relevance + 0.20 × popularity + 0.10 × freshness        (each 0…1)

relevance   per query word: best field match × field weight
            field weight: tags 1.0 · title 0.85 · file name 0.65 · description 0.35
            match: exact 1.0 · prefix 0.8 · typo (edit distance ≤ 1–2) up to 0.55
            + small bonus for matches in several fields, + phrase bonus in title
            averaged over query words → files matching every word win
popularity  log(1 + views) / log(1 + 500)     diminishing returns, so views cannot bury relevance
freshness   0.5 ^ (age in days / 14)          halves every two weeks
```

Every result carries its breakdown (`score.relevance`, `popularity`, `freshness`, and which words matched which field and how). The UI shows it in a tooltip on the match badge.

Supporting details:

- **Views are de-duplicated:** one count per user per file every 30 minutes, via a TTL collection, so refreshing cannot game the ranking.
- **Typo precision:** short words (≤ 3 letters) must match exactly, and fuzzy matching on word starts requires the same first letter. This avoids false hits such as `park` → `marketing`.
- **Other search modes:** browsing without a query supports `trending`, which computes the popularity + freshness score inside MongoDB. Autocomplete uses anchored prefix scans on indexed tags and words.

Examples from the demo data: `wildlfe` → the three wildlife videos, `dog park` → *Happy dog in the park* first (both words, exact tag + title), `elephnts` → *Elephants at the waterhole*.

---

## ⚡ Real-time updates

- **Authentication:** the Socket.IO connection authenticates with the JWT access token. Every socket joins a private `user:<id>` room.
- **Events:** services publish domain events and the gateway broadcasts them. `file:uploaded` and `file:updated` go to everyone for public files or only the owner for private ones; a file becoming private is removed from everyone else's lists.
- **Client handling:** the client invalidates the matching TanStack Query caches, so lists, stats and tags refresh instantly, and it shows a toast when *someone else* uploads.
- **Token expiry:** the socket is closed when its access token expires, and the client refreshes the session and reconnects automatically.