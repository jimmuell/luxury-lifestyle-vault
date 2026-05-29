insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-photos',
  'item-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "item_photos_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_photos_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_photos_admin_all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'item-photos'
    and public.get_my_role() = 'admin'
  );

create policy "avatars_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');
