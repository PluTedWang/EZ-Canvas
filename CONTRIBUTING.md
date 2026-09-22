# Contributing to EZCanvas

Thanks for helping. EZCanvas is small on purpose, and these notes are mostly about keeping it that way.

## Set up

Follow the Quick start in the [README](README.md). Use `CANVAS_MOCK=1` unless you are working on the Canvas integration itself; the fixtures in `fixtures/canvas` cover every screen.

## Before you open a pull request

Run the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Then fill in the pull request template. Keep one change per pull request; a fix and a refactor go in separate ones.

## How the code is organised

- Screens live in `app/`, one component per part of a mockup in `components/`, logic in `lib/`.
- Integrations each have a thin client, typed models and a sync or action function: `lib/canvas`, `lib/ai`, `lib/email`.
- All date and hour maths goes through `lib/week.ts` and takes the student's time zone. Never use the server's local time (`getHours`, `getDate`, `toDateString`, `new Date(y, m, d)`) for anything a student sees.
- AI calls go through the `AiProvider` interface in `lib/ai` and only run on the server.
- Every string a student can read goes through `messages/en.json` and `messages/zh-Hans.json`. Both files must have exactly the same keys (a test checks this).
- Colors, radii and type come from the tokens in `design/tokens.css`, mapped in `styles/globals.css`. No raw hex values in components.

## Rules that keep the codebase small

The full list is in [CLAUDE.md](CLAUDE.md). The short version:

- Build what the current milestone in `docs/BUILD_PLAN.md` asks for, nothing speculative.
- One way to do each thing. If a second way appears, delete one.
- Files under about 300 lines, functions under about 40.
- No dead code, commented out code, placeholder screens or controls that do nothing.
- Say why before adding a dependency.
- Test the logic, not the framework.

## Hard rules

A pull request that breaks one of these will not be merged:

- Canvas and Ed are read only. Nothing is submitted or posted without an explicit click that shows what will be sent.
- Nothing is emailed on the student's behalf, except group reminders the student turned on and can see.
- AI text the student will send goes through the writing style check.
- Predicted hours always show their basis.
- Tokens and API keys are encrypted at rest and never reach the browser.

## Database changes

Edit `prisma/schema.prisma`, then run `npm run db:migrate` with a short migration name. Commit the generated folder in `prisma/migrations` together with the schema change. Never edit a migration that is already on `main`.

## Writing style

Do not use em dashes or en dashes in copy, docs or commit messages. Write short sentences.

## Commits

Write the subject line in the imperative ("Clear stale notes when a file changes"), under about 70 characters, and use the body to say why the change was needed.

## Working with an AI coding agent

`CLAUDE.md` is read automatically by Claude Code and carries the project rules. A good first prompt for a new task: "Read CLAUDE.md and the relevant part of docs/. Before writing code, list the files you will change and why. Work one step at a time, run the checks after each step, and list anything you added that could be deleted later."
