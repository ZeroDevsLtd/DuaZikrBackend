# Dua & Zikr Backend v2

Node.js (TypeScript) + Fastify + MySQL/MariaDB API for the Dua & Zikr app, with a small built-in admin panel.

It replaces the old Django backend (`../DuaZikrBackend`) and keeps **the same URLs and JSON response shapes**,
so the current mobile app works by only changing its `API_URL`.

## Quick start

```bash
npm install
cp .env.example .env          # then fill in DB credentials, admin login, SESSION_SECRET
npm run db:setup              # create tables + insert seed content
npm run dev                   # http://localhost:8000
```

- Admin panel: <http://localhost:8000/admin/>
- API base URL for the app: `http://<host>:8000/api`
- Smoke test (server must be running): `npm run smoke`

Create the database first (MySQL 8 or MariaDB 10.6+):

```sql
CREATE DATABASE dua_zikr_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dua_zikr'@'localhost' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON dua_zikr_v2.* TO 'dua_zikr'@'localhost';
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload |
| `npm run build` / `npm start` | Compile to `dist/` and run it (production) |
| `npm run db:migrate` | Apply new files in `db/migrations/` |
| `npm run db:seed` | Insert seed content that is missing (never overwrites admin edits) |
| `npm run db:setup` | Migrate + seed |
| `npm run seed:build` | Rebuild `db/seed-data/seed.json` from the old DB export and the app's bundled duas |
| `npm run smoke` | Call every public endpoint and check the shapes the app relies on |
| `npm run typecheck` | TypeScript check |

## Public API (`/api`)

All paths accept a trailing slash or not. Auth uses the v1 header `Authorization: Token <token>`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/` and `/api/info/` | – | API info + statistics (the app pings `/api/` to check reachability) |
| GET | `/api/getalldua/` | – | `{ metadata: { categories, … }, duas }` — what the app syncs |
| GET | `/api/getallcategory/` | – | Categories + metadata |
| GET | `/api/getallads` | – | `{ success, data: { ads, lastUpdated } }` |
| GET | `/api/dua/{id}/` | – | One dua; increments its view count |
| GET | `/api/category/{slug}/` | – | Duas in a category |
| GET | `/api/search/?q=` | – | Searches titles, translations, transliteration, Arabic, source |
| GET | `/api/popular/?limit=` | – | Most viewed |
| GET | `/api/type/{type}/` | – | `quranic`, `hadith`, `traditional`, `personal` |
| GET | `/api/difficulty/{level}/` | – | `beginner`, `intermediate`, `advanced` |
| POST | `/api/favorite/{id}/` | – | Public favorite counter (v1) |
| POST | `/api/auth/signup/` | – | `name, email, password, password_confirm, phone?, age?, gender? (M/F)` → `{ user, token }` |
| POST | `/api/auth/login/` | – | `email, password` → `{ user, token }` |
| POST | `/api/auth/logout/` | token | Revokes the token used |
| GET | `/api/auth/profile/`, `/api/auth/me/` | token | Current user |
| PUT/PATCH | `/api/auth/profile/` | token | `name, phone, age, gender` |
| POST | `/api/auth/change-password/` | token | Signs out other sessions, returns a new token |
| DELETE | `/api/auth/account/` | token | Body `{ password }`; deletes account + synced data |
| POST | `/api/device/register/` | optional | Push token: `device_token, platform, app_version, package, locale` |
| GET | `/api/favorites/` | token | `{ favorites, dua_ids, count }` |
| PUT | `/api/favorites/` | token | Replace list: `{ dua_ids: [...] }` |
| POST/DELETE | `/api/favorites/{duaId}/` | token | Add / remove one |

Other pages: `/delete-account` (web account deletion, required by Google Play), `/health`.

Only duas with status **published** are returned by the public API.

### Error format (unchanged from v1)

- Field errors: `{ "email": ["…"], "message": "email: …" }`
- General: `{ "non_field_errors": ["…"], "message": "…" }`
- Auth: `401 { "detail": "…" }`

## Admin panel (`/admin/`)

Login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (12-hour signed cookie session).

- **Dashboard** — counts, translation coverage per language, most viewed duas
- **Duas** — search/filter, create, edit, delete; translations per language (en, bn, ar, de + ur, es, id);
  review workflow: `draft → review → published`, *reviewed by*, authenticity grade, source references
- **Categories**, **Ads** (with live preview) — create, edit, delete
- **Users** — list, delete; **Devices** — registered push tokens
- **API tester** — call any public endpoint; signup/login fills the token automatically; "run all GET endpoints" check

## Data model

Translations are stored in `dua_translations` / `category_translations` (one row per language), so adding a
language needs no schema change: add it to `src/lib/languages.ts`.
User tokens are stored as SHA-256 hashes; passwords with bcrypt.

## Seed content

`db/seed-data/seed.json` is built from:

1. the old Django database export (`legacy_*.json`): 15 categories, ads, and old duas;
2. the app's bundled duas (`Dua-Zikr/src/data/duas.ts`) — kept with their app ids (`q1`, `h1`, …) so favorites stay valid.

Old duas that duplicated an app dua were dropped, and their extra translations (de, ur, es, id, …) were merged
into the matching app dua. A new `daily-life` category holds the home/clothing duas. The old "Test Ads" entry was
dropped and the "Premium Features" ad starts inactive.

> **Seeded content is published but not yet scholar-reviewed.** Review each dua in the admin panel
> and fill in *Reviewed by* and *Authenticity*.

## Pointing the mobile app here

Set `expo.extra.API_URL` in the app's `app.json` to this server's `/api` URL, e.g.
`https://api.example.com/api` (production) or `http://<your-LAN-IP>:8000/api` (local testing on a phone).
Android release builds block plain `http://`, so production must use HTTPS.

## Deploying

See [DEPLOYMENT.md](DEPLOYMENT.md): one script prepares an Ubuntu VPS (Node, MariaDB, nginx, HTTPS,
firewall, backups), a second one uploads and releases the code.

## Not carried over from v1

- Password-reset and email-verification emails (the app does not call them; needs an SMTP provider).
- `create-dua` API endpoint — use the admin panel instead.

The old project's docs are kept in `legacy/` for reference.
