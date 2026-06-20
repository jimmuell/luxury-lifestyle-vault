-- 051_sync_enabled.sql
-- Per-document flag: exclude from cron + Sync-all when false (e.g. table-border fix pending).
-- Default true — existing Drive-linked docs remain in rotation.

alter table public.documents
  add column if not exists sync_enabled boolean not null default true;
