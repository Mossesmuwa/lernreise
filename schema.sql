-- Lernreise (German Learning Tracker) — schema
-- Postgres / Supabase. Single-owner app: every row belongs to the one
-- authenticated user via owner_id, defaulted to auth.uid() at insert time.

create extension if not exists pgcrypto;

-- ---------- Core hierarchy ----------

create table languages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  code text not null,
  status text not null default 'active' check (status in ('active','paused')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table levels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  language_id uuid not null references languages(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  status text not null default 'not_started' check (status in ('not_started','current','completed')),
  created_at timestamptz not null default now()
);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table teachers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  institution_id uuid references institutions(id) on delete set null,
  name text not null,
  contact text,
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  level_id uuid not null references levels(id) on delete cascade,
  institution_id uuid references institutions(id) on delete set null,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started','current','completed')),
  start_date date,
  end_date date,
  estimated_end_date date,
  cover_image_url text, -- owner-uploaded photo of the book; null shows a generic placeholder
  created_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  module_id uuid not null references modules(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  started_at date,
  completed_at date,
  deleted_at timestamptz
);

-- ---------- Activity ----------

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  session_date date not null,
  duration_minutes int not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table teacher_classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete restrict,
  scheduled_at timestamptz not null,
  original_scheduled_at timestamptz,
  mode text check (mode in ('physical','online')),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','rescheduled')),
  duration_minutes int,
  notes text,
  remind_before_minutes int,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table active_timer (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid() unique,
  lesson_id uuid references lessons(id) on delete cascade,
  started_at timestamptz
);

-- ---------- Preferences ----------

create table settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid() unique,
  ui_language text not null default 'de' check (ui_language in ('de','en')),
  theme text not null default 'light' check (theme in ('light','dark')),
  remind_before_minutes int not null default 60,
  weekly_summary_enabled boolean not null default true
);

-- A single public-readable row, separate from settings: the login screen
-- needs to show your name/photo *before* you're authenticated, and RLS on
-- settings would otherwise hide them until after sign-in. Only this one
-- row is ever anon-readable; everything else in the schema stays private.
create table public_profile (
  id boolean primary key default true,
  owner_id uuid not null references auth.users(id) default auth.uid(),
  display_name text,
  avatar_url text,
  constraint public_profile_singleton check (id = true)
);

-- Storage: two Supabase Storage buckets are needed alongside this schema —
-- "avatars" and "book-covers" — each with a policy restricting writes to
-- the authenticated owner and allowing public (or signed) read access so
-- the images can render on the login screen and visitor/teacher views.

-- ---------- Sharing ----------

create table share_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  role text not null default 'viewer' check (role in ('viewer','teacher_editor')),
  teacher_id uuid references teachers(id) on delete cascade, -- required when role = teacher_editor
  token text not null unique,
  code text unique,
  label text,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint teacher_editor_requires_teacher check (role <> 'teacher_editor' or teacher_id is not null)
);

create table share_access_log (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references share_links(id) on delete cascade,
  accessed_at timestamptz not null default now()
);

-- ---------- Row Level Security (owner-only) ----------

alter table languages enable row level security;
alter table levels enable row level security;
alter table institutions enable row level security;
alter table teachers enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table study_sessions enable row level security;
alter table teacher_classes enable row level security;
alter table active_timer enable row level security;
alter table settings enable row level security;
alter table public_profile enable row level security;
alter table share_links enable row level security;
alter table share_access_log enable row level security;

create policy "owner_full_access" on languages for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on levels for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on institutions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on teachers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on courses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on modules for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on lessons for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on study_sessions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on teacher_classes for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on active_timer for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_full_access" on settings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_can_write" on public_profile for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "anyone_can_read" on public_profile for select using (true);
create policy "owner_full_access" on share_links for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_can_view_access_log" on share_access_log for select using (
  exists (select 1 from share_links sl where sl.id = share_access_log.share_link_id and sl.owner_id = auth.uid())
);

-- ---------- Visitor access (no login) ----------
-- A visitor never authenticates, so RLS above does not apply to them.
-- Instead, a SECURITY DEFINER function validates their token/code and
-- returns just enough to know what they're allowed to see or touch.
-- The app then uses further SECURITY DEFINER functions, scoped by the
-- returned role/teacher_id, to serve read-only data (viewer) or allow
-- writes limited to that teacher's own teacher_classes (teacher_editor).

