# Chelsea Poker

A personal poker session tracker. Record stakes, duration, win/loss, and location from an iOS app. Sessions are persisted via a Node.js backend.

## Features

- [x] Record poker sessions (stake, duration, win/loss, location)
- [x] Persist sessions via REST API backed by SQLite
- [x] View session history sorted newest first
- [ ] Session statistics & charts

## Tech Stack

| Layer | Technology |
|---|---|
| iOS App | SwiftUI (iOS 16+) |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| iOS Tests | XCTest + MockURLProtocol |
| Backend Tests | Jest + supertest |

## Getting Started

### Prerequisites

- **Backend:** Node.js 18+, npm
- **iOS:** Xcode 15+, macOS 13+

### Backend Setup

```bash
cd backend
npm install
npm start          # starts on http://localhost:3000
npm test           # run all backend tests
```

### iOS Setup

1. Open `ChelseaPoker/ChelseaPoker.xcodeproj` in Xcode.
2. Select the `ChelseaPoker` scheme and a simulator (or your device).
3. If running on a **physical device**: open `ChelseaPoker/ChelseaPoker/Services/SessionService.swift` and update the `baseURL` to your machine's LAN IP (e.g. `http://192.168.1.x:3000`).
4. Press **Cmd+R** to build and run.
5. Press **Cmd+U** to run the unit tests.

## API Reference

### `POST /api/sessions`

Create a new session.

**Request body:**
```json
{
  "stake": "$1/$2",
  "duration_minutes": 180,
  "amount": 250,
  "location": "Bike Casino"
}
```

- `amount`: integer dollars — positive = win, negative = loss, zero = breakeven.

**Response `201`:**
```json
{
  "id": 1,
  "stake": "$1/$2",
  "duration_minutes": 180,
  "amount": 250,
  "location": "Bike Casino",
  "played_at": "2026-03-15T20:00:00Z"
}
```

### `GET /api/sessions`

Returns all sessions sorted newest first.

**Response `200`:** array of session objects.

## Project Structure

```
backend/                  Node.js API server
  routes/sessions.js      POST + GET /api/sessions
  db.js                   SQLite connection & schema
  server.js               Express app entry point
  tests/                  Jest tests

ChelseaPoker/             Xcode project
  ChelseaPoker/
    Models/               PokerSession Codable struct
    Services/             SessionService (URLSession), SessionStore (ObservableObject)
    Views/                ContentView, SessionListView, AddSessionView
  ChelseaPokerTests/      XCTest suite
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## License

> _Add license information here._
