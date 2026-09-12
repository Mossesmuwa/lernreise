-- Apply this migration to an existing Lernreise database.
-- It adds official public metadata for the Momente A2 Kursbuch and fills the
-- four-module / twelve-lesson tracking structure without copying book text.

alter table courses add column if not exists isbn text;
alter table courses add column if not exists publisher_url text;

update courses
set cover_image_url = 'https://shop.hueber.de/media/catalog/product/cache/b86d527f2b20d32aba03f0618086efa3/9/7/9783196017922_1.jpg',
    isbn = '978-3-19-601792-2',
    publisher_url = 'https://shop.hueber.de/de/e-momente-a2-kursbuch-iv-978-3-19-601792-2.html'
where status = 'current'
  and lower(title) like '%momente%a2%';

do $$
declare
  v_course_id uuid;
  v_module_id uuid;
  v_module_index int;
  v_lesson_index int;
begin
  select id into v_course_id
  from courses
  where status = 'current' and lower(title) like '%momente%a2%'
  order by created_at desc
  limit 1;

  if v_course_id is null then
    return;
  end if;

  for v_module_index in 1..4 loop
    select id into v_module_id
    from modules
    where course_id = v_course_id and sort_order = v_module_index
    limit 1;

    if v_module_id is null then
      insert into modules (course_id, name, sort_order)
      values (v_course_id, 'Module ' || v_module_index, v_module_index)
      returning id into v_module_id;
    end if;

    for v_lesson_index in 1..3 loop
      insert into lessons (module_id, name, sort_order, status)
      select v_module_id,
             'Lektion ' || ((v_module_index - 1) * 3 + v_lesson_index),
             v_lesson_index,
             'not_started'
      where not exists (
        select 1 from lessons
        where module_id = v_module_id and sort_order = v_lesson_index
      );
    end loop;
  end loop;
end $$;
