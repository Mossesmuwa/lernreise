// supabase/functions/send-weekly-summary/index.ts
//
// UNVERIFIED — same caveat as send-class-reminders: hand-written, never
// run against a real project. Review before relying on it.
//
// Deploy:   supabase functions deploy send-weekly-summary
// Secrets:  same as send-class-reminders (RESEND_API_KEY, RESEND_FROM)
// Schedule: once a week, e.g. Sunday evening, via Supabase Cron Jobs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: Deno.env.get('RESEND_FROM'), to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`);
}

function startOfWeek(offsetWeeks: number) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

Deno.serve(async () => {
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('owner_id, weekly_summary_enabled')
    .maybeSingle();
  if (settingsError || !settings || !settings.weekly_summary_enabled) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(settings.owner_id);
  if (userError || !userData?.user?.email) {
    return new Response(JSON.stringify({ error: 'could not resolve owner email' }), { status: 200 });
  }

  const thisWeekStart = startOfWeek(0).toISOString().slice(0, 10);
  const lastWeekStart = startOfWeek(-1).toISOString().slice(0, 10);

  const [{ data: thisWeek }, { data: lastWeek }] = await Promise.all([
    supabase.from('study_sessions').select('duration_minutes').gte('session_date', thisWeekStart).is('deleted_at', null),
    supabase
      .from('study_sessions')
      .select('duration_minutes')
      .gte('session_date', lastWeekStart)
      .lt('session_date', thisWeekStart)
      .is('deleted_at', null),
  ]);

  const sum = (rows: { duration_minutes: number }[] | null) => (rows ?? []).reduce((a, r) => a + r.duration_minutes, 0);
  const thisMin = sum(thisWeek);
  const lastMin = sum(lastWeek);
  const fmt = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

  await sendEmail(
    userData.user.email,
    'Your week in German',
    `<p>${fmt(thisMin)} this week, vs ${fmt(lastMin)} last week.</p>`
  );

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});
