-- Run in the Supabase SQL editor, AFTER schema.sql and storage-setup.sql,
-- and AFTER creating your one user in Authentication → Users.
--
-- 1. Copy that user's UID from the Users list.
-- 2. Paste it in place of the placeholder below.
-- 3. Run this whole script once.
--
-- This seeds exactly what was planned in conversation: A1 at the
-- Goethe-Institut (completed) and A2 with Momente A2 Kursbuch (current),
-- Lektion 7 in progress. Edit any values below before running if anything
-- has changed since.

do $$
declare
  v_owner uuid := 'REPLACE-WITH-YOUR-AUTH-USER-UUID';
  v_language_id uuid;
  v_level_a1 uuid;
  v_level_a2 uuid;
  v_institution_id uuid;
  v_course_a2 uuid;
  v_module1 uuid;
  v_module2 uuid;
  v_module3 uuid;
  v_module4 uuid;
begin
  insert into public_profile (id, owner_id, display_name)
    values (true, v_owner, 'MM')
    on conflict (id) do update set owner_id = excluded.owner_id, display_name = excluded.display_name;

  insert into settings (owner_id) values (v_owner)
    on conflict (owner_id) do nothing;

  insert into languages (owner_id, name, code, sort_order)
    values (v_owner, 'German', 'de', 1)
    returning id into v_language_id;

  insert into levels (owner_id, language_id, name, sort_order, status)
    values (v_owner, v_language_id, 'A1', 1, 'completed') returning id into v_level_a1;
  insert into levels (owner_id, language_id, name, sort_order, status)
    values (v_owner, v_language_id, 'A2', 2, 'current') returning id into v_level_a2;
  insert into levels (owner_id, language_id, name, sort_order, status)
    values (v_owner, v_language_id, 'B1', 3, 'not_started');
  insert into levels (owner_id, language_id, name, sort_order, status)
    values (v_owner, v_language_id, 'B2', 4, 'not_started');

  insert into institutions (owner_id, name)
    values (v_owner, 'Goethe-Institut') returning id into v_institution_id;

  insert into teachers (owner_id, institution_id, name)
    values (v_owner, v_institution_id, 'Frau Nora');
  insert into teachers (owner_id, institution_id, name)
    values (v_owner, v_institution_id, 'Frau Jane');
  insert into teachers (owner_id, name)
    values (v_owner, 'Frau Cathy');

  insert into courses (owner_id, level_id, institution_id, title, status, start_date, end_date)
    values (v_owner, v_level_a1, v_institution_id, 'Goethe-Institut A1', 'completed', '2026-07-13', '2026-09-02');

  insert into courses (owner_id, level_id, title, status, start_date, estimated_end_date, cover_image_url, isbn, publisher_url)
    values (v_owner, v_level_a2, 'Momente A2 Kursbuch', 'current', '2026-09-07', '2026-11-07', 'https://shop.hueber.de/media/catalog/product/cache/b86d527f2b20d32aba03f0618086efa3/9/7/9783196017922_1.jpg', '978-3-19-601792-2', 'https://shop.hueber.de/de/e-momente-a2-kursbuch-iv-978-3-19-601792-2.html')
    returning id into v_course_a2;

  insert into modules (owner_id, course_id, name, sort_order) values (v_owner, v_course_a2, 'Module 1', 1) returning id into v_module1;
  insert into modules (owner_id, course_id, name, sort_order) values (v_owner, v_course_a2, 'Module 2', 2) returning id into v_module2;
  insert into modules (owner_id, course_id, name, sort_order) values (v_owner, v_course_a2, 'Module 3', 3) returning id into v_module3;
  insert into modules (owner_id, course_id, name, sort_order) values (v_owner, v_course_a2, 'Module 4', 4) returning id into v_module4;

  insert into lessons (owner_id, module_id, name, sort_order, status) values
    (v_owner, v_module1, 'Lektion 1', 1, 'completed'),
    (v_owner, v_module1, 'Lektion 2', 2, 'completed'),
    (v_owner, v_module1, 'Lektion 3', 3, 'completed'),
    (v_owner, v_module2, 'Lektion 4', 1, 'completed'),
    (v_owner, v_module2, 'Lektion 5', 2, 'completed'),
    (v_owner, v_module2, 'Lektion 6', 3, 'completed'),
    (v_owner, v_module3, 'Lektion 7', 1, 'in_progress'),
    (v_owner, v_module3, 'Lektion 8', 2, 'not_started'),
    (v_owner, v_module3, 'Lektion 9', 3, 'not_started'),
    (v_owner, v_module4, 'Lektion 10', 1, 'not_started'),
    (v_owner, v_module4, 'Lektion 11', 2, 'not_started'),
    (v_owner, v_module4, 'Lektion 12', 3, 'not_started');
end $$;
