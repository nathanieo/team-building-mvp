# Team Building MVP

An MVP for forming fair, explainable student teams in a class. It uses the same stack as the TeamBuildingApp research project:

- **Frontend:** React 19 + TypeScript + Vite + React Router (`app/`)
- **API:** NestJS 11 + Prisma 7 + PostgreSQL (`api/`)
- **Shared contracts:** browser-safe types and validators used by both sides (`packages/contracts/`)
- npm workspaces, Node 24, Docker Compose for the local database

## What's built so far

**Step 1: Facilitator login and dashboard**

- `/` is the front page: students type their class code (checked against the join-code format; the join flow itself is the next roadmap step), and facilitators go to log in or sign up.
- `/login` lets facilitators log in with a username or email, and `/signup` (linked from "Join Team Building") creates an account. Passwords are hashed with scrypt, sessions use an HttpOnly cookie that is stored hashed in Postgres, and repeated failed logins are rate-limited. The Google, Apple and Microsoft buttons are placeholders until single sign-on is connected.
- `/dashboard` shows totals across classes (classes, students joined, questionnaire completion, teams formed) and one card per class with its join code, progress bar and next step.
- **New class** creates a class with a name, term and team size, and generates a 6-character join code without look-alike characters (no 0/O, 1/I/L).

## MVP roadmap

1. ✅ Facilitator login and dashboard
2. ⬜ Add projects to a class (reuse the LLM requirement extraction from TeamBuildingApp)
3. ⬜ Student join page (join code + school email) and the Big Five + technical-preferences questionnaires, saved to Postgres
4. ⬜ "Form teams": rule-based matching on skills coverage, conscientiousness balance and project preferences
5. ⬜ Review and swap, lock, export CSV
6. ⬜ End-of-semester grade entry (the outcome data for training a model later)

The database already has `students`, `projects` and `teams` tables, so the dashboard counts are real and steps 2–4 can build on them.

## Getting started

Prerequisites: Git, Node.js 24.20 (`nvm install`), npm 11.19, Docker Desktop.

```bash
nvm install && nvm use
npm run setup        # creates .env files, installs, starts Postgres, runs migrations
```

Then, in two terminals:

```bash
npm run dev:api      # NestJS on http://127.0.0.1:8788/api
npm run dev:frontend # Vite on http://localhost:5173
```

Open http://localhost:5173. You'll land on the login page. Choose **Create account**, then create a class from the dashboard.

## Scripts

| Command | What it does |
|---|---|
| `npm run setup` | One-time local setup |
| `npm run db:up` / `db:down` | Start or stop the Postgres container |
| `npm run db:migrate` | Apply migrations |
| `npm run db:migrate:dev -- --name <change>` | Create a new migration after editing `api/prisma/schema.prisma` |
| `npm run check` | Tests, lint, and production build for every workspace |

To run the API's end-to-end HTTP tests against a real database, point `TEST_DATABASE_URL` at a **separate, disposable** migrated database (the tests empty every table):

```bash
TEST_DATABASE_URL=postgresql://user:pass@127.0.0.1:5434/team_building_test npm test --workspace=@team-building-mvp/api
```

## API

All routes are under `/api`. Errors always look like `{ "error": string, "fieldErrors"?: { [field]: string } }`.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Liveness check |
| POST | `/auth/register` | none | `{ displayName, username, email, password, inviteCode }` → sets the session cookie. Usernames are 3–30 lowercase letters, numbers, periods and underscores |
| POST | `/auth/login` | none | `{ identifier, password }`, where `identifier` is a username or an email → sets the session cookie |
| POST | `/auth/logout` | cookie | Ends the session |
| GET | `/auth/me` | cookie | Current facilitator |
| GET | `/cohorts` | cookie | The facilitator's classes, with counts |
| POST | `/cohorts` | cookie | `{ name, term, teamSize }` → new class with a join code |
| GET | `/cohorts/:id` | cookie | One class (404 if it belongs to someone else) |

## Configuration (`api/.env`)

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | set by setup | PostgreSQL URL |
| `API_HOST` / `API_PORT` | `127.0.0.1` / `8788` | |
| `SESSION_TTL_HOURS` | `12` | How long a login lasts |
| `SESSION_COOKIE_SECURE` | `false` | Set to `true` when served over HTTPS |
| `FACILITATOR_INVITE_CODE` | empty | When set, the API requires this code to create an account. The sign-up page has no invite field, so setting it closes sign-up and the page says sign-ups are invite-only. **Set it before deploying anywhere public.** |

## Before a real pilot

- Set `FACILITATOR_INVITE_CODE` and `SESSION_COOKIE_SECURE=true`, and serve the frontend and API from the same origin over HTTPS.
- The login rate limiter is in memory. Move it to Postgres or Redis if you run more than one API instance.
- Collecting student data needs IRB approval first.
