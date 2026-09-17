# EZCanvas design system

Version 0.4. The tokens live in `design/tokens.css`; the mockups in `design/*.html` show every component in context. Direction: modern and simple, calm and focused, larger type than a typical dashboard. Desktop first at 1440px, usable down to 1024px.

## Color

Ground and surfaces

| Token | Value | Use |
|---|---|---|
| `--ez-ground` | `#F8F7F3` | Page background (warm ivory) |
| `--ez-surface` | `#FFFFFF` | Cards, sidebar, inputs |
| `--ez-surface-soft` | `#FCFBF9` | Highlighted rows, translation preview pane |
| `--ez-track` | `#F1F0EC` | Segmented control tracks, subtle panels |
| `--ez-border` | `#E8E5DE` | Card borders |
| `--ez-divider` | `#ECE9E2` | Sidebar divider, hairlines |
| `--ez-line` | `#EEEBE4` | Row separators, grid lines |
| `--ez-control-border` | `#D9D4CA` | Input and secondary button borders |

Text

| Token | Value | Use |
|---|---|---|
| `--ez-text` | `#1E1C19` | Primary text |
| `--ez-text-2` | `#4A4640` | Body copy in cards, descriptions |
| `--ez-text-3` | `#6B665E` | Captions, meta (4.5:1 on white and on ground) |
| `--ez-nav` | `#3F3B35` | Sidebar item text |
| `--ez-icon` | `#7A756C` | Sidebar icons at rest |

Accent and semantic

| Token | Value | Use |
|---|---|---|
| `--ez-teal` | `#2A6B6E` | Primary actions, links, active icon |
| `--ez-teal-deep` | `#1F5457` | Active nav text, study block text |
| `--ez-teal-hover` | `#215659` | Link hover |
| `--ez-teal-soft` | `#EEF5F4` | Active nav, selected rows, info chips |
| `--ez-teal-tint` | `#F2F8F7` | Suggested study blocks, AI panels |
| `--ez-teal-border` | `#C9DCDB` | AI card borders |
| `--ez-warn` / `--ez-warn-soft` | `#9A4A1A` / `#F9ECE3` | Due soon, changed deadlines, unclaimed |
| `--ez-ok` / `--ez-ok-soft` | `#2F7A3E` / `#E3F1E5` | Synced, done, answered by professor |
| `--ez-danger` | `#B0352F` | Overdue, current time line |
| `--ez-neutral-soft` | `#F1EFE9` | Neutral chips |

Course colors (assigned in order, one per course): teal `#2A6B6E`, plum `#6A4C8F`, amber `#A3611F`, slate blue `#3B5F8C`. Soft versions for tiles: `#EEF5F4`, `#F3EEF8`, `#F9ECE3`, `#E7ECF3`.

All text colors above meet 4.5:1 on white and on the ground. White text sits only on the teal, plum, amber, slate and semantic strong colors.

## Typography

Fonts: Figtree (UI and body, weights 400 to 700), Instrument Serif (page titles only, weight 400), Noto Sans SC (Chinese text, weights 400 and 500). Load from Google Fonts with `display=swap`; fall back to `system-ui, sans-serif` and `Georgia, serif`.

Scale (after the v0.4 bump; keep this scale, do not shrink it)

| Role | Size / weight |
|---|---|
| Page title (serif) | 30 to 36px / 400, letter spacing -0.01em |
| Section title | 18px / 600 |
| Card title | 16 to 17px / 600 |
| Body | 15 to 15.5px / 400, line height 1.55 |
| Row title | 15 to 16px / 600 |
| Meta, captions | 13.5 to 14px / 400, `--ez-text-3` |
| Chip | 13px / 600 |
| Uppercase label | 12.5 to 13px / 600, letter spacing 0.06em |
| Sidebar item | 16px / 500 (600 when active) |
| Wordmark | 21px / 700, letter spacing -0.02em |

Chinese text: tag with `lang="zh-Hans"` so Noto Sans SC applies; keep line height 1.55.

## Spacing and shape

