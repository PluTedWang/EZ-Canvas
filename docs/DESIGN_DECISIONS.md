# EZCanvas design decisions log

Decisions made across the design sessions on September 17, 2026, in the order they were settled. Newest version of each decision wins.

## v0.1: first interface pass

- Platform: web app, desktop first (1440 wide), sidebar navigation. Mobile companions not yet designed.
- Visual direction chosen by Ted from three options: calm and focused (over bold and energetic, and Canvas familiar).
- Screens in the first pass: onboarding with language choice, dashboard, calendar week view, settings, course materials with AI notes, homework helper, study assistant with the missed deadline email flow.
- Language model: three separate settings (interface, explanations and summaries, outgoing writing). Outgoing writing defaults to English with a side by side translation preview so the student knows exactly what is being sent. "Keep academic terms in English" adds the translation once, for example traceability (可追溯性), so students learn the vocabulary their professor uses.
- AI provider: bring your own key (Anthropic, OpenAI, Google Gemini) or a local model (Ollama); key stored on device or encrypted server side.
- Homework helper modes: Explain, Guide me (default: hints and steps, no final answers), Check my work; the helper reads each course's AI policy from the syllabus and states it in one line.
- The assistant grounds every draft in Canvas facts (due date, late policy, instructor, office hours) and shows source chips. Nothing is sent from the app; drafts open in the student's email client.
- Calendar mixes Canvas deadlines and lectures with AI suggested study blocks (dashed) and exports to Google, Apple and .ics.

## v0.2: Ed Discussion, time prediction, writing style

- Ed Discussion connected beside Canvas. A Discussions tab on each course lists Ed threads with filters (professor and staff, per assignment, unanswered), the endorsed professor answer, an AI "what this means for your HW" panel, a thread summary with translation, and a draft box that posts in English from any language. Professor answers that change an assignment surface on the dashboard and in course notes; the assistant cites Ed threads as sources. Ed never posts without the student.
- Time prediction: every assignment carries a predicted duration, shown on the dashboard's due list ("2 h left of 6"), on calendar due pills, and in a calendar "Time needed" card with progress bars and the basis of the prediction (assignment length, rubric weight, the student's pace). The last prediction against actual is shown (HW 1 took 5.5 h against 5 h predicted) so students can calibrate trust. Suggested study blocks are sized from these.
- Writing style: Settings > AI helper has "Writing style when the AI writes for you", default "Natural, non-defensive": short sentences, states what happened once, one clear ask, no hedging or filler, learns from the student's edits. The email draft shows the style as a chip and a style check strip. The sample missed deadline email went from 121 words to 72.

## v0.3: writing style scope, group projects

- Writing style scope, decided by Ted: it applies to emails, Ed posts and anything the homework helper drafts with the student. The tool provides the possibility; how students use it on homework is their call, within each course's AI policy.
- Group projects section, one entry per group assignment from Canvas groups. Teammates by name and email via an invite form; teammates do not need EZCanvas and get an email link to claim parts and mark them done. The AI reads the rubric and splits the work into parts weighted by points and predicted hours; nobody is assigned, each person claims the parts they want; internal team deadlines sit before the real deadline (parts by Saturday, integration Sunday for a Monday due date); a balance strip shows predicted hours per person against a fair share. Reminders are sent by EZCanvas on the team's behalf so nobody has to pressure a teammate personally; group messages never single anyone out; a late person gets a private nudge from EZCanvas; the schedule and message preview are editable and reminders can be switched off.

## v0.4: modern shell, larger type

- Ted's feedback: the first sidebar looked dated. Redesigned the app shell: white sidebar (248px) with a hairline divider on the ivory ground; bold sans wordmark next to a teal rounded square with a check mark (the serif wordmark is gone); nav rows 48px tall at 16px with 22px icons in muted grey; active item is a soft teal block with teal text and icon; Settings, Language and the user sit at the bottom.
- Type scale moved up one step on every screen (body 15, secondary 13.5 to 14, chips 13, card titles 18). Artboards grew from 900 to 960 tall so nothing clips. Cards got a lighter border and 16px radius; the remaining beige control tracks became a neutral grey.
- Page titles remain in Instrument Serif for now; moving them to bold Figtree is an open option.

## Sample data used in the mockups

Sample user Ted at Cornell, Fall 2026: SYSEN 5100 Model-Based Systems Engineering, SYSEN 5200 Systems Analysis & Optimization, SYSEN 5930 Project Management, CS 5780 Machine Learning. HW 2 (requirements and use cases, parking garage example), Problem Set 2 and 3, project charter draft for Team 4 (Mina K., Diego R., Yuki T. with masked emails). Instructor names and emails are bracketed placeholders. Treat all of it as fixtures, never as real data.

## Open questions

- Page titles: serif or bold sans.
- Mobile screens (quick deadline check, assistant chat, claiming a group part from the phone).
- Month and agenda calendar views; a full course Overview tab; an Assignments tab.
- Time prediction calibration: explicit time logging vs. inference from activity.
- Ed integration scope: read only vs. posting drafts from EZCanvas; Ed API access at Cornell.
- Group projects: the claim page for teammates without EZCanvas; email only or also text reminders; escalation when a part is never claimed.
- Which languages to fully localize first; right to left layouts in v1.
- Canvas auth: personal access token for v1, institution OAuth for launch.
