# Lernreise

Personal German-learning tracker. See `LERNREISE-SPEC.md` for the full product spec and `schema.sql` for the database.

## Setup — creating your account

There's no public signup page by design (see the spec's Auth & security section) — the one owner account is created directly in Supabase, not through the app.

1. Create a Supabase project.
2. Run `schema.sql` in the SQL editor.
3. Run `storage-setup.sql` (creates the `avatars` and `book-covers` buckets + policies).
4. Authentication → Users → **Add user** → enter your email and a password directly (no confirmation email needed this way). This creates your one `auth.users` row.
5. Copy that user's UID from the Users list.
6. Open `seed.sql`, replace the placeholder UUID at the top with your real UID, and run it. This creates your `public_profile`/`settings` rows plus the actual A1/A2 data from planning — edit the values first if anything's changed since.
7. `cp .env.example .env`, fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from Settings → API in your Supabase project.
8. `npm install && npm run dev`
9. Go to `/login` and sign in with the email/password from step 4.

## Security deployment checklist

- Apply the complete `schema.sql` in Supabase after every schema/RPC change. The token-scoped RPCs use `SECURITY DEFINER` with an explicit `search_path`; the direct access-log writer is not executable by client roles.
- Apply `storage-setup.sql` so avatar and book-cover uploads are restricted to paths beginning with the authenticated owner's UID.
- In Supabase Auth settings, enable the strongest available password policy, email rate limits, leaked-password protection, and CAPTCHA/rate limiting where available.
- Keep `VITE_SUPABASE_ANON_KEY` client-visible by design, but never expose the service-role key in Vite environment variables or browser code. The service-role key belongs only in Edge Function secrets.
- Schedule Edge Functions through Supabase Cron or another authenticated server-side scheduler. Do not expose service-role credentials to the client.
- Verify `X-Frame-Options`, CSP, HSTS, and the other response headers from `vercel.json` after deployment.

## What's real and wired up

Login (+ forgot/reset password), auth guard, Dashboard, Course, Calendar, History, Settings, Sharing, Trash, Onboarding, the public read-only Visitor view (`/shared/:token`) and Teacher view (`/teacher/:token`) — all backed by `src/lib/api.js` and the schema. Responsive: sidebar + side-panel drawers at `md:` and up, bottom nav + full-screen drawers below it. `npm run build` passes clean.

## Not yet verified end-to-end

Nothing in this project has been run in a browser or against a live Supabase project — there's no browser available in the environment it was built in. `npm run build` catches syntax/import errors, not runtime behavior. Treat the first real run as the actual test.

## The two Edge Functions — unverified, need real setup

`supabase/functions/send-class-reminders` and `send-weekly-summary` are hand-written, never deployed or run. To use them:

- `supabase functions deploy send-class-reminders` (and the other one)
- `supabase secrets set RESEND_API_KEY=... RESEND_FROM=you@yourdomain.com` (or swap in whatever email provider you'd rather use — the Resend call is the only provider-specific part)
- Schedule each on a cron (Dashboard → Edge Functions → Cron, or `pg_cron` + `net.http_post`): reminders every 10–15 minutes, the summary once a week.

## Known gaps, honestly

- The Edge Functions above are unverified.
- No automated tests exist anywhere in this project.
- Desktop layout has only been reasoned through, never visually checked in a real browser.
