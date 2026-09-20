# EZCanvas

Design and specification package for EZCanvas, an AI assisted study platform on the Canvas LMS API for international students. This folder holds no application code yet; it is the input for building the app with Claude Code in VS Code.

## What is in here

```
CLAUDE.md                  Context and rules Claude Code reads automatically
README.md                  This file
docs/
  PRODUCT_SPEC.md          Every screen, feature, user story, acceptance criteria, data model
  DESIGN_SYSTEM.md         Colors, type, spacing, components, app shell
  INTEGRATIONS.md          Canvas API, Ed Discussion, AI providers, email, calendar, reminders
  BUILD_PLAN.md            Milestones in build order
  DESIGN_DECISIONS.md      Decision log from the design sessions and open questions
design/
  index.html               Gallery of all nine screens (open this in a browser)
  tokens.css               Design tokens as CSS variables
  onboarding.html          Connect Canvas and Ed, choose language
  dashboard.html           Home: deadlines, predicted hours, new materials and Ed answers
  calendar.html            Week view with study blocks and the Time needed card
  course.html              Course materials with AI notes
  homework.html            Homework helper (assignment pane and guided chat)
  assistant.html           Study assistant: missed deadline email draft with translation preview
  discussions.html         Ed Discussion thread view with the AI panel
  group.html               Group project: rubric based work split, teammates, reminders
  settings.html            Connections, language, AI helper, writing style
```

The mockups are self contained HTML at 1440px wide. Sidebar links move between screens. The homework helper's English / 中文 toggle works.

## How to start building

1. Open this folder in VS Code.
2. Start Claude Code in the terminal (`claude`). It reads `CLAUDE.md` on its own, including the "Keep the codebase small" rules.
3. Paste this as the first prompt:

```
Read CLAUDE.md, then docs/PRODUCT_SPEC.md, docs/DESIGN_SYSTEM.md, docs/INTEGRATIONS.md and docs/BUILD_PLAN.md. Open design/index.html and look at every mockup.

Then, before writing any code, give me:
1. The stack you propose and the exact list of dependencies for M0, with one line on why each is needed.
2. The folder structure for M0 only (app shell, tokens, i18n, fixtures). No folders for later milestones.
3. The five smallest steps to get M0 done, each ending in something I can run and see.

Wait for my confirmation. Then work one step at a time. After each step: run it, show me what changed in at most 10 lines, list anything you added that we could delete later, and stop.

Rules for the whole project: only build what the current milestone asks for; one way to do each thing; no speculative abstractions, no extra config, no dead code; small files; tests for logic, not for the framework; ask when unsure instead of building both options.
```

4. Work milestone by milestone. At the end of each milestone ask: "Compare each finished screen with its mockup in design/ and list every difference. Then list any code that is not used by a shipped screen and propose deleting it."
5. Useful prompts during the build: "Before adding that package, tell me what it replaces and why we need it." "This file is over 300 lines; split it by responsibility." "Show me the diff summary before you commit."

## Run it locally

1. Copy `.env.example` to `.env` and fill in `AUTH_SECRET` and `APP_SECRET` (`openssl rand -base64 32`). Set `CANVAS_MOCK=1` to use the fixtures instead of a real Canvas account.
2. `npm install`, then `npm run db:migrate` and `npm run db:seed`.
3. `npm run dev` and open http://localhost:3000.
4. Sign in. There are no passwords. Either enter any email and open the link printed in the `npm run dev` terminal, or run `npm run signin` in a second terminal to print a link for the seeded user and paste it in the browser. Each link works once and lasts a day.
5. On onboarding step 1 paste a Canvas access token (any text in mock mode). The first sync runs in the background; Settings > Connections shows the result, Manage courses and Sync now.
6. The dashboard and calendar read from the synced data. On the calendar, Add blocks to calendar writes study blocks to EZCanvas only, never to Canvas, and Export gives you an .ics feed address.
7. Settings > AI helper takes an Anthropic API key. With one saved, a course file can be summarized from the course screen; notes are cached per file version and per language.
8. `npm test` runs the logic tests. `npm run sync` syncs every connection from the terminal. `npm run canvas:probe` prints what a token can see without writing anything. `npx prisma studio` browses the database.
9. After a schema change, restart `npm run dev`. The dev server keeps one Prisma client in memory and will not see new columns until it restarts.

## Decisions already made

Desktop web first. Calm, modern, simple look with larger type. Three language settings (interface, explanations, outgoing writing) with a translation preview on emails. Canvas and Ed are read only. Homework helper defaults to Guide mode and follows each course's AI policy. Predicted hours always show their basis. Group work is claimed, not assigned; reminders come from EZCanvas, not from a teammate. Writing the AI produces for the student is natural and non-defensive.

## Open questions

Listed at the end of `docs/PRODUCT_SPEC.md` and in `docs/DESIGN_DECISIONS.md`.
