-- ── §A: Data Room Provenance + Reconcile Log ─────────────────────────────────

-- A1. Provenance columns on investor_documents
alter table public.investor_documents
  add column if not exists source_system      text,
  add column if not exists source_ref         text,
  add column if not exists source_name        text,
  add column if not exists source_version     text,
  add column if not exists source_revised_at  date,
  add column if not exists content_sha256     text,
  add column if not exists published_at       timestamptz,
  add column if not exists published_by       text,
  add column if not exists last_reconciled_at timestamptz,
  add column if not exists content_status     text not null default 'unverified';

alter table public.investor_documents
  drop constraint if exists investor_documents_content_status_check;
alter table public.investor_documents
  add constraint investor_documents_content_status_check
    check (content_status in ('current', 'stale', 'source_missing', 'unverified'));

create index if not exists investor_documents_content_status_idx
  on public.investor_documents (content_status);

-- A2. Reconcile log (admin-only; investors never read this table)
create table public.data_room_reconcile_log (
  id           uuid        primary key default gen_random_uuid(),
  run_at       timestamptz not null default now(),
  document_id  uuid        references public.investor_documents(id) on delete set null,
  storage_path text,
  prev_status  text,
  new_status   text,
  drift        boolean     not null default false,
  detail       text
);

alter table public.data_room_reconcile_log enable row level security;

create policy "data_room_reconcile_log_all_admin"
  on public.data_room_reconcile_log for all
  using  (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');
