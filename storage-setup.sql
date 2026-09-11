-- Run in the Supabase SQL editor after schema.sql.
-- Creates the two storage buckets referenced by the app (avatar photo,
-- book cover photo) and restricts writes to the owner while allowing
-- public read (needed since the login screen and visitor view show
-- these images before/without authentication).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "owner_can_upload_avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "owner_can_update_avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() is not null);
create policy "anyone_can_read_avatar" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "owner_can_upload_cover" on storage.objects
  for insert with check (bucket_id = 'book-covers' and auth.uid() is not null);
create policy "owner_can_update_cover" on storage.objects
  for update using (bucket_id = 'book-covers' and auth.uid() is not null);
create policy "anyone_can_read_cover" on storage.objects
  for select using (bucket_id = 'book-covers');
