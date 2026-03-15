# Progress

## 2026-03-15 — Core session recording feature

### What was built
End-to-end poker session recording: iOS SwiftUI app → Node.js REST API → SQLite database.

**Backend (`backend/`)**
- `db.js`: SQLite schema (`sessions` table), CRUD helpers, ISO 8601 date formatting for `played_at`.
- `routes/sessions.js`: `POST /api/sessions` (validate + insert) and `GET /api/sessions` (return newest first).
- `server.js`: Express app with CORS + JSON middleware; exports `app` so Jest can import without starting the server.
- Tests: 25 assertions across `db.test.js` and `sessions.test.js` covering happy path, validation errors, edge cases (negative amount, zero amount, float duration), and ordering.

**iOS (`ChelseaPoker/`)**
- `PokerSession.swift`: `Codable/Identifiable/Equatable` model with snake_case key mapping, `formattedAmount`, `formattedDuration` helpers.
- `SessionService.swift`: protocol-based `URLSession` wrapper; throws typed `SessionServiceError`.
- `SessionStore.swift`: `@MainActor ObservableObject` holding the sessions list, calls service, publishes errors.
- `AddSessionView.swift`: Form with stake, location, duration (minutes), win/loss picker + amount field; async submit with spinner.
- `SessionListView.swift`: List with pull-to-refresh, color-coded amounts (green/red), empty state view.
- `ContentView.swift`: `NavigationStack` root hosting the list + toolbar "+" button opening a sheet.
- `PreviewSessionService.swift`: In-memory service for SwiftUI previews.
- Tests: `PokerSessionTests` (decode/encode, computed properties, equality) and `SessionServiceTests` (MockURLProtocol intercepting real URLSession calls — success, 400, 500, network error, decode error).

### Lessons learned
- SQLite `CURRENT_TIMESTAMP` is UTC but stored without the `Z` suffix; appending `Z` after replacing space with `T` gives valid ISO 8601.
- `appendingPathComponent` can strip leading slashes; use `URLComponents` to build API URLs reliably.
- `@testable import` requires the test target to have `BUNDLE_LOADER` pointing at the app binary so the module is importable.
- Jest's `--runInBand` is essential when test files share a module-level SQLite singleton; each file gets its own module registry, but within a file `closeDb()` in `afterEach` resets the in-memory DB between tests.

## 2026-03-15 — Initial scaffold
- Created `README.md` and `index.html` Hello World scaffold.
