# CoCongruo

A team-building platform bridging human connection and strategic alignment.

An MVP for forming fair, explainable student teams in a class. It uses the same stack as the TeamBuildingApp research project:

- **Frontend:** React 19 + TypeScript + Vite + React Router (`app/`)
- **API:** NestJS 11 + Prisma 7 + PostgreSQL (`api/`)
- **Shared contracts:** browser-safe types and validators used by both sides (`packages/contracts/`)
- npm workspaces, Node 24, and PostgreSQL: a local one in Docker, or a hosted one such as Supabase

## What's built so far

**Students (saved to Postgres)**

- `/` asks "Are you a student or a teacher?". Students go to `/join` and type their class code; a real code opens `/join/CODE` (also shareable as a link), where a first-time student enters their full name, student ID and student email to join. Joining creates their row in `students` and logs them in. Teachers go to log in, or to their dashboard if already signed in.
- `/student/CODE` is a student's page for one class (`/student` opens their first): a header with "Hi, Name", Log out and a class button to switch between their classes, then one card for where that class is: finish the two questionnaires (progress, Start / Continue), "You're all set" while teams are being formed, or their locked team (teammates with emails, "Email your team", and why the team fits together). Returning students sign in with just their student email. Teams aren't formed yet, so the locked-team card only appears in demo mode.
- `/student/CODE/questionnaire/work-style` and `.../skills` ask one question per screen (40 in all): 30 IPIP Big Five statements (six per trait, the 20-item Mini-IPIP plus 10 more) rated Very inaccurate to Very accurate, 9 skill self-ratings, and ranking the top 3 class projects. Each answer is saved to the `answers` table as it's picked (1–5 keys work), so students can leave and resume. Changing an answer updates its row, and a student is marked finished once both questionnaires are complete. Each question has a soft topic colour and the mascot, a yellow-and-black wheat kernel in Wichita State's colours (`app/src/components/Mascot.tsx`), acting it out; it never reacts differently to different answers. Question wording is in `packages/contracts/src/questionnaire.ts`, scenes in `app/src/lib/questionVisuals.ts`.
- `/student/CODE/personality` is the student's personality profile, worked out from their saved Work style answers each time (nothing extra is stored, and the same answers always give the same result). It is eight short pages (Next/Back, arrow keys or swipe; details open on tap) showing one of eight archetypes (Anchor, Spark, Strategist, Explorer, Harmonizer, Builder, Challenger, Flowkeeper) with its own wheat mascot, the match strength (strong, clear or blended) and any secondary influence, why they got it (quoting their actual answers), a Big 5 breakdown, strengths, possible blind spots, how they work in a team, the two archetypes they complement and an ideal team mix. Scoring is in `packages/contracts/src/personality.ts`; archetype wording and weights in `personalityContent.ts`. Scores come from 30 short statements, so they're presented as rough indicators of working style, not measurements.
**Facilitators**

- `/login` lets facilitators log in with a username or email, and `/signup` (linked from "Join CoCongruo") creates an account. "Forgot password?" opens `/forgot-password`, which collects an email but can't send reset emails yet (no email service or reset endpoint). Passwords are hashed with scrypt, sessions use an HttpOnly cookie that is stored hashed in Postgres, and repeated failed logins are rate-limited. The Google, Apple and Microsoft buttons are placeholders until single sign-on is connected.
- `/dashboard` greets the facilitator in a header with a "+ New class" button (team size can be fixed, e.g. 4, or a range like 3-4), then shows one card per class with its join code, questionnaire progress and a one-line next step. Clicking a card slides out a class panel with Students, Projects and Teams tabs. The Students tab lists the class list (joined / not joined, with a filter), lets the facilitator paste a class list and remove a student; it is built against API endpoints that do not exist yet (see the API table). Projects and Teams are placeholders.
- **New class** creates a class with a name, term and team size, and generates a 6-character join code without look-alike characters (no 0/O, 1/I/L).

## MVP roadmap

1. ✅ Facilitator login and dashboard
2. ⬜ Add projects to a class (reuse the LLM requirement extraction from TeamBuildingApp)
3. 🟡 Student join and the Big Five + skills questionnaires, saved to Postgres
   - ✅ Join a class with its code, name, student ID and school email
   - ✅ Student log in, home page and log out
   - ✅ Both questionnaires saved answer by answer, with resume, and finished students counted on the dashboard
   - ⬜ The facilitator's Students tab: list who has joined, paste a class list, remove a student
   - ⬜ Automated tests for the student routes
4. ⬜ "Form teams": rule-based matching on skills coverage, conscientiousness balance and project preferences
5. ⬜ Review and swap, lock, export CSV
6. ⬜ End-of-semester grade entry (the outcome data for training a model later)

## Database

Tables are defined in `api/prisma/schema.prisma` and built by the migrations in `api/prisma/migrations/`.

```
facilitators ──< facilitator_sessions
     │
     └──< cohorts ──< students ──< answers
             │            └─────< student_sessions
             ├──< projects
             └──< teams
```

`──<` means "has many". Deleting a row also deletes the rows that belong to it.

| Table | One row is | Key rules |
|---|---|---|
| `facilitators` | A teacher account | Unique email and username |
| `facilitator_sessions` | A teacher login | Only a SHA-256 hash of the cookie token is stored |
| `cohorts` | A class | Unique 6-character join code |
| `students` | A student in one class (name, email, school ID) | An email or school ID can join each class once. A student in two classes has two rows |
| `student_sessions` | A student login | Only the token's hash is stored; lasts 30 days |
| `answers` | One student's answer to one question | One answer per student per question. `value` is JSON: a number 1–5, or a list of project IDs |
| `projects` | A project in a class | |
| `teams` | A formed team | Members are added with step 4 |

