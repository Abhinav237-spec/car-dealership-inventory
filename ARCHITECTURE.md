# Architecture

Project owner: Abhinav ([@Abhinav237-spec](https://github.com/Abhinav237-spec)).

A short tour of how Lotline (the dealership inventory app) fits together. Each source file also
carries brief comments saying what it does and why.

## The big picture

```
 Browser (React SPA)                 Express API                        PostgreSQL
┌────────────────────┐   JSON/HTTP  ┌──────────────────────────┐        ┌──────────┐
│ pages → components │ ───────────▶ │ routes → services → repos│ ─────▶ │ users    │
│ hooks, AuthContext │ ◀─────────── │  (+ middleware, zod)     │ ◀───── │ vehicles │
└────────────────────┘  Bearer JWT  └──────────────────────────┘   SQL  └──────────┘
```

## Backend (`backend/src`)

Requests flow through four layers. Each layer only knows about the one below it.

| Layer | Folder | Job |
|---|---|---|
| Routes | `routes/` | Translate HTTP to a service call. Validate input, pick status codes. No business rules. |
| Services | `services/` | The business rules: hashing passwords, issuing tokens, "can't buy if out of stock". |
| Repositories | `repositories/` | Talk to the database. Each has an **interface** and a Postgres implementation. |
| Database | `db/` | SQL migrations, a migration runner and a seed script. |

Supporting pieces:

- `domain/` holds plain types and the error classes (`NotFoundError` → 404, `ConflictError` → 409, …).
  Throw them anywhere; `middleware/errorHandler.ts` turns them into `{ "error": "..." }` JSON.
- `middleware/authenticate.ts` reads the `Authorization: Bearer` token. `requireRole.ts` guards admin-only routes.
- `validation/` holds the zod schemas; invalid input becomes a 400 before it reaches a service.
- `server.ts` is the **composition root**: the only place that creates a real `Pool` and wires
  Postgres repositories into services. `app.ts` just takes its dependencies as arguments.

### Why interfaces and a composition root? (SOLID in practice)

Services depend on repository *interfaces*, not on Postgres (dependency inversion). So tests
build the same app with in-memory fakes (`tests/support/`) and run in milliseconds, while the
**contract tests** (`tests/contracts/`) run one suite against both the fakes and real
Postgres. That proves the fakes behave like the real thing. Adding a new store means writing
one class, with no change to services or routes.

### Decisions worth knowing

- **Purchase is atomic.** A single `UPDATE vehicles SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0`
  means two simultaneous buyers can never push stock below zero.
- **Search is injection-safe.** Filters become SQL placeholders; `%` and `_` in user text are escaped.
- **Passwords** are bcrypt-hashed; tokens are signed JWTs carrying the user id and role.
- **Open question from the spec:** `POST /api/vehicles` and `PUT /api/vehicles/:id` accept any
  signed-in user (a literal reading of the kata). Making them admin-only is a one-line change
  (`adminOnly` in `vehicleRoutes.ts`).

## Frontend (`frontend/src`)

| Folder | Job |
|---|---|
| `api/` | One small `request()` client (adds the token, throws `ApiError`) plus typed functions per endpoint. |
| `auth/` | `AuthContext` keeps the session (and mirrors it to localStorage); `ProtectedRoute` redirects visitors to `/login`. |
| `hooks/` | `useVehicleList` loads vehicles and ignores stale responses; `useDebouncedValue` waits 250 ms after typing before searching. |
| `components/` | Small presentational pieces: `VehicleCard`, `PurchaseButton` (disabled at 0 stock), `FiltersBar`, modals. |
| `pages/` | `LoginPage`, `RegisterPage`, `DashboardPage` (owns filter, dialog and notice state). |

A 401 response with a token makes the client fire an `auth:unauthorized` event, so an expired
session sends the user back to the login screen from anywhere. Admin controls render only when
the JWT role is `admin`, but the server enforces it regardless; the UI is convenience, not security.

## Testing approach

Every feature was built Red → Green → Refactor; `git log` shows the failing-test commit
before each implementation commit.

- Backend: Jest + Supertest against the real app with fakes, plus contract tests against Postgres.
- Frontend: Vitest + Testing Library, testing behaviour a user can see (labels, roles, text).
