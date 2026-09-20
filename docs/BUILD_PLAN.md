# EZCanvas build plan

Build in this order. Each milestone ends with the listed screens matching their mockups (see the definition of done in `CLAUDE.md`). Confirm the stack with Ted before M0.

## M0. Foundation (1 to 2 days)

- Scaffold the app, database, i18n, and the design tokens from `design/tokens.css` mapped into the theme.
- App shell: sidebar, page frame, top bar. Match `design/dashboard.html` for the shell.
- Fixtures that mirror the mockups so every later screen can be built without live Canvas.
- Auth for the EZCanvas account itself (email magic link or institution SSO later).

Done when: the shell renders with the six nav items, Settings, Language and the user row, in English and Simplified Chinese.

## M1. Canvas connection and sync (3 to 4 days)

- Connections model, encrypted token storage, onboarding step 1.
- Canvas client with pagination and rate limit handling; sync job for courses, assignments, modules, files, announcements, calendar events, groups; syllabus parsing (late policy, AI policy, office hours, meeting times).
- Settings > Connections with Manage courses and Sync now.

Done when: a real Canvas account syncs and the data appears in the fixtures' shapes; `CANVAS_MOCK=1` still works.

## M2. Dashboard and calendar (3 to 4 days)

- Time prediction (first version: assignment features and course defaults; personal pace once history exists).
- Dashboard: greeting counts, due soon, new from professors, courses, assistant prompt box (prompt box can route to M4).
- Calendar week view with lectures, due row, filters, today panel, Time needed card, This week's plan with study block generation and acceptance; .ics feed and Google template link.

Done when: `design/dashboard.html` and `design/calendar.html` match with synced data.

## M3. Course materials and AI notes (3 to 4 days)

- AI provider interface and the Anthropic adapter first; settings step for provider and key (onboarding step 3 and Settings > AI helper).
- Text extraction for PDFs, slides, pages; transcript intake for recordings when a media file is available.
- `summarizeMaterial` prompt, quiz flag detection, key terms with translations, related assignment linking.
- Course screen with modules on the left and notes on the right, language toggle, ask box scoped to the file.

Done when: `design/course.html` matches and summaries are cached per file version.

## M4. Homework helper and study assistant (4 to 5 days)

- `parseAssignment` into questions and rubric; assignment pane.
- Helper chat with Explain, Guide me, Check my work; course AI policy line; language toggle on replies; natural writing chip.
- Situations, grounded advice with source chips, email draft card with tone chips, translation preview, style check, Gmail and mailto hand off, recent list with outcomes.
- Writing style layer and `styleCheck` used by both.

Done when: `design/homework.html` and `design/assistant.html` match and the style check reports on real drafts.

## M5. Ed Discussion (2 to 3 days, after confirming API access)

- Ed connection and sync; course matching; answer status; pinned post flags; thread summary and translation.
- Discussions tab on the course screen and the thread view with the AI panel; dashboard row for professor answers; assistant source chips from Ed.

Done when: `design/discussions.html` matches. If Ed access is not possible, ship the tab hidden behind a feature flag.

## M6. Group projects and reminders (4 to 5 days)

- Group assignments from Canvas groups; team card with invite form; claim page for teammates without accounts.
- `splitRubric` into parts with predicted hours and internal deadlines; claim, re-split, edit parts; balance strip.
- Reminder schedule, jobs, transactional email, previews in the natural style, private nudges, send log.

Done when: `design/group.html` matches and a full reminder cycle runs against a test team.

## M7. Polish and launch prep

- Settings: Notifications and Privacy sections; language settings end to end; RTL decision.
- Production sign in email: verify a sending domain with Resend, set `RESEND_API_KEY` and `EMAIL_FROM`, and confirm the magic link arrives in a real inbox. Until then the link only prints to the server terminal, which works in development but not for real users. Also add a resend cooldown and an expired link message.
- Canvas OAuth developer key flow.
- Accessibility pass (focus rings, keyboard paths, contrast check), performance pass on sync, error states for lost connections.
- Analytics events for activation: connected Canvas, first summary read, first study block accepted, first draft opened.

## Cross cutting tests

Canvas pagination and mapping; syllabus policy parsing; assignment question parsing; time prediction; rubric split and balance; reminder scheduling and message generation; style check; i18n coverage (no untranslated strings in the two shipped languages).