-- Resolves a typed access code to its token + role, so a visitor who
-- received a code instead of a link has somewhere to actually use it.
create or replace function resolve_share_code(p_code text)
returns table (token text, role text)
language sql security definer
as $$
  select token, role from share_links
  where code = p_code and revoked = false and (expires_at is null or expires_at > now());
$$;

create or replace function validate_share_token(p_token text)
returns table (share_link_id uuid, owner_id uuid, role text, teacher_id uuid, expires_at timestamptz)
language sql security definer
as $$
  select id, owner_id, role, teacher_id, expires_at
  from share_links
  where token = p_token
    and revoked = false
    and (expires_at is null or expires_at > now());
$$;

-- Call this once per visitor open to populate share_access_log / last_accessed.
create or replace function record_share_access(p_share_link_id uuid)
returns void
language sql security definer
as $$
  insert into share_access_log (share_link_id) values (p_share_link_id);
$$;

-- A viewer link's read-only data. Anon can never query levels/courses/etc.
-- directly (RLS blocks it, since they have no auth.uid()), so this single
-- function does the owner lookup + the read in one security-definer call.
create or replace function get_shared_dashboard(p_token text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_share record;
  v_owner uuid;
  v_result jsonb;
begin
  select * into v_share from share_links
    where token = p_token and revoked = false and (expires_at is null or expires_at > now());
  if v_share is null or v_share.role <> 'viewer' then
    return null;
  end if;
  v_owner := v_share.owner_id;

  select jsonb_build_object(
    'levels', (
      select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status) order by l.sort_order), '[]'::jsonb)
      from levels l where l.owner_id = v_owner
    ),
    'current_course', (
      select jsonb_build_object('title', c.title, 'cover_image_url', c.cover_image_url)
      from courses c where c.owner_id = v_owner and c.status = 'current' limit 1
    ),
    'upcoming_classes', (
      select coalesce(jsonb_agg(jsonb_build_object('scheduled_at', tc.scheduled_at, 'status', tc.status, 'lesson_name', l.name) order by tc.scheduled_at), '[]'::jsonb)
      from teacher_classes tc join lessons l on l.id = tc.lesson_id
      where tc.owner_id = v_owner and tc.scheduled_at > now() and tc.deleted_at is null
      limit 5
    ),
    'week_minutes', (
      select coalesce(sum(duration_minutes), 0) from study_sessions
      where owner_id = v_owner and session_date >= date_trunc('week', now()) and deleted_at is null
    ),
    'total_minutes', (
      select coalesce(sum(duration_minutes), 0) from study_sessions
      where owner_id = v_owner and deleted_at is null
    )
  ) into v_result;

  perform record_share_access(v_share.id);
  return v_result;
end;
$$;

-- A teacher_editor link's own classes only — never the owner's study
-- sessions, other teachers' classes, or anything else.
create or replace function get_teacher_classes(p_token text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_share record;
  v_result jsonb;
begin
  select * into v_share from share_links
    where token = p_token and revoked = false and (expires_at is null or expires_at > now());
  if v_share is null or v_share.role <> 'teacher_editor' then
    return null;
  end if;

  perform record_share_access(v_share.id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', tc.id, 'scheduled_at', tc.scheduled_at, 'status', tc.status, 'lesson_name', l.name
  ) order by tc.scheduled_at), '[]'::jsonb) into v_result
  from teacher_classes tc join lessons l on l.id = tc.lesson_id
  where tc.owner_id = v_share.owner_id and tc.teacher_id = v_share.teacher_id and tc.deleted_at is null;

  return v_result;
end;
$$;

-- The only write a teacher_editor link can ever make: reschedule one of
-- their own classes. Scoped to owner_id + teacher_id so a link for Frau
-- Cathy can never touch Frau Nora's classes, let alone anything else.
create or replace function teacher_reschedule_class(p_token text, p_class_id uuid, p_new_scheduled_at timestamptz)
returns boolean
language plpgsql security definer
as $$
declare
  v_share record;
  v_old timestamptz;
begin
  select * into v_share from share_links
    where token = p_token and revoked = false and (expires_at is null or expires_at > now());
  if v_share is null or v_share.role <> 'teacher_editor' then
    return false;
  end if;

  select scheduled_at into v_old from teacher_classes
    where id = p_class_id and owner_id = v_share.owner_id and teacher_id = v_share.teacher_id;
  if v_old is null then
    return false;
  end if;

  update teacher_classes
    set scheduled_at = p_new_scheduled_at, original_scheduled_at = v_old, status = 'rescheduled'
    where id = p_class_id;

  return true;
end;
$$;