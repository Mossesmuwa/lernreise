// supabase/functions/send-class-reminders/index.ts
//
// UNVERIFIED: written by hand, never run. Deno/Edge Functions aren't
// available in the environment this was built in, so this has not been
// deployed or tested against a real Supabase project or Resend account.
// Review it before relying on it.
//
// Deploy:   supabase functions deploy send-class-reminders
// Secrets:  supabase secrets set RESEND_API_KEY=... RESEND_FROM=you@yourdomain.com
// Schedule: call this on a short interval (e.g. every 10–15 minutes) via
//           Supabase's Cron Jobs (Dashboard → Edge Functions → your function
//           → Cron) or pg_cron + net.http_post. SUPABASE_URL and
//           SUPABASE_SERVICE_ROLE_KEY are provided automatically to every
//           Edge Function — no need to set them yourself.

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

Deno.serve(async () => {
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('owner_id, remind_before_minutes')
    .maybeSingle();
  if (settingsError || !settings) {
    return new Response(JSON.stringify({ error: 'no settings row found' }), { status: 200 });
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(settings.owner_id);
  if (userError || !userData?.user?.email) {
    return new Response(JSON.stringify({ error: 'could not resolve owner email' }), { status: 200 });
  }
  const ownerEmail = userData.user.email;

  const windowEnd = new Date(Date.now() + settings.remind_before_minutes * 60_000).toISOString();
  const now = new Date().toISOString();

  const { data: dueClasses, error: classesError } = await supabase
    .from('teacher_classes')
    .select('id, scheduled_at, lesson:lessons(name), teacher:teachers(name)')
    .in('status', ['scheduled', 'rescheduled'])
    .eq('reminder_sent', false)
    .is('deleted_at', null)
    .gt('scheduled_at', now)
    .lte('scheduled_at', windowEnd);

  if (classesError) {
    return new Response(JSON.stringify({ error: classesError.message }), { status: 500 });
  }

  let sent = 0;
  for (const klass of dueClasses ?? []) {
    const when = new Date(klass.scheduled_at).toLocaleString();
    try {
      await sendEmail(
        ownerEmail,
        `German class in ${settings.remind_before_minutes} minutes`,
        `<p>${klass.lesson?.name ?? 'Your class'} with ${klass.teacher?.name ?? 'your teacher'} is at ${when}.</p>`
      );
      await supabase.from('teacher_classes').update({ reminder_sent: true }).eq('id', klass.id);
      sent += 1;
    } catch (err) {
      console.error('Failed to send reminder for', klass.id, err);
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