The questions themselves aren't in the database. They're in `packages/contracts/src/questionnaire.ts`, and each answer stores the question's ID (like `ws-01`).

## Getting started

Prerequisites: Git, Node.js 24.20 (`nvm install`), npm 11.19, and either Docker (for a local database) or a hosted PostgreSQL database such as Supabase.

### Option A: local database in Docker

```bash
nvm install && nvm use
npm run setup        # creates .env files, installs, starts Postgres, runs migrations
```

### Option B: hosted database (Supabase)

`npm run setup` always starts Docker, so do its steps by hand:

1. In Supabase, click **Connect** and copy the **Session pooler** string (port 5432). Don't use Direct connection, which needs IPv6, or Transaction pooler (port 6543), which breaks migrations.
2. Create the API's settings file:
   ```bash
   cp api/.env.example api/.env
   ```
3. In `api/.env`, set `DATABASE_URL` to that string with your database password filled in and `?sslmode=require&uselibpqcompat=true` added to the end. Use a password of only letters and numbers.
4. In Supabase, open **Project Settings → Data API** and turn it off. The app only talks to the database through its own API.
5. Install and create the tables:
   ```bash
   nvm use
   npm ci
   npm run build --workspace=@team-building-mvp/contracts
   npm run db:migrate
   ```

`api/.env` is ignored by Git. Never commit it or share the password in it.

### Run it

In two terminals:

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
| `npm run db:migrate:dev -- --name <change>` | Create a new migration after editing `api/prisma/schema.prisma`. Add `--create-only` to write the SQL without applying it, so you can read it first |
| `npm run check` | Tests, lint, and production build for every workspace |

To run the API's end-to-end HTTP tests against a real database, point `TEST_DATABASE_URL` at a **separate, disposable** migrated database (the tests empty every table):

```bash
TEST_DATABASE_URL=postgresql://user:pass@127.0.0.1:5434/team_building_test npm test --workspace=@team-building-mvp/api
```

## API

All routes are under `/api`. Errors always look like `{ "error": string, "fieldErrors"?: { [field]: string } }`.

Teachers and students have separate cookies: **teacher** is `tb_session` and **student** is `tb_student_session`, so one browser can be logged in as both.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Liveness check |
| POST | `/auth/register` | none | `{ displayName, username, email, password, inviteCode }` → sets the teacher cookie. Usernames are 3–30 lowercase letters, numbers, periods and underscores |
| POST | `/auth/login` | none | `{ identifier, password }`, where `identifier` is a username or an email → sets the teacher cookie |
| POST | `/auth/logout` | teacher | Ends the session |
| GET | `/auth/me` | teacher | Current facilitator |
| GET | `/cohorts` | teacher | The facilitator's classes, with counts |
| POST | `/cohorts` | teacher | `{ name, term, teamSize, teamSizeMax? }` → new class with a join code. `teamSizeMax` defaults to `teamSize`; a range is stored smallest first |
| GET | `/cohorts/:id` | teacher | One class (404 if it belongs to someone else) |
| GET / POST / DELETE | `/cohorts/:id/students`, `/cohorts/:id/class-list`, `/cohorts/:id/students/:email` | teacher | **Not built yet.** Planned endpoints the Students tab calls: list students, add emails to the class list, remove a student. Need a class-list table |
| GET | `/join/:code` | none | Looks up a class by its join code → `{ cohort: { name, term } }`. Lowercase and dashes are fine. 404 if no class has it |
| POST | `/join/:code` | none | `{ displayName, studentId, email }` → creates the student and sets the student cookie. 400 with a field error if that email or student ID has already joined the class |
| POST | `/student/login` | none | `{ email }` → sets the student cookie and returns the same data as `/student/me`. 400 if no student has that email |
| GET | `/student/me` | student | The student and every class their email has joined, with answered / total for each questionnaire. `team` is `null` until teams exist |
| POST | `/student/logout` | student | Ends the session and clears the cookie |
| GET | `/student/classes/:code/questionnaires/:id` | student | `work-style` or `skills`: the questions plus the answers already saved, keyed by question ID. 404 for a class the student isn't in |
| PUT | `/student/classes/:code/questionnaires/:id/answers/:questionId` | student | `{ answer }` (1–5, or the ranked project IDs) → saves or replaces that answer and returns `{ answered, total }`. 400 if the answer doesn't fit the question |

## Configuration (`api/.env`)

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | set by setup | PostgreSQL URL |
| `API_HOST` / `API_PORT` | `127.0.0.1` / `8788` | |
| `SESSION_TTL_HOURS` | `12` | How long a teacher login lasts. Student logins last 30 days |
| `SESSION_COOKIE_SECURE` | `false` | Set to `true` when served over HTTPS |
| `FACILITATOR_INVITE_CODE` | empty | When set, the API requires this code to create an account. The sign-up page has no invite field, so setting it closes sign-up and the page says sign-ups are invite-only. **Set it before deploying anywhere public.** |

## Before a real pilot

- Set `FACILITATOR_INVITE_CODE` and `SESSION_COOKIE_SECURE=true`, and serve the frontend and API from the same origin over HTTPS.
- The login rate limiter is in memory. Move it to Postgres or Redis if you run more than one API instance.
- Students log in with only their email, so anyone who knows a student's email can log in as them. Replace this with an emailed one-time link.
- On Supabase, check the server's certificate (`sslmode=verify-full` with Supabase's CA certificate, from **Database → SSL Configuration**) instead of `uselibpqcompat=true`, and keep the Data API turned off.
- Add automated tests for the student routes. Run them against a separate test database, never the real one.
- Collecting student data needs IRB approval first.
