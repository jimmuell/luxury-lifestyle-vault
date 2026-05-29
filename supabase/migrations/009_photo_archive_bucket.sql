-- DI-4: Photo storage strategy — Supabase Storage only (Chat ruling, May 2026).
-- Active photos stay in `item-photos`. Historical / archived photos move to
-- `item-photos-archive`. Both are private; signed URLs required for access.
-- The storage service abstraction in src/lib/storage/server.ts exposes moveToArchive()
-- so a future cold-archival tier (R2, Glacier) is a swap in that file, not a rewrite.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-photos-archive',
  'item-photos-archive',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Archive bucket: admins can read/write; clients can only read their own archived photos
create policy "archive_photos_admin_all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'item-photos-archive'
    and public.get_my_role() = 'admin'
  );

create policy "archive_photos_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'item-photos-archive'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
