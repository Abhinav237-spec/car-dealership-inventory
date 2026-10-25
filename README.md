# Lotline: Car Dealership Inventory

A full-stack inventory system for a car dealership, built as a TDD kata. Customers can browse,
search and buy vehicles; admins can add, edit, restock and delete them.

- **Backend:** Node + TypeScript + Express, PostgreSQL, JWT auth, zod validation
- **Frontend:** React + TypeScript + Vite + Tailwind CSS v4
- **Tests:** Jest/Supertest (backend), Vitest/Testing Library (frontend)

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together.

## Screenshots

| Login | Dashboard (admin) |
|---|---|
| ![Login](docs/screenshots/01-login-desktop.png) | ![Dashboard](docs/screenshots/02-dashboard-admin-desktop.png) |

| Add vehicle | Filtering | Mobile |
|---|---|---|
| ![Add](docs/screenshots/03-add-modal.png) | ![Filter](docs/screenshots/04-filter-electric.png) | ![Mobile](docs/screenshots/08-dashboard-mobile.png) |

## Setup

Requirements: Node 20+, Docker (for Postgres).

```bash
docker compose up -d                 # Postgres on :5432 (dealership + dealership_test databases)

cd backend
cp .env.example .env                 # set JWT_SECRET to a long random string
npm install
npm run migrate                      # create tables
npm run seed                         # admin user + 18 sample vehicles
npm run dev                          # API on http://localhost:3000

cd ../frontend                       # in a second terminal
npm install
npm run dev                          # app on http://localhost:5173 (proxies /api to :3000)
```

The seeded admin is whatever `ADMIN_EMAIL` / `ADMIN_PASSWORD` are in `backend/.env`.
Registering through the UI creates a regular user.

### Running the tests

```bash
cd backend && TEST_DATABASE_URL=postgres://dealership:dealership@localhost:5432/dealership_test npm test
cd frontend && npm test
```

Without `TEST_DATABASE_URL` the Postgres contract suite is skipped; everything else still runs.

## API

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/vehicles`, `/api/vehicles/search` | signed in |
| POST | `/api/vehicles` | signed in |
| PUT | `/api/vehicles/:id` | signed in |
| POST | `/api/vehicles/:id/purchase` | signed in (409 when out of stock) |
| DELETE | `/api/vehicles/:id` | admin |
| POST | `/api/vehicles/:id/restock` | admin |

Search accepts `make`, `model`, `category`, `minPrice`, `maxPrice`.

## Test report

| Suite | Tests | Result | Coverage |
|---|---|---|---|
| Backend (Jest, incl. real Postgres) | 119 | all passing | 93% statements, 85% branches, 100% functions |
| Frontend (Vitest) | 76 | all passing | not measured |

Lint and type-check are clean for both packages.

## My AI Usage

I used Claude (Anthropic) as a pairing partner throughout.

- **What it did:** created the GitHub repo, milestones and issues from the kata spec; wrote
  failing tests first and then the implementation (see the red/green commit pairs); wrote the
  architecture notes and code comments; ran browser walkthroughs to check the UI.
- **Where I steered:** scope and milestone order, choosing the stack, and reviewing every change.
- **How it's marked:** every AI-assisted commit carries a `Co-Authored-By: Claude` trailer.
- **Reflection:** AI was fastest at boilerplate and test scaffolding. Specs still needed a human
  to decide ambiguous points, for example whether create/update should be admin-only.

Raw chat logs are in [PROMPTS.md](PROMPTS.md).
