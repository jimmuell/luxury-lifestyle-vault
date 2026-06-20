-- 050_phase2_drive_sync.sql
-- Phase 2: per-document strip preference + sync audit tables.

-- Persist control-page strip preference per document.
-- Default true (house .docx docs); set false on external PDFs + deck manually.
alter table public.documents
  add column if not exists strip_first_page boolean not null default true;

-- One row per sync run (cron or manual).
create table if not exists public.document_sync_runs (
  id           uuid primary key default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  trigger      text not null check (trigger in ('cron', 'manual', 'manual_all')),
  docs_checked int not null default 0,
  docs_synced  int not null default 0,
  docs_failed  int not null default 0,
  error        text
);

-- One row per document per run.
create table if not exists public.document_sync_events (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references public.document_sync_runs (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  result      text not null check (result in ('unchanged', 'synced', 'failed')),
  bytes       int,
  pages       int,
  message     text,
  created_at  timestamptz not null default now()
);

create index if not exists document_sync_events_doc_created_idx
  on public.document_sync_events (document_id, created_at desc);

create index if not exists document_sync_events_run_idx
  on public.document_sync_events (run_id);
