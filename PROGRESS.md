# Progress

## 2026-03-16 — Poker Session Tracker (core feature + deployment)

**What was built:**
- Node.js + Express backend (`backend/`) with two endpoints: `POST /api/sessions` and `GET /api/sessions`
- PostgreSQL schema via `pg` — `sessions` table auto-created on startup with `CREATE TABLE IF NOT EXISTS`
- Vanilla JS frontend served as static files from `backend/public/` — session form + history table with running totals
- 14 unit tests (Jest + Supertest) mocking `pg` — covers happy path, all validation errors, and DB failure paths
- `render.yaml` for one-click Render deployment (web service + free PostgreSQL)
- `.gitignore` and `.env.example` added

**Key decisions:**
- Switched from SQLite (original plan) to PostgreSQL for cloud deployment compatibility; SQLite files are ephemeral on Render's free tier
- Frontend served directly from Express (`express.static`) rather than a separate static host — single service to deploy, simpler setup
- `jest.mock('pg', factory)` pattern used to expose mock query spy via `_getMockQuery()`, avoiding Jest hoisting/TDZ issues
- `initDb()` only called at startup (`require.main === module`), not when module is imported — keeps tests fast and side-effect-free

**Lessons learned:**
- Jest hoists `jest.mock()` above all code but the factory is only invoked on first `require()`, so outer variables set before `require()` calls are safely accessible inside the factory's closure
- Render `render.yaml` `rootDir` must point to the directory containing `package.json`; build/start commands run relative to that directory

## 2026-03-15 — Initial scaffold
- Created `README.md` with placeholder sections.
- Added `index.html`: minimal HTML5 Hello World page.
