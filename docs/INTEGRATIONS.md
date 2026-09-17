# EZCanvas integrations

How EZCanvas reads Canvas and Ed, talks to AI providers, hands off email, exports calendars, and sends group reminders. All integration code is server side under `lib/<name>` with a thin client, typed models, and a sync or action function. Everything below that is marked "verify" should be checked against the live API before it is relied on.

## 1. Canvas LMS

Base URL: the institution's Canvas host, for example `https://canvas.cornell.edu` or `https://<school>.instructure.com`, plus `/api/v1`. Let the user enter their school URL in onboarding; store it on the connection.

Auth for v1: a personal access token the student creates in Canvas (Account > Settings > New Access Token). Send `Authorization: Bearer <token>`. Store encrypted. For launch, register a Canvas developer key and use OAuth2 (`/login/oauth2/auth` and `/login/oauth2/token`) so students do not handle tokens.

Pagination: Canvas returns `Link` headers with `rel="next"`. Always request `per_page=100` and follow `next` until absent. Respect `X-Rate-Limit-Remaining`; back off when it gets low.

Endpoints EZCanvas uses (verify parameters against the Canvas REST docs):

| Need | Endpoint |
|---|---|
| Profile | `GET /users/self/profile` |
| Courses | `GET /courses?enrollment_state=active&include[]=term&include[]=teachers&include[]=syllabus_body` |
| Assignments with own submission | `GET /courses/:id/assignments?include[]=submission&include[]=rubric&order_by=due_at` (rubric is on the assignment object when one is attached) |
| Own submission detail | `GET /courses/:id/assignments/:aid/submissions/self` |
| Modules and items | `GET /courses/:id/modules?include[]=items&include[]=content_details` |
| Files | `GET /courses/:id/files` and `GET /files/:id` (download via the `url` field, which is time limited) |
| Pages | `GET /courses/:id/pages` and `GET /courses/:id/pages/:url` |
| Announcements | `GET /announcements?context_codes[]=course_<id>&start_date=...` |
| Discussion topics (Canvas native) | `GET /courses/:id/discussion_topics` |
| Calendar events (lectures, due dates) | `GET /calendar_events?context_codes[]=course_<id>&type=event` and `type=assignment`, with `start_date` and `end_date` |
| Upcoming and to do | `GET /users/self/upcoming_events`, `GET /users/self/todo` |
| Groups | `GET /users/self/groups`, `GET /groups/:id/users`, `GET /courses/:id/groups` |
| Media recordings | Recordings usually appear as module items linking to external tools or files; treat as files or external links and only transcribe when a media file is downloadable |

Sync strategy: full sync at connect, then an incremental sync every 15 minutes (configurable) that refetches courses, assignments, modules, announcements and calendar events for active courses. Keep `updated_at` and ETags where offered. Mark items new when first seen and surface them on the dashboard. Parse the syllabus body once per change for: late policy, AI policy, office hours, meeting times.

Derived data produced from Canvas at sync time: assignment questions (parse the description and attached PDF), rubric sections, predicted hours (see the product spec), affected deadlines (an announcement that mentions an assignment and a date, flagged for review rather than silently applied).

Canvas is read only for EZCanvas. "Submit to Canvas" and "Open in Canvas" are links to the Canvas page for the assignment.

## 2. Ed Discussion

Ed has no official public API for students. Community tools use the same endpoints the Ed web app uses; access and terms vary by institution, so confirm this is acceptable at Cornell before building, and design the sync to be optional. Verify every endpoint.

- Base: `https://us.edstem.org/api` (region prefix may differ).
- Auth: an API token the user creates in Ed settings, sent as `Authorization: Bearer <token>`.
- `GET /user` returns the user and their courses (Ed course ids), which are matched to Canvas courses by code and term.
- `GET /courses/:id/threads?limit=30&offset=0&sort=new` lists threads with author role, category, reply counts, and whether an answer is endorsed or from staff.
- `GET /threads/:id` returns the thread with answers and comments.

Derived data: answer status (professor, TA, students only, unanswered), pinned staff posts that reference an assignment (flag "Changed HW 2" when the post mentions an assignment and a change word such as template, deadline, extension, rubric), a summary and translation per thread, and an "applies to your work" note when a thread references an assignment the student has open.

