# Lotline: Car Dealership Inventory

A full-stack inventory system for a car dealership, built as a TDD kata. Customers can browse,
search and buy vehicles; admins can add, edit, restock and delete them.

- **Backend:** Node + TypeScript + Express, PostgreSQL, JWT auth, zod validation
- **Frontend:** React + TypeScript + Vite + Tailwind CSS v4
- **Tests:** Jest/Supertest (backend), Vitest/Testing Library (frontend)

**Author:** Abhinav ([@Abhinav237-spec](https://github.com/Abhinav237-spec)), project owner. All commits are made from this account, with AI co-authorship marked on each one.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together.

## Screenshots

| Login | Dashboard (admin) |
|---|---|
| ![Login](docs/screenshots/01-login-desktop.png) | ![Dashboard](docs/screenshots/02-dashboard-admin-desktop.png) |

| Add vehicle | Filtering | Mobile |
|---|---|---|
| ![Add](docs/screenshots/03-add-modal.png) | ![Filter](docs/screenshots/04-filter-electric.png) | ![Mobile](docs/screenshots/08-dashboard-mobile.png) |

After sign-in, a car pulls into the lot once (road, wheels and car animate, then stop; disabled for reduced-motion users):

![Banner](docs/screenshots/09-banner-desktop.png)

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

Run on 2026-10-25. Lint and type-check are clean for both packages.

| Suite | Tests | Result | Statements | Branches | Functions |
|---|---|---|---|---|---|
| Backend (Jest + Supertest, incl. real Postgres) | 119 | all passing | 93% | 85% | 100% |
| Frontend (Vitest + Testing Library) | 80 | all passing | 92% | 87% | 96% |

What the backend tests cover: registration and login (validation, duplicate email, wrong password),
JWT middleware and role guards (401 / 403), every vehicle endpoint (including 409 on out-of-stock purchase
and 404 for unknown ids), search filters, config validation, and a repository **contract suite** that runs
against both in-memory fakes and real Postgres. The frontend tests check what a user can see and do:
forms and error messages, protected routes, the dashboard, filters, the Purchase button (disabled at zero
stock), and the admin dialogs.

Reproduce with:

```bash
cd backend  && TEST_DATABASE_URL=postgres://dealership:dealership@localhost:5432/dealership_test npm run test:coverage
cd frontend && npm run test:coverage
```

## My AI Usage

**Tool:** Claude (Anthropic), used through Claude Code, as a pairing partner for the whole project.

**What I did (Abhinav):**
- Set the goal and the process: I took the kata brief and asked for a GitHub repo with milestone-style issues for each section
  (M1 backend, M2 frontend), then chose to build M1 and M2 in parallel.
- Planned the system design and architecture of the project, suggested the scaffold code too.
- Asked for the design to be explained as it was built, so the code carries short comments and `ARCHITECTURE.md` exists.
- Chose the hosting (Render for the API and database, Vercel for the frontend), created and connected those accounts,
  and supplied the database settings.
- Tested the live site, reported what broke (the login 405), and decided when each piece was done.
- Made the product calls: keeping sold-out cars visible, and adding the car banner and animations.

**What Claude did:**
- Wrote the issues and milestones from the kata brief, and designed the layered architecture
  (routes, services, repositories, Postgres).
- Wrote the scaffolding, the failing tests first, then the implementation (see the red/green commit pairs),
  and the comments, README and architecture notes.
- Ran the code and browser checks and fixed the bugs found, including the 405 login fix and the missing not-found page.

**How it's marked:** every AI-assisted commit carries a `Co-Authored-By: Claude` trailer.

**Reflection:** AI was fastest at boilerplate, test scaffolding and wiring things together, and it let me ship a full stack
with tests and a live deployment quickly. It still needed a human to set the direction, run the real environments,
and catch what only shows up in production, such as the missing `VITE_API_URL`. Open questions in the spec, like whether
create and update should be admin-only, are product decisions that stay with the developer.

Prompts I sent are in [PROMPTS.md](PROMPTS.md).

## Deployment

The API and database deploy to [Render](https://render.com), the SPA to [Vercel](https://vercel.com).

1. **Backend:** Render → New → Blueprint → select this repo (reads `render.yaml`). Enter `ADMIN_PASSWORD` when
   prompted. Set `SEED_ON_START=true` on the service so the admin and sample cars are created at boot (or run `npm run seed` from a shell).
2. **Frontend:** Vercel → Add New Project → select this repo, and set **Root Directory** to `frontend` (framework: Vite).
   `frontend/vercel.json` forwards `/api/*` to the Render API, so edit its destination if your Render URL differs
   (or set `VITE_API_URL` to your Render URL instead).
3. Put both URLs here:

- Live app: https://car-dealership-inventory-psi.vercel.app
- Live API: https://dealership-api-cngs.onrender.com/api/health
- Demo admin: `admin@dealership.test` / `Lotline#Admin2026` (demo data only)

Render's free tier sleeps when idle, so the first request after a pause can take about 30 seconds.