- Base unit 4px. Common gaps: 8, 10, 12, 14, 16, 20, 22.
- Page padding: 20 to 24px top, 32px sides.
- Card: white, 1px `--ez-border`, radius 16px. Inner padding 14 to 20px. Row separators `--ez-line`.
- Chips: height 24 to 26px, radius 999px, padding 0 9 to 10px.
- Buttons: height 36px (40px on the dashboard and calendar headers), radius 9 to 10px, weight 600. Primary: teal with white text. Secondary: white with `--ez-control-border`.
- Inputs: height 34 to 46px, radius 8 to 12px, `--ez-control-border`, background `--ez-surface` or `#FAF9F6` for prompt boxes.
- Switches: 44 by 26px (40 by 24px in compact cards), teal when on.
- Segmented control: track `--ez-track`, radius 9 to 10px, 3px padding; the selected segment is white with a 1px shadow.

## App shell

- Sidebar: 248px wide, white, 1px `--ez-divider` on the right, padding 24px 14px 20px.
- Wordmark: 34px teal rounded square (radius 10) with a white check mark, then "EZCanvas" in bold Figtree.
- Nav items: 48px tall, radius 12px, 12px gap between a 22px icon and the label. Rest: `--ez-nav` text, `--ez-icon` icon. Hover: `#F4F2EE`. Active: `--ez-teal-soft` background, `--ez-teal-deep` text, teal icon.
- Order: Dashboard, Calendar, Courses, Group projects, Homework helper, Study assistant. Bottom group: Settings, Language (shows the current explanation language), user row with a 36px avatar.
- Contextual sub lists (courses on the course screens, projects on the group screen): uppercase label, 42px rows at 15px with a 10px color square.
- Icons: 24 viewbox, stroke 1.75, round caps and joins, no fills. Dashboard is a four square grid; Courses a single book; Group projects two people; Homework helper sparkles; Study assistant a chat bubble; Settings sliders; Language a globe.
- Main area: `--ez-ground`, flex column, 16 to 22px gaps between blocks.

## Components seen in the mockups

- Top bar (dashboard): search field 42px tall, sync status chip (ok soft), notification button with a red dot.
- Due row: 4px color bar, title and meta, due chip, right aligned predicted time (118px column).
- Material row: 40px tinted icon tile, title and meta, status chip.
- Course row: 36px color tile with the course number, title and meta, 72px progress bar.
- Calendar week grid: 56px column for hours, seven day columns, 56px day header, all day "Due" row, 52px per hour, events absolutely positioned; lectures in course color with white text; suggested blocks dashed teal on `--ez-teal-tint`; current time line in danger red.
- Time needed card: rows with course dot, title, hours, 6px progress bar in the course color, a basis line in `--ez-text-3`.
- Notes panel: numbered points (22px teal circle numbers), Quiz chips in plum, key terms in a 3 column grid of soft tiles (English term, translation in teal, one line definition), a warm banner linking to related homework.
- Chat: user bubble teal with white text, radius 14 14 4 14; assistant bubble on ground with a line border, radius 4 14 14 14, a 28px teal soft avatar, a header line naming the mode and sources, and an English / target language segmented toggle.
- Email draft card: teal border, tinted header with tone chips and the style chip, two column body (English, translation preview on `--ez-surface-soft`), style check strip, action row.
- Thread list: rows with title, author role in teal for staff, age, replies, answer status chip. Active row `--ez-teal-soft`.
- Work split table: grid columns part / points / predicted / owner / team due / status; owner as 26px avatar plus name; unclaimed part shows a dashed teal Claim button; balance strip with four progress bars.
- Reminders card: schedule rows (time label 92px, message, status chip), preview box on ground, two secondary buttons.

## States

- Hover: rows `#F6F4EF`; nav `#F4F2EE`; secondary buttons darken the border to teal.
- Active or selected: `--ez-teal-soft` background; selected cards get a 2px teal border.
- Disabled or waiting: neutral chip `--ez-neutral-soft` with `--ez-text-2`.
- Focus: 2px teal outline offset 2px on all interactive elements (add in code; the mockups rely on browser defaults).

## Accessibility

Real elements for controls, labels on inputs, `aria-label` on icon only buttons, `aria-pressed` on toggle buttons, 44px minimum touch targets where the app may be used on a tablet, contrast as listed. Keep the segmented language toggle keyboard operable.

## Files

- `design/index.html` opens a gallery of all nine screens.
- `design/tokens.css` is the token sheet to import or map into the framework theme.
- The mockups are self contained HTML at 1440px wide; sidebar links move between screens.