Ed is read only in v1. The draft box produces an English post; posting opens Ed with the draft copied to the clipboard. Direct posting is a later decision.

## 3. AI providers

One server side interface:

```
interface AiProvider {
  complete(input: { system: string; messages: Message[]; maxTokens?: number; json?: boolean }): Promise<string>;
  embed?(texts: string[]): Promise<number[][]>;
}
```

Adapters: Anthropic (Messages API), OpenAI (Chat Completions or Responses), Google Gemini, and a local Ollama endpoint (`http://localhost:11434`) for students who want nothing to leave their machine. Provider and key come from the user's settings; keys are encrypted at rest and never sent to the browser.

Prompt families (keep each in its own file under `lib/ai/prompts`):

- `summarizeMaterial`: input file text or transcript, output JSON with summary points, quiz flags with evidence and timestamp, key terms with translations in the explanation language, related assignments.
- `parseAssignment`: input description and attachment text, output questions with points, the rubric, the submission type and late policy.
- `predictHours`: input assignment features and the student's history, output hours and a one line basis.
- `homeworkHelper`: input mode, course AI policy, assignment, question, related material excerpts, Ed answers, explanation language; the system prompt encodes the Guide mode rule (no final answers) and the language rules (terms in English, translation once).
- `assistant`: input situation, Canvas and Ed facts (already fetched and passed in as data, never asked from the model), tone, style rules; output the advice and the draft with a sources list.
- `styleCheck`: input a draft, output the three checks and a word count; also used to rewrite in the natural style.
- `splitRubric`: input rubric sections and team size, output parts with predicted hours and suggested internal deadlines.
- `translate`: for previews and summaries, with a glossary of course terms to keep in English.

Grounding rule: the assistant only states facts that were passed in from Canvas and Ed. Each fact carries a source reference the UI shows as a chip.

Costs: cache summaries per file version; do not resummarize unchanged files. Send only the relevant excerpts for homework questions (retrieve by module and by keyword; embeddings are optional).

## 4. Email hand off

Drafts open in the student's mail client. Provide two actions:

- Gmail compose URL: `https://mail.google.com/mail/?view=cm&fs=1&to=<to>&su=<subject>&body=<body>` with URL encoding.
- `mailto:` link with subject and body for other clients.
- Copy to clipboard.

EZCanvas never sends an email to a professor. Record that a draft was opened, and let the student mark the outcome (sent, replied, approved) on the assistant's recent list.

## 5. Calendar export

- `.ics` feed: a per user tokenized URL (`/api/calendar/<token>.ics`) that emits deadlines, lectures and accepted study blocks with stable UIDs so updates replace rather than duplicate. Google Calendar and Apple Calendar subscribe to this URL.
- Direct "Add to Google Calendar" for a single block can use the template link `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...`.

## 6. Group project reminders

The one place EZCanvas sends email on the student's behalf, and only after the organizer turned reminders on for that project and can see the schedule and message preview.

- Transport: a transactional email provider (Resend, Postmark) or SMTP, configured server side. Send from an EZCanvas address with the organizer in reply to, so replies reach the team.
- Recipients: team members by the emails entered on the team card. Teammates who have not joined EZCanvas still receive reminders; each email carries a link to the claim page (claim a part, mark done, opt out).
- Schedule: generated from the project's due date (everyone before the internal deadline, private nudge to anyone whose part is not done, integrator when parts are in, everyone before the real deadline). Stored as jobs; a scheduler runs them. Editing the schedule rewrites the jobs.
- Content: generated once when the schedule is created and regenerated with current status just before sending, in the natural style; group messages never name a person who is behind. Private nudges go only to that person.
- Logging: every send is logged and shown on the reminders card.

## 7. Storage and privacy

- Canvas and Ed tokens and AI keys: encrypted with `APP_SECRET` (AES-GCM), decrypted only in server code that calls the provider.
- Course files: cache text extracts, not the files themselves, unless the student opts in to local caching; keep the Canvas download link.
- Data is never used to train models. Say so in onboarding and settings.
- Deleting a connection deletes its synced data and derived notes.

## 8. Local development

Seed fixtures that mirror the mockups (Ted at Cornell, four courses, HW 2, Team 4) so every screen renders without live connections. Provide a `CANVAS_MOCK=1` mode that serves fixtures from the Canvas client.
