# Chelsea Poker

A personal poker session tracker. Log each session with stake, duration, result, and location — with data persisted to PostgreSQL.

## Features

- [x] Record poker sessions (stake, duration, win/loss, location, date, notes)
- [x] Session history with running totals
- [x] REST API backed by PostgreSQL
- [x] Deployed on Render
- [ ] Data visualization / graphs over time

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Vanilla HTML/CSS/JS     |
| Backend  | Node.js + Express       |
| Database | PostgreSQL (via `pg`)   |
| Hosting  | Render (free tier)      |
| Tests    | Jest + Supertest        |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud)

### Installation

```bash
git clone https://github.com/edwin-chen-future/chelsea-poker.git
cd chelsea-poker/backend
npm install
```

### Environment Variables

Copy `.env.example` to `backend/.env` and fill in your values:

```bash
cp .env.example backend/.env
```

| Variable           | Description                                   |
|--------------------|-----------------------------------------------|
| `DATABASE_URL`     | PostgreSQL connection string (required)       |
| `TEST_DATABASE_URL`| Separate DB for tests (required for npm test) |
| `PORT`             | Port to listen on (default: 3000)             |

### Running Locally

```bash
cd backend
npm start        # production
npm run dev      # development (auto-restart on file change, Node 18+)
```

Then open [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
cd backend
npm test
```

Tests mock the database and do not require a running PostgreSQL instance.

## API Reference

### `POST /api/sessions`

Record a new poker session.

**Body (JSON):**

| Field              | Type    | Required | Description                              |
|--------------------|---------|----------|------------------------------------------|
| `stake`            | string  | yes      | e.g. `"1/2"`, `"2/5 NL"`                |
| `duration_minutes` | integer | yes      | Session length in minutes (must be > 0)  |
| `result_amount`    | number  | yes      | Dollars won (positive) or lost (negative)|
| `location`         | string  | yes      | e.g. `"Wynn"`, `"Home Game"`             |
| `session_date`     | string  | yes      | ISO date, e.g. `"2026-03-16"`            |
| `notes`            | string  | no       | Optional session notes                   |

**Response:** `201 Created` with the saved session object.

### `GET /api/sessions`

Returns all sessions ordered by date (newest first).

**Response:** `200 OK` with a JSON array of session objects.

## Deployment (Render)

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) and create a new account (or log in).
3. Click **New** → **Blueprint** and connect your GitHub repo.
4. Render reads `render.yaml` and automatically provisions:
   - A **PostgreSQL** database (`chelsea-poker-db`)
   - A **Web Service** running the Node.js backend (`chelsea-poker`)
5. Once deployed, your app is live at `https://chelsea-poker.onrender.com` (or similar).

> **Note:** Render free tier web services spin down after 15 minutes of inactivity. The first request after idle has a ~30 second cold start. Upgrade to a paid plan to keep it always-on.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## License

> _Add license information here._
