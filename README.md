# Lernreise

Lernreise is a private personal German-learning tracker and one of my main projects for learning software development, product design, and application security.

It helps me connect three parts of a long-term learning journey:

- **Course:** German levels, courses, modules, and lessons
- **Study time:** timed or manually recorded study sessions
- **Schedule:** teacher classes, changes, completion, and reminders

The journey is organized from A1 through A2, B1, and B2, while the data model is prepared for adding another language later.

## Private Project

This is not a public service or an open registration application. The repository is visible so people can understand the project and its implementation, but the application itself is private.

There is one owner account. There is no public sign-up page.

### Requesting Access

To request access, contact the repository owner through the account or contact details associated with this repository. Please include:

- Your name
- Why you would like to view the project
- Whether you need read-only access or another specific purpose

Access is granted at the owner's discretion. Do not attempt to bypass the login, share-link, or access-code controls.

### Viewing Mode

The owner can create a time-limited read-only sharing link or access code. A viewer can see selected learning progress without receiving access to the owner's account or editing permissions.

Shared links are designed to be claimed by one authenticated Supabase session. The first session that claims a link becomes the session allowed to use it. Links can expire or be revoked by the owner.

The teacher view is separate and intentionally limited to the linked teacher's classes. It does not expose the owner's account, study history, or settings.

## What the App Includes

- Private email/password owner login
- Forgot-password and password-reset flows
- German learning journey from level to lesson
- Course progress and lesson status
- Timer-based and manual study recording
- Teacher class scheduling and rescheduling
- Calendar week navigation
- Study history with search, filters, and time ranges
- Streak and study-time summaries
- CSV export
- Profile photo and display name
- Light/dark appearance settings
- German/English interface settings
- Class reminders and weekly summary function scaffolding
- Read-only viewer links
- Teacher-scoped scheduling links
- Trash and restoration for deleted sessions/classes

## Technology

- React and Vite
- React Router
- Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, Storage, and RPC functions
- Vercel deployment configuration
- Supabase Edge Functions for email reminders and weekly summaries

## Local Development

This project requires a Supabase project for authentication and data.

1. Create a Supabase project.
2. Run `schema.sql` in the Supabase SQL editor.
3. Run `storage-setup.sql` for avatar and book-cover storage.
4. Create the private owner account in Supabase Authentication.
5. Copy the owner UID into `seed.sql`, edit the seed values, and run it if you want sample journey data.
6. If the Supabase project already existed before the share-link security upgrade, run `supabase/migrations/20260912_share_link_claims.sql` after the original schema.
7. Create `.env` from `.env.example` and set:

   ```text
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

8. Enable anonymous sign-ins in Supabase Auth. This is required for the one-session read-only sharing flow.
9. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

10. Open `/login` for the owner application or `/welcome` for the access selection screen.

Never put the Supabase service-role key in `.env` variables exposed to Vite or in browser code.

## Security Notes

The app uses Supabase Row Level Security for owner data. Shared access is served through narrowly scoped database functions rather than exposing owner tables directly to visitors.

The current security model includes:

- Owner-only RLS policies for private application tables
- Token and expiry validation for shared links
- One-session share-link claiming
- Hashed request-IP metadata for additional monitoring
- Revocable viewer and teacher links
- Teacher RPCs scoped to the linked teacher
- Restricted storage upload paths based on the authenticated owner UID
- Password reset confirmation and minimum password length
- Deployment security headers in `vercel.json`

IP addresses are not used as the primary identity mechanism because they can change, be shared by multiple people, or be hidden by a proxy. The authenticated Supabase session is the primary control.

Before production use, configure Supabase Auth rate limits, CAPTCHA where appropriate, leaked-password protection, backups, and email settings. Apply updated SQL files to the live project; changing a local SQL file does not change an existing database automatically.

## Project Status

The application is actively being developed. The production build currently passes with:

```bash
npm run build
```

Browser testing, live Supabase testing, Edge Function deployment, and automated tests still need to be completed against a real environment.

## License and Permission

This is a private, source-available project. Viewing the repository does not grant permission to use, copy, modify, redistribute, deploy, or commercially exploit the software.

See [LICENSE](LICENSE) for the full terms. Requests for permission should be sent to the repository owner.
