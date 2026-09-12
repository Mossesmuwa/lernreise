-- Apply this migration to an existing Lernreise Supabase project.
-- For a fresh project, schema.sql already contains these changes.

create extension if not exists pgcrypto;

alter table share_links add column if not exists claimed_by uuid references auth.users(id) on delete set null;
alter table share_links add column if not exists claimed_at timestamptz;
alter table share_links add column if not exists last_ip_hash text;

create or replace function claim_share_link(p_token text)
returns table (share_link_id uuid, role text, expires_at timestamptz)
language plpgsql security definer
set search_path = public
as $$
declare
  v_share share_links%rowtype;
  v_ip text;
begin
  if auth.uid() is null then return; end if;

  select * into v_share from share_links
    where token = p_token and revoked = false
      and (expires_at is null or expires_at > now());
  if v_share.id is null or (v_share.claimed_by is not null and v_share.claimed_by <> auth.uid()) then
    return;
  end if;

  v_ip := coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    ''
  );

  update share_links
    set claimed_by = coalesce(claimed_by, auth.uid()),
        claimed_at = coalesce(claimed_at, now()),
        last_ip_hash = encode(digest(v_ip || ':' || p_token, 'sha256'), 'hex')
    where id = v_share.id
      and (claimed_by is null or claimed_by = auth.uid());

  if not found then return; end if;

  return query select share_links.id, share_links.role, share_links.expires_at
    from share_links where id = v_share.id;
end;
$$;

create or replace function validate_share_token(p_token text)
returns table (share_link_id uuid, owner_id uuid, role text, teacher_id uuid, expires_at timestamptz)
language sql security definer
set search_path = public
as $$
  select id, owner_id, role, teacher_id, expires_at
  from share_links
  where token = p_token and revoked = false
    and (expires_at is null or expires_at > now())
    and (claimed_by is null or claimed_by = auth.uid());
$$;

create or replace function get_shared_dashboard(p_token text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_share record; v_owner uuid; v_result jsonb;
begin
  select * into v_share from share_links
    where token = p_token and revoked = false
      and (expires_at is null or expires_at > now())
      and claimed_by = auth.uid();
  if v_share is null or v_share.role <> 'viewer' then return null; end if;
  v_owner := v_share.owner_id;
  select jsonb_build_object(
    'levels', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status) order by l.sort_order), '[]'::jsonb) from levels l where l.owner_id = v_owner),
    'current_course', (select jsonb_build_object('title', c.title, 'cover_image_url', c.cover_image_url) from courses c where c.owner_id = v_owner and c.status = 'current' limit 1),
    'upcoming_classes', (select coalesce(jsonb_agg(jsonb_build_object('scheduled_at', tc.scheduled_at, 'status', tc.status, 'lesson_name', l.name) order by tc.scheduled_at), '[]'::jsonb) from teacher_classes tc join lessons l on l.id = tc.lesson_id where tc.owner_id = v_owner and tc.scheduled_at > now() and tc.deleted_at is null limit 5),
    'week_minutes', (select coalesce(sum(duration_minutes), 0) from study_sessions where owner_id = v_owner and session_date >= date_trunc('week', now()) and deleted_at is null),
    'total_minutes', (select coalesce(sum(duration_minutes), 0) from study_sessions where owner_id = v_owner and deleted_at is null)
  ) into v_result;
  perform record_share_access(v_share.id);
  return v_result;
end;
$$;

create or replace function get_teacher_classes(p_token text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_share record; v_result jsonb;
begin
  select * into v_share from share_links where token = p_token and revoked = false and (expires_at is null or expires_at > now()) and claimed_by = auth.uid();
  if v_share is null or v_share.role <> 'teacher_editor' then return null; end if;
  perform record_share_access(v_share.id);
  select coalesce(jsonb_agg(jsonb_build_object('id', tc.id, 'scheduled_at', tc.scheduled_at, 'status', tc.status, 'lesson_name', l.name) order by tc.scheduled_at), '[]'::jsonb) into v_result
  from teacher_classes tc join lessons l on l.id = tc.lesson_id
  where tc.owner_id = v_share.owner_id and tc.teacher_id = v_share.teacher_id and tc.deleted_at is null;
  return v_result;
end;
$$;

create or replace function teacher_reschedule_class(p_token text, p_class_id uuid, p_new_scheduled_at timestamptz)
returns boolean language plpgsql security definer set search_path = public
as $$
declare v_share record; v_old timestamptz;
begin
  select * into v_share from share_links where token = p_token and revoked = false and (expires_at is null or expires_at > now()) and claimed_by = auth.uid();
  if v_share is null or v_share.role <> 'teacher_editor' then return false; end if;
  select scheduled_at into v_old from teacher_classes where id = p_class_id and owner_id = v_share.owner_id and teacher_id = v_share.teacher_id;
  if v_old is null then return false; end if;
  update teacher_classes set scheduled_at = p_new_scheduled_at, original_scheduled_at = v_old, status = 'rescheduled' where id = p_class_id;
  return true;
end;
$$;

create or replace function teacher_complete_class(p_token text, p_class_id uuid, p_duration_minutes int)
returns boolean language plpgsql security definer set search_path = public
as $$
declare v_share record;
begin
  select * into v_share from share_links where token = p_token and revoked = false and (expires_at is null or expires_at > now()) and claimed_by = auth.uid();
  if v_share is null or v_share.role <> 'teacher_editor' then return false; end if;
  if p_duration_minutes is not null and (p_duration_minutes < 1 or p_duration_minutes > 1440) then return false; end if;
  update teacher_classes set status = 'completed', duration_minutes = p_duration_minutes where id = p_class_id and owner_id = v_share.owner_id and teacher_id = v_share.teacher_id;
  return found;
end;
$$;

revoke execute on function record_share_access(uuid) from public, anon, authenticated;
revoke execute on function claim_share_link(text) from public;
grant execute on function claim_share_link(text) to anon, authenticated;
