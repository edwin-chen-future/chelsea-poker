# Progress

## 2026-04-01 — iOS App (React Native + Expo)

**What was built:**
- `mobile/` directory: React Native (Expo managed) app consuming the existing Express API
- Navigation: React Navigation v6 bottom tabs — Sessions list and Add Session screens
- iOS design: dark mode, iOS system colors (`#007AFF`, `#34C759`, `#FF3B30`), 4pt spacing grid, 12–16pt corner radii, minimum 44pt touch targets, haptic feedback on session submit
- Key components: `SessionCard`, `StatsHeader` (win/loss totals + average), `EmptyState`
- `SessionsScreen`: `FlatList` with pull-to-refresh, loading/error/empty states, re-fetches on tab focus via `useFocusEffect`
- `AddSessionScreen`: stake button-group selector (1/2–10/20), form validation, clears after successful submit
- 28 unit tests across 5 test files (Jest + React Native Testing Library)
- `.claude/commands/frontend-design.md`: custom slash command for iOS HIG design review
- API base URL configurable via `EXPO_PUBLIC_API_URL` env var (defaults to `http://localhost:3000`)

**Key decisions:**
- React Native + Expo managed workflow chosen over SwiftUI — reuses existing JS knowledge, no Xcode required to start
- `useFocusEffect` (re-runs on tab focus) instead of one-time `useEffect` — sessions list auto-refreshes after adding a new session
- Extracted `validate()` as pure function in `AddSessionScreen` — makes unit testing validation paths trivial without needing to render the full form
- `testID` props on `StatsHeader` values to avoid ambiguity when total and average are both `+$0`
- `@react-navigation/native` mocked in `SessionsScreen` tests to call `useFocusEffect` callback via `useEffect` immediately

**Lessons learned:**
- `jest-expo` preset handles most Expo module transforms; only `expo-haptics` and `@expo/vector-icons` needed explicit mocks in `jest.setup.js`
- `getByText` in RNTL throws on duplicate matches — use `testID` + `getByTestId` for stats values that can be equal (e.g. both `+$0`)
- `act(async () => { fireEvent.press(...) })` needed for submit handlers that trigger async API calls before asserting success/error state

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
