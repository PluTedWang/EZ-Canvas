# EZCanvas

EZCanvas is an AI assisted study companion built on the Canvas LMS API for international students at English speaking universities. It reads a student's courses from Canvas, keeps every deadline in one calendar with an honest estimate of the time each assignment needs, turns course files into notes in the student's own language, and drafts clear, non-defensive emails to professors that the student sends themselves.

English and Simplified Chinese ship first. Everything is designed around one idea: the student stays in control. EZCanvas only reads Canvas, never sends email on its own, and runs AI requests on the student's own API key.

> Status: early and moving fast. Milestones M0 to M4 of [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) are built except the homework helper screen; Ed Discussion and group projects come next.

## What works today

| Area | What you get |
|---|---|
| Canvas connection | Personal access token, stored encrypted. Syncs courses, assignments, files, pages, links, announcements, lectures and groups every 15 minutes, and removes what Canvas no longer lists. Read only. |
| Dashboard | Deadlines due soon with predicted hours and the basis of each prediction, new materials from professors, course progress. |
| Calendar | Week view in the student's own time zone, lectures, due row, study blocks planned around lectures, and an `.ics` feed for Google or Apple Calendar. |
| Course materials | AI notes for each file or page in the language the student chooses, quiz flags with the professor's own wording, key terms kept in English with a translation. Notes are cached until Canvas reports a new version. |
| Study assistant | Advice and an email draft grounded only in Canvas facts, shown as source chips; three tones; a translation preview; a style check; hand off to Gmail or the student's mail app. |
| Languages | Interface, explanation and writing language are set separately. |

## Principles

These are enforced in code and in review:

- Canvas data is read only. EZCanvas never writes to Canvas.
- Nothing is emailed on the student's behalf. Drafts open in the student's own mail client.
- AI calls happen only on the server, with the student's own key, which never reaches the browser.
- Predicted hours always show their basis.
- Course terms stay in English with a translation added once.

## Quick start

You need Node.js 20.19 or newer (22 recommended) and npm.

```bash
git clone https://github.com/PluTedWang/EZ-Canvas.git
cd EZ-Canvas
cp .env.example .env          # then fill in AUTH_SECRET and APP_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Generate each secret with `openssl rand -base64 32`. To try everything without a real Canvas account, set `CANVAS_MOCK=1` in `.env`: sync then serves the sample courses in `fixtures/canvas`.

Open http://localhost:3000 and sign in. There are no passwords. Either enter any email and open the link printed in the `npm run dev` terminal, or run `npm run signin` in a second terminal for a link to the seeded user.

On onboarding, enter your school's Canvas address and a personal access token (Canvas: Account, Settings, New Access Token). In mock mode any token works. The first sync runs in the background; Settings shows the result, Manage courses and Sync now. To use AI notes and the assistant, add an Anthropic API key in Settings, AI helper.

After a schema change, restart `npm run dev`; the dev server keeps one Prisma client in memory.

## Configuration

All settings live in `.env` (see [.env.example](.env.example)). Per student secrets (Canvas token, AI key) are stored encrypted in the database, never in the environment.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file for development, for example `file:./dev.db`. |
| `AUTH_SECRET` | yes | Signs sign in sessions (Auth.js). |
| `APP_SECRET` | yes | Encrypts stored Canvas tokens and API keys (AES-256-GCM). Changing it makes stored secrets unreadable. |
| `APP_URL` | in production | Public address of the app, used in calendar feed links. Without it the request's host is used. |
| `RESEND_API_KEY`, `EMAIL_FROM` | in production | Sends sign in links. Leave empty in development to print links to the terminal. |
| `ANTHROPIC_MODEL` | no | Model for notes and email drafts. Default `claude-sonnet-5`. |
| `ANTHROPIC_FAST_MODEL` | no | Model for quick checks and parsing. Default `claude-haiku-4-5-20251001`. |
| `CANVAS_MOCK` | no | `1` serves `fixtures/canvas` instead of calling Canvas. |
| `CANVAS_DEFAULT_BASE_URL` | no | Prefills the Canvas address on onboarding. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000. |
| `npm test` | Logic tests with Vitest. |
| `npm run typecheck` | Generates Next.js route types, then runs TypeScript. |
| `npm run lint` | ESLint. |
| `npm run build` / `npm start` | Production build and server. |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations, seed the sample user. |
| `npm run sync` | Sync every Canvas connection now and print the counts. |
| `npm run canvas:probe` | Print what a Canvas token can see, without writing anything. |
| `npm run signin` | Print a one time sign in link for local development. |

## Project structure

```
app/                Next.js App Router screens, server actions and API routes
components/         One component per mockup part (Sidebar, DueSoonList, WeekGrid, ...)
lib/
  canvas/           Canvas client, API calls, mapping, sync job, host check, mock
  ai/               One AiProvider interface, the Anthropic adapter, prompts
  materials/        Text extraction and cached AI notes
  assistant/        Canvas facts the assistant may state
  email/            Gmail and mailto hand off links
  writing/          The "Natural, non-defensive" style check
  week.ts           All calendar maths, in the student's time zone
messages/           Interface strings: en.json and zh-Hans.json
prisma/             Schema and migrations
fixtures/           Sample Canvas data for mock mode and tests
tests/              Vitest tests for the logic
docs/               Product spec, design system, integrations, build plan, decisions
design/             High fidelity HTML mockups and design tokens
```

## Deploying

EZCanvas runs as a long lived Node.js server (`npm run build && npm start`); the Canvas sync timer runs inside that process (`instrumentation.ts`), and a sync claim in the database keeps several instances from syncing the same account at once. Serverless hosting would need the sync moved to a scheduled job first.

For production:

- Use Postgres. Change the `provider` in `prisma/schema.prisma` and create a fresh migration history for it; the migrations in this repository are for SQLite.
- Set `APP_URL`, `AUTH_SECRET`, `APP_SECRET` and a Resend key. Behind a reverse proxy, also set `AUTH_TRUST_HOST=true`.
- Keep `APP_SECRET` safe and stable. It is the only key to the stored Canvas tokens and API keys.

## Security

Canvas tokens and AI keys are encrypted at rest and only used on the server. Onboarding only accepts a public `https` Canvas address, API requests never follow redirects, and file downloads must start on the connected Canvas host. The calendar feed is protected by a random token in its URL; treat that link like a password.

Please report security problems privately through GitHub's "Report a vulnerability" on the repository's Security tab rather than in a public issue.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first: it covers the local setup, the checks every change must pass, and the project's rules for keeping the codebase small. [CLAUDE.md](CLAUDE.md) holds the same rules for AI coding agents.

## License

[MIT](LICENSE)
