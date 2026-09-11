# Lernreise

Personal German-learning tracker. See `LERNREISE-SPEC.md` for the full product spec and `schema.sql` for the database.

## Setup

1. Create a Supabase project, then run `schema.sql` in its SQL editor.
2. Create two Storage buckets: `avatars` and `book-covers` (public read, owner-only write).
3. Insert your one `public_profile` row and one `settings` row for your account.
4. `cp .env.example .env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from your Supabase project settings.
5. `npm install`
6. `npm run dev`

## What's scaffolded so far

- Routing shell (`src/App.jsx`) with the four main pages behind the bottom nav, plus `/login`
- Supabase client (`src/lib/supabaseClient.js`)
- DE/EN string dictionary pattern (`src/lib/i18n.js`) — extend this as each page is built, never route the owner's own entered data through it
- A fully built Login page (`src/pages/Login.jsx`), including the public-profile lookup for the personal greeting/avatar before sign-in
- Design tokens in `tailwind.config.js` (sage/pine/amber palette, Fraunces + IBM Plex Sans)

## What's next

Dashboard, Course, Calendar, History, Settings, and Sharing are placeholder stubs — build these in the order suggested in the spec's "Suggested build order" section.
