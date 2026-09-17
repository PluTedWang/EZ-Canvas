# CLAUDE.md

This folder is the design and specification package for **EZCanvas**, an AI assisted study platform built on the Canvas LMS API for international students studying in English speaking countries. Nothing here is application code yet. Your job is to build the app from this package.

## Read these first, in this order

1. `docs/PRODUCT_SPEC.md` — what the product does, every screen, user stories, acceptance criteria, data model.
2. `docs/DESIGN_SYSTEM.md` — colors, type, spacing, components. Match it exactly; do not invent a new look.
3. `docs/INTEGRATIONS.md` — Canvas API, Ed Discussion, AI providers, email, calendar export, reminders.
4. `docs/BUILD_PLAN.md` — milestones in the order they should be built.
5. `design/index.html` — open in a browser. Nine high fidelity mockups of the screens you are building. `design/tokens.css` holds the design tokens as CSS variables.

The mockups are the source of truth for layout and copy. When the spec and a mockup disagree, follow the mockup and note the difference in your summary.

## Suggested stack (confirm with Ted before scaffolding)

- Next.js (App Router) with TypeScript and Tailwind CSS. Map `design/tokens.css` into the Tailwind theme rather than hard coding hex values.
- Prisma with SQLite for local development and Postgres for deployment.
- Background jobs (Canvas and Ed sync, reminders) with a simple scheduler that can run as a cron route or a worker; keep the job code independent of the scheduler.
- `next-intl` (or equivalent) for interface strings from day one. English and Simplified Chinese ship first; every user facing string goes through the i18n layer.
- AI calls only from the server. A single `AiProvider` interface with adapters for Anthropic, OpenAI, Google Gemini and a local Ollama endpoint. The user's own API key is stored encrypted and never sent to the client.

If Ted prefers a different stack, keep the same boundaries: server side integrations, one AI provider interface, i18n from the start, tokens from `design/tokens.css`.

## Keep the codebase small (read this twice)

The biggest risk on this project is bloat: code that is generated fast, never read, and then blocks every later change. These rules override speed.

- Build only what the current milestone in `docs/BUILD_PLAN.md` asks for. No speculative abstractions, no "for later" options, no feature flags for features that do not exist yet, no config for things that have one value.
- Before adding a dependency, say why the standard library or an existing dependency cannot do it. Prefer boring, widely used packages. No UI kits, state libraries or ORM wrappers beyond the ones agreed for the stack.
- One way to do each thing: one HTTP client wrapper, one date helper, one way to call the AI, one component per mockup part. If a second way appears, delete one.
- Files stay under about 300 lines and functions under about 40. When a file grows past that, split by responsibility, not by "utils".
- No dead code, no commented out code, no TODOs without an issue reference, no placeholder implementations that return fake data outside the fixtures folder.
- Do not generate boilerplate the framework already provides (custom routers, custom form state, custom fetch caching, custom auth flows) unless the spec needs behavior the framework lacks.
- Types come from the data model in `docs/PRODUCT_SPEC.md`. Do not invent parallel types for the same entity in different layers; map at the integration boundary only.
- Write the test for the logic, not for the framework. A screen test that only checks that a component renders is noise; a test that checks the rubric split is worth keeping.
- Every change ends with a short summary: what files changed, what was added, what could be deleted later. If a change touched more than 10 files, stop and explain why before continuing.
- When unsure whether something belongs in this milestone, ask, then wait. Do not build both options.

## Hard rules

- Canvas and Ed data are read only. EZCanvas never writes to Canvas or posts to Ed on its own. Submitting to Canvas or posting on Ed requires an explicit user click and shows exactly what will be sent.
- Nothing is emailed automatically on the student's behalf, with one exception: group project reminders, which the student turned on and can see and edit in advance. Emails to professors are drafted, then handed to the student's email client (mailto or Gmail compose URL). No sending from the app.
- Every AI generated text that the student will send (emails, Ed posts, homework helper drafts) goes through the writing style layer described in `docs/PRODUCT_SPEC.md` ("Natural, non-defensive").
- The homework helper reads each course's AI policy from the syllabus and defaults to Guide mode (hints and steps, no final answers). Full solutions are available only when the course policy allows and the student switches mode.
- Course terms stay in English with a translation added once (see the language rules in the product spec).
- Predicted hours are always shown with their basis and, when available, the last prediction against actual. Never show a bare number.
- Accessibility as drawn: real `<button>`, `<a>`, `<input>` with labels; icon only buttons carry `aria-label`; text contrast 4.5:1 or better.

## Conventions

- Keep components small and named after the mockup parts: `Sidebar`, `DueSoonList`, `TimeNeededCard`, `WorkSplitTable`, `EmailDraftCard`, `ThreadList`, and so on.
- Put integration code under `lib/canvas`, `lib/ed`, `lib/ai`, `lib/email`, `lib/calendar`. Each has a thin client, typed models, and a sync or action function. Mock these in tests.
- Write tests for: Canvas pagination and mapping, assignment parsing into questions, time prediction, work split from a rubric, reminder scheduling, and the writing style checker.
- Do not use em dashes or en dashes in user facing copy or in these docs. Ted's preference.
- Sample data in the mockups (Ted, Cornell, SYSEN 5100, Team 4, Mina K., and so on) is placeholder content for the design. Do not hard code it; seed it as fixtures for development only.

## Definition of done for a screen

The screen matches its mockup at 1440px wide, works down to 1024px, uses tokens only, every string is translatable, it loads from real synced data (or seeded fixtures in dev), keyboard navigation works, and there is at least one test for the logic behind it.

## Environment variables you will need

```
DATABASE_URL=
APP_SECRET=                  # for encrypting stored user tokens and API keys
CANVAS_DEFAULT_BASE_URL=     # e.g. https://canvas.cornell.edu (user can override)
RESEND_API_KEY= or SMTP_*    # only for group project reminder emails
```

Per user, stored encrypted in the database rather than in env: Canvas access token, Ed API token, AI provider key.
