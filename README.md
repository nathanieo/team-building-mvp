# Team Building MVP

An MVP for forming fair, explainable student teams in a class. It uses the same stack as the TeamBuildingApp research project:

- **Frontend:** React 19 + TypeScript + Vite + React Router (`app/`)
- **API:** NestJS 11 + Prisma 7 + PostgreSQL (`api/`)
- **Shared contracts:** browser-safe types and validators used by both sides (`packages/contracts/`)
- npm workspaces, Node 24, Docker Compose for the local database

## What's built so far

**Step 1: Facilitator login and dashboard**

- `/` asks "Are you a student or a teacher?". Students go to `/join` and type their class code; a real code opens `/join/CODE` (also shareable as a link), where a first-time student enters their full name, student ID and student email to join. The questionnaires that follow are not built yet. Teachers go to log in, or to their dashboard if already signed in.
- `/student/CODE` is a student's page for one class (`/student` opens their first): a green header with "Hi, Name", Log out and a class button to switch between their classes, then one card for where that class is: finish the two questionnaires (progress, Start / Continue), "You're all set" while teams are being formed, or their locked team (teammates with emails, "Email your team", and why the team fits together). Returning students sign in with just their student email. Front end only.
- `/student/CODE/questionnaire/work-style` and `.../skills` ask one question per screen (30 in all): 20 Mini-IPIP Big Five statements rated Very inaccurate to Very accurate, 9 skill self-ratings, and ranking the top 3 class projects. Answers save as they're picked (1–5 keys work), so students can leave and resume. Each question has a soft topic colour and Sprout, the mascot (`app/src/components/Mascot.tsx`), acting it out; Sprout never reacts differently to different answers. Question wording is in `packages/contracts/src/questionnaire.ts`, scenes in `app/src/lib/questionVisuals.ts`.
- `/login` lets facilitators log in with a username or email, and `/signup` (linked from "Join Team Building") creates an account. "Forgot password?" opens `/forgot-password`, which collects an email but can't send reset emails yet (no email service or reset endpoint). Passwords are hashed with scrypt, sessions use an HttpOnly cookie that is stored hashed in Postgres, and repeated failed logins are rate-limited. The Google, Apple and Microsoft buttons are placeholders until single sign-on is connected.
- `/dashboard` greets the facilitator in a green header with a "+ New class" button (team size can be fixed, e.g. 4, or a range like 3-4), then shows one card per class with its join code, questionnaire progress and a one-line next step. Clicking a card slides out a class panel with Students, Projects and Teams tabs. The Students tab lists the class list (joined / not joined, with a filter), lets the facilitator paste a class list and remove a student; it is built against API endpoints that do not exist yet (see the API table). Projects and Teams are placeholders.
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

## Demo mode (no API or database needed)

While running the frontend dev server (`npm run dev:frontend`), open any page with `?demo`, for example
http://localhost:5173/dashboard?demo. You're signed in as "Demo Teacher" with sample classes and students, and every
API call is answered from built-in data in `app/src/lib/demoApi.ts` (changes reset on reload). It's remembered in that
browser until you press **Exit** on the "Demo mode" badge or open a page with `?demo=off`.

Demo mode exists only in development: every entry point checks `import.meta.env.DEV`, so production builds don't
contain it.

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
| POST | `/cohorts` | cookie | `{ name, term, teamSize, teamSizeMax? }` → new class with a join code. `teamSizeMax` defaults to `teamSize`; a range is stored smallest first |
| GET | `/cohorts/:id` | cookie | One class (404 if it belongs to someone else) |
| GET / POST / DELETE | `/cohorts/:id/students`, `/cohorts/:id/class-list`, `/cohorts/:id/students/:email` | cookie | **Not built yet.** Planned endpoints the Students tab calls: list students, add emails to the class list, remove a student. Need a class-list table |
| GET / POST | `/join/:code` | none | **Not built yet.** Look up a class by join code (`{ cohort: { name, term } }`), and join it with `{ displayName, studentId, email }`. Demo mode answers both |
| GET / POST | `/student/me`, `/student/login`, `/student/logout` | student session | **Not built yet.** The signed-in student's classes with questionnaire progress and (once locked) their team; sign in with `{ email }`. Demo mode answers them |
| GET / PUT | `/student/classes/:code/questionnaires/:id`, `.../answers/:questionId` | student session | **Not built yet.** A questionnaire with the student's saved answers; save one answer with `{ answer }` (1–5, or the ranked project ids). Demo mode answers them |

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
