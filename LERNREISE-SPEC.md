# Lernreise — Build Specification

*(German Learning Tracker — working title before naming; the app is called Lernreise)*

Personal, single-owner web app for tracking a long-term German learning journey (A1 → A2 → B1 → B2), built to also survive future languages without a schema change. Stack: React, Supabase (Auth/Postgres/RLS), Vercel — consistent with the CalcHub project.

## 1. Vision

Tracks three things and connects them:
1. **Course** — where you are in your book (Language → Level → Course → Module → Lesson)
2. **Time** — how much you've actually studied (timer or manual entry, attached to a Lesson)
3. **Schedule** — when your teacher classes are, and when they change

History is permanent. Nothing gets deleted, only soft-deleted. A1 (Goethe-Institut, completed) and A2 (Momente A2 Kursbuch, current, Frau Cathy) are separate course records, not labels on one course.

## 2. Navigation

Exactly four bottom-nav / sidebar areas: **Dashboard, Course, Calendar, History**. Settings (and, inside it, Sharing) is reached via a profile icon, not a fifth nav item.

- Mobile: bottom tab bar + a persistent **+ Record Study** action.
- Desktop: left sidebar with the same four items; detail views (Lesson, Class) open as a right-side panel instead of a full-screen sheet.

## 3. Data model

See `schema.sql` for the full DDL + RLS. Summary:

- `languages` → `levels` → `courses` → `modules` → `lessons` (the core hierarchy; Language sits on top purely so a second language can be added later with zero migration)
- `lessons` → `study_sessions` (self-study) and `teacher_classes` (scheduled/completed lessons with a teacher) — one lesson per session, kept simple
- `teachers`, `institutions` — both optional/nullable everywhere; a teacher or course can exist with no institution and no contact info ("Not added yet" in the UI, never a raw null)
- `active_timer` — one row per owner, so a running timer is visible from any device, not just the one that started it
- `settings` — one row per owner: `ui_language` (de/en), `theme`, `remind_before_minutes`, `weekly_summary_enabled`
- `public_profile` — a single anon-readable row (`display_name`, `avatar_url`) kept separate from `settings`, since the login screen needs to show your name/photo *before* you're authenticated — everything else stays behind RLS
- `courses.cover_image_url` — an owner-uploaded photo of the book; a generic placeholder shows until one's added. Not auto-fetched from an external source, since a personal photo is more reliable than a lookup matching the exact edition.
- `share_links` — `role` is `viewer` or `teacher_editor`; a `teacher_editor` link is scoped to one `teacher_id` and can only touch that teacher's `teacher_classes` rows, nothing else
- `share_access_log` — one row per time a link/code was opened, not just a counter

**Known, deliberate limits:**
- Course → Module → Lesson is fixed at exactly two tiers of grouping. A future book needing a deeper structure (e.g. Book → Part → Chapter → Lesson) would need schema work, not just new rows.
- Single owner only. A `teacher_editor` share link is *not* a second admin — it's a narrow, revocable, schedule-only door, deliberately chosen over a real multi-admin model.

## 4. Pages

### Dashboard
Guten Tag header · A1/A2/B1/B2 journey strip · current course card with progress bar · four summary metrics (today / week / month / total) · Today · Upcoming (→ Calendar) · Recent (→ History) · Record Study + Add Class actions.

### Course
Collapsed, greyed A1 entry (tap → historical detail: institution, teachers, fixed schedule, "Add historical records"). A2 expanded: modules and lektionen with ✓ / ● / ○ status, with the book's cover photo shown next to its title (same thumbnail also appears on the Dashboard's current-course card). B1/B2 as inactive placeholders. Tapping a lektion opens Lesson Detail: status, dates, total self-study, linked teacher classes, sessions list, [Record Study] [Edit Lesson Status].

### Calendar
Week strip with a dot on class days · this-week agenda list · a "Changed" badge on any rescheduled class · tapping a class opens a small peek/drawer (date, time, original time if changed, status, [Edit] [Mark Completed]) rather than a new page · + Add Class.

