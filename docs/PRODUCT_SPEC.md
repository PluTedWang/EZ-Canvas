# EZCanvas product specification

Version 0.4, September 17, 2026. Companion to the design mockups in `design/`.

## 1. What EZCanvas is

An AI assisted study platform that connects to a student's Canvas LMS account (and optionally Ed Discussion) and turns the raw course data into a calendar, organized deadlines, notes on every material the professor posts, a homework helper, a study assistant for real situations, and group project coordination. It is built for international students studying in English speaking countries, so language support is a core layer, not a setting bolted on later.

EZCanvas reads from Canvas and Ed. It never changes anything in either system on its own.

## 2. Who it is for

Primary: an international graduate or undergraduate student (the sample user is Ted, an M.Eng. student at Cornell) taking four to five courses on Canvas, comfortable in English but faster and more confident reading explanations in their first language, and unsure how to write to professors in the local academic register.

Secondary: any student who wants one calendar across courses, predicted time per assignment, and notes on lecture materials.

## 3. Product principles

1. Canvas stays the system of record. EZCanvas summarizes, explains, predicts and drafts; it does not alter course content and does not act on Canvas or Ed without a click from the student.
2. Grounded, never invented. Every claim the assistant makes about a course (due date, late policy, office hours, what the professor said) is traced to a Canvas or Ed source and shown as a source chip.
3. The student decides. Guide mode by default for homework, claim your own parts in group work, edit every draft before it leaves.
4. Language is three separate choices: interface, explanations, and outgoing writing. Outgoing writing is English by default with a translation preview so the student knows what they are sending.
5. Writing that sounds like a person. Anything the AI writes for the student uses the natural, non-defensive style (section 8).

## 4. Screens and features

Each screen has a mockup in `design/`. Layout, copy and states come from the mockup.

### 4.1 Onboarding (`design/onboarding.html`)

Three steps: connect Canvas (and optionally Ed), choose language, set up the AI helper.

- Connect Canvas: school Canvas URL plus a personal access token for v1 (institution OAuth later; see INTEGRATIONS). On success, show the courses found.
- Language step: 12 languages shown by native name with the English name underneath. Selecting one sets the interface and explanation languages; both can be changed separately later. Two options default on: keep academic terms in English, and show a translation preview on emails.
- AI helper step: pick a provider (Anthropic, OpenAI, Google Gemini, local model) and enter a key, or skip and use the app's default if one is configured.

Acceptance: a new user reaches the dashboard with courses synced in under two minutes; every step can be revisited from Settings.

### 4.2 Dashboard (`design/dashboard.html`)

- Greeting with today's date, count of deadlines in the next 8 days, predicted hours of work, count of new materials summarized, and count of new Ed threads (with how many are from a professor).
- Due soon: assignments across courses ordered by due date, each with course, points, submission type, due chip (relative when within 48 hours), and predicted time ("2 h left of 6", "about 4 h"). Group assignments show team progress and link to the group project screen.
- New from your professors and Ed: newly posted files with summary status, readings, announcements that affect a deadline (flagged), and Ed threads answered by a professor that change how an assignment should be done.
- Ask your study assistant: a prompt box with three suggested prompts generated from the student's current week.
- Your courses: each course with a progress bar (assignments done) and the next due item.
- Top bar: search across courses, files and deadlines; Canvas sync status; notifications.

### 4.3 Calendar (`design/calendar.html`)

- Week view (v1), with Month and Agenda views planned. Time grid from 9 AM to 7 PM plus an all day "Due" row.
- Sources: Canvas lectures (from the course calendar or syllabus schedule), Canvas assignment due dates, Ed announcements that move a time (for example office hours), and AI suggested study blocks (dashed) sized from the predicted hours.
- Filters by course, lectures on or off, suggested blocks on or off.
- Today panel: today's items and tomorrow's deadline with the course late policy.
- Time needed card: each open assignment with predicted hours, hours done, a progress bar, and the basis of the prediction. Show the last prediction against actual (for example "HW 1 took 5.5 h against a 5 h prediction") so the student can calibrate trust.
- This week's plan: the assistant's proposed set of study blocks with a one paragraph rationale, an "Add blocks to calendar" action and an "Adjust" action.
- Export: Google Calendar, Apple Calendar, .ics feed.

Acceptance: adding blocks writes them to the EZCanvas calendar (not Canvas); the .ics feed updates within one sync cycle.

### 4.4 Course materials and AI notes (`design/course.html`)

