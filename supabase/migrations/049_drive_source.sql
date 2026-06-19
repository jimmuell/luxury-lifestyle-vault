-- 049_drive_source.sql
-- Phase 1: add Drive source tracking + PDF metadata to documents.
-- source_type marks whether this doc was manually uploaded or linked to Drive.
-- google_* fields are populated when source_type='google_drive'.
-- pdf_sha256, file_size_bytes, page_count are computed on upload.

alter table public.documents
  add column if not exists source_type       text        not null default 'manual_upload'
    check (source_type in ('manual_upload', 'google_drive')),
  add column if not exists google_file_id    text,
  add column if not exists google_web_view_link text,
  add column if not exists google_modified_time timestamptz,
  add column if not exists google_md5_checksum  text,
  add column if not exists sync_status       text        not null default 'manual_only'
    check (sync_status in ('manual_only', 'synced', 'changed', 'syncing', 'failed')),
  add column if not exists last_synced_at    timestamptz,
  add column if not exists last_checked_at   timestamptz,
  add column if not exists last_sync_error   text,
  add column if not exists pdf_sha256        text,
  add column if not exists file_size_bytes   bigint,
  add column if not exists page_count        int;

create index if not exists documents_source_type_file_id_idx
  on public.documents (source_type, google_file_id)
  where google_file_id is not null;

create index if not exists documents_sync_status_idx
  on public.documents (sync_status);