### History
Search icon (full-text search over notes) · filter chips (All / Study / Classes) and a time-range filter · chronological list grouped by date · a collapsed A1 History summary at the bottom.

### Settings
Account (email, change password, profile photo + display name) · Appearance (theme, UI language DE/EN — this only translates the app's own labels, never your entered data) · Notifications (class reminder lead time, weekly summary on/off) · Export data (CSV) · Sign out · a single row linking to **Sharing**.

### Sharing (its own sub-page, not a main nav item)
Status filter (All / Active / Expired) · **Teachers** section (editor-role links, scoped to one teacher, e.g. Frau Cathy: schedule-only edit access, no expiry, full access log) · **Shared views** section (viewer-role links, e.g. "For Mom": read-only, has an expiry) · each link supports Edit and Revoke · + New access link (choose role, then link and/or code, then expiry if viewer).

### Visitor view (opened via a valid link/code, no login)
Same Dashboard/Course/Calendar/History content, read-only, with a "Read-only shared view" banner (showing expiry) instead of the greeting/settings icon, and no Record Study / Add Class / edit controls anywhere.

### Teacher view (opened via a `teacher_editor` link)
Not the visitor Dashboard — its own minimal page showing only that teacher's classes with you, with the ability to add a class, change a time, or mark one completed. Nothing else in the app is reachable from this link.

## 5. Auth & security

- Single owner, email + password, standard forgot-password email reset. Persistent session (no re-login every visit); concurrent sessions across devices are fine.
- The login screen shows your profile photo and display name if set (a personal touch, like a phone lock screen) — this never substitutes for the password, it's shown before authentication either way.
- Strong password requirements on the login form (same standard as CalcHub).
- Rate-limit / lockout after repeated failed attempts, both on the owner login and on the visitor access-code entry screen.
- Share links/codes are independent of the owner's credentials — a password reset never breaks an existing share.

## 6. Notifications

Email is the primary channel (works without the app open); in-app as a secondary surface.
- Class reminder — configurable lead time, default 60 minutes before.
- Stale timer — if a running timer passes a few hours, flag it on next open rather than trusting the elapsed time blindly.
- Share link expiring soon — a heads-up before a viewer link with an expiry lapses.
- Weekly summary email — total hours vs. last week.

## 7. Other decided behaviors

- **Soft delete everywhere** (study sessions, classes, lessons) — a short-lived trash/undo, not instant, irreversible deletion, since there's only one owner and no one else who could help recover a mistake.
- **Streaks** are computed from consecutive session dates, not stored.
- **Level transition** (e.g. A2 → B1) is a manual "Mark level complete" action, not automatic.
- **Course dates**: `start_date` / `end_date` are only set once a course is actually finished; an `estimated_end_date` holds a soft, editable guess in the meantime (e.g. A2's "~2 months, not sure").
- **Timezone**: single local timezone assumption, no multi-timezone support.
- **First run / onboarding**: if no course data exists yet, a short guided setup creates A1 (completed, Goethe-Institut) and A2 (current, Momente A2) once.
- **Backups**: Supabase automatic backups (confirm enabled) + the CSV export feature for the owner's own copy.

## 8. Visual design — not yet finalized

Direction proposed but not locked in: a calmer, journal-like palette (deep teal/forest base, warm amber accent for progress/streaks) rather than CalcHub's gold/orange, with soft shadows, subtle motion on actions like completing a lektion, and a slightly serif touch on headings. Needs an actual decision pass before or during build.

## 9. Suggested build order

1. Auth + Settings shell + the core hierarchy (Language/Level/Course/Module/Lesson) + Study Sessions + Dashboard + Course page
2. Calendar + Teacher Classes + notifications for class reminders
3. History + search + filters
4. Sharing (viewer links first, then the teacher-editor role) + the visitor/teacher views
5. Weekly summary email, theme, DE/EN localization, PWA installability