- Course header with code, name, instructor, meeting times, progress, and tabs: Overview, Materials & notes, Assignments, Discussions (Ed, with a new count), Announcements, Grades.
- Left: Canvas modules with files, readings, recordings and assignments. Each file shows its AI status (new, summarized, transcript ready).
- Right: notes for the selected file. Summary of five to seven points; points the professor flagged as exam material (detected from the recording transcript or slides, with the timestamp) carry a "Quiz" chip. Key terms kept in English with the translation once and a one line definition. A "connected to your work" banner when the file relates to an open assignment. An ask box scoped to that file.
- English / target language toggle on the notes.

### 4.5 Homework helper (`design/homework.html`)

- Left: the assignment from Canvas. Title, due, points, submission type, late policy, attachments (with a flag when an announcement changed which template to use), the questions parsed from the assignment PDF or description with points and status, the professor's original wording for the selected question, and the rubric as chips.
- Right: the helper chat. Modes: Explain, Guide me (default), Check my work. The header states what the helper knows (assignment, related lecture, rubric, relevant Ed threads) and the course's AI policy in one line.
- Replies carry an English / target language toggle. Examples are drawn from the assignment's own scenario.
- Composer chips: current mode, natural writing on, context list.
- Guide mode never gives a final answer; it gives the distinction, an example, a quick test, what the rubric wants, and a "your turn" prompt. Check my work compares the student's draft to the rubric and the professor's checklist.

### 4.6 Study assistant (`design/assistant.html`)

- Situations list: missed a deadline, ask for an extension, question about a grade, absence from class, book office hours, group member not contributing, something else. Recent conversations with their outcome.
- The reply grounds itself in Canvas and Ed: due date, late policy from the syllabus, instructor page, relevant Ed thread. Source chips under the reply.
- Email draft card: To (instructor email from Canvas), Subject, body. Tone chips (Formal, Warm, Brief). Style chip "Natural, non-defensive". Written in English with a side by side translation preview in the student's language, labelled as a preview that is not sent. Style check strip: states what happened once, one clear ask, no filler or hedging, word count against the first draft. Actions: Open in Gmail, Copy, Edit draft.
- Nothing is sent from the app.

### 4.7 Ed Discussion (`design/discussions.html`)

- A Discussions tab on each course. Thread list synced from Ed with filters: All, Professor & staff, per assignment, Unanswered. Each thread shows author role, age, reply count and answer status (answered by professor, answered by TA, students only, unanswered). Pinned professor posts that change an assignment carry a flag.
- Thread view: the question, the endorsed instructor answer highlighted, follow ups, and a count of remaining replies on Ed.
- AI panel: "What this means for your HW" (applies the answer to the student's own draft and links to the homework helper), a thread summary with translation.
- Draft a follow up: the student writes in any language; EZCanvas drafts an English post in the natural style. Posting happens on Ed after the student reviews it (v1 opens Ed with the draft copied; direct posting is a later decision).

### 4.8 Group projects (`design/group.html`)

- List of group assignments from Canvas groups. Per project: header with course, team, due date, points, rubric section count, predicted total hours.
- Work split from the rubric: one part per rubric section with points, predicted hours, owner, team due date (internal deadline before the real one), status. Nobody is assigned; each person claims parts. Unclaimed parts show a Claim button. Re-split and Edit parts actions.
- Balance strip: predicted hours per person against a fair share, and a note about what the next reminder will say if a part stays unclaimed.
- Team card: members with name, masked email, and status (organizer, joined, invited). Invite form: name and email. Teammates do not need EZCanvas; they get an email link to claim parts and mark them done (a lightweight claim page, not yet designed).
- Reminders sent by EZCanvas for the team: on or off, a schedule (everyone before the internal deadline, private nudge to anyone not done, integrator when parts are in, everyone before the real deadline), a preview of the next message in the natural style, Edit schedule and Send one now. Group messages never single anyone out; late people get a private nudge from EZCanvas, not from a teammate.

### 4.9 Settings (`design/settings.html`)

- Connections: Canvas (URL, account, token date, sync interval, courses synced and hidden, Manage courses, Sync now) and Ed (courses, sync interval, Disconnect, Sync now).
- Language: interface language, explanations and notes language, email language (with translation preview), keep academic terms in English, translate announcements automatically.
- AI helper: provider cards (Anthropic Claude, OpenAI, Google Gemini, Local model), key stored on device or encrypted server side, homework helper default mode, follow each course's AI policy, writing style when the AI writes for you.
- Notifications and Privacy sections are listed in the sub navigation but not designed yet.

## 5. Language rules

- Three settings: interface, explanations, outgoing writing. Defaults after onboarding: interface and explanations in the chosen language, outgoing writing in English with translation preview on.
- Academic terms stay in English inside explanations; the translation is added once in parentheses on first use, for example "traceability (可追溯性)".
- Every AI reply in a non English explanation language keeps quoted assignment text, rubric wording and professor quotes in the original English.
- Mark language on elements (`lang="zh-Hans"` and so on) so fonts and screen readers behave.
- Right to left languages (Arabic) are listed in onboarding; RTL layout is an open question for v1.

## 6. Time prediction

Input: assignment length (description, attachments, number of parsed questions), points and rubric weight, submission type, the student's pace on earlier assignments in the same course (time logged or inferred from activity), and the course's history if the student has none.

Output: predicted hours, hours done (from logged study blocks and marked progress), hours left, and a one line basis. Always show the basis. Once the student finishes an assignment, store actual against predicted and show the most recent comparison on the Time needed card.

Study blocks are proposed from hours left, the lectures on the calendar, and free time, keeping one evening free per weekend by default. Blocks are dashed until accepted.

## 7. Homework helper modes and AI policy

- Explain: explains the question, the concept behind it, and what the rubric rewards.
- Guide me (default): hints, steps, examples on the assignment's own scenario, and a "your turn" prompt. No final answers.
- Check my work: the student pastes a draft; the helper checks it against the rubric and the professor's checklist and points at what is missing.
- Course AI policy: parsed from the syllabus at sync time and shown in one line in the helper header. When the policy forbids AI assistance on submitted work, Check my work stays available for understanding and Full solutions are hidden. When the syllabus has no policy, say so.

## 8. Writing style layer ("Natural, non-defensive")

Applies to emails, Ed posts, and anything the homework helper drafts with the student. Rules the generator follows and the style check reports:

1. Short sentences. Say what happened once; do not over explain or stack apologies.
2. One clear ask, phrased as a direct question or request.
3. No filler or hedging phrases ("I hope this email finds you well", "I would be very grateful if it were at all possible", "just", "sorry to bother you").
4. Facts stay exact (dates, assignment names, policy wording) and are checked against Canvas.
5. Keep the student's chosen tone (Formal, Warm, Brief) and learn from edits the student makes to drafts.

The style check strip reports three checks and the word count against the first draft. Sample: the missed deadline email dropped from 121 words to 72.

## 9. Data model (entities)

- User: id, name, email, interface language, explanation language, writing language, term handling flags, AI provider and encrypted key, homework default mode.
- Connection: user, type (canvas, ed), base URL, encrypted token, last sync, status.
- Course: canvas id, code, name, term, instructor, meeting times, color, AI policy text, syllabus, hidden flag.
- Assignment: course, canvas id, title, description, due at, points, submission type, late policy, rubric (sections with points), attachments, group flag, parsed questions (title, points, status), predicted hours, hours done, actual hours.
- Material: course, module, canvas file or page id, type (file, reading, recording, announcement), posted at, summary, key points with quiz flags, key terms with translations, transcript reference.
- CalendarItem: user, source (canvas lecture, canvas due, ed announcement, study block), start, end, all day, course, assignment, accepted flag.
- EdThread: course, ed id, title, author role, posted at, reply count, answer status, pinned, affects assignment id, summary, translation.
- Conversation and Message: user, kind (homework, assistant), context references (assignment, material, thread), messages with role and language.
- EmailDraft: conversation, situation, tone, subject, body, translation, style check, opened at.
- GroupProject: assignment, team name, members (name, email, status), parts (rubric section, points, predicted hours, owner, team due, status), reminders (schedule, on flag, sent log).

## 10. Non goals for v1

Mobile apps, Canvas write back (grades, submissions from inside EZCanvas beyond a link out), automatic posting on Ed, automatic emails to professors, a marketplace of prompts, and support for LMSs other than Canvas.

## 11. Open questions

- Page titles: keep the serif or move to bold sans for a fully modern look.
- Ed API access varies by institution; confirm for Cornell before building the Ed sync.
- How teammates without EZCanvas claim parts (claim page design).
- Reminders by email only, or also by text.
- Time prediction calibration: explicit time logging vs. inference from activity.
- Canvas auth: personal token for v1, institution OAuth app for launch.
- Right to left layouts in v1.
