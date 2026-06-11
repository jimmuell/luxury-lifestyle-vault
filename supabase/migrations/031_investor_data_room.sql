-- 031_investor_data_room.sql
-- Investor Data Room: NDA gate flag, document metadata, acknowledgment log,
-- view/download audit, RLS policies, and private storage bucket.

-- ── 1. NDA gate flag on profiles ─────────────────────────────────────────────

alter table public.profiles
  add column if not exists nda_acknowledged boolean not null default false;

-- ── 2. Tables ─────────────────────────────────────────────────────────────────

-- Document metadata (files live in storage bucket 'investor-room')
create table public.investor_documents (
  id              uuid primary key default gen_random_uuid(),
  section         text not null,
  title           text not null,
  description     text,
  storage_path    text not null,
  file_type       text not null default 'pdf',
  file_size_bytes bigint,
  sort_order      integer not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index investor_documents_section_idx on public.investor_documents (section, sort_order);
create trigger investor_documents_updated_at
  before update on public.investor_documents
  for each row execute function public.handle_updated_at();

-- NDA acknowledgment log (one row per investor per NDA version)
create table public.investor_nda_acknowledgments (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  nda_version     text not null default 'v1',
  full_name       text not null,
  acknowledged_at timestamptz not null default now(),
  ip_address      text,
  user_agent      text,
  unique (profile_id, nda_version)
);

-- View / download audit log
create table public.investor_document_views (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  document_id uuid not null references public.investor_documents(id) on delete cascade,
  view_type   text not null default 'view',
  viewed_at   timestamptz not null default now()
);
create index investor_document_views_profile_idx  on public.investor_document_views (profile_id,  viewed_at desc);
create index investor_document_views_document_idx on public.investor_document_views (document_id, viewed_at desc);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

alter table public.investor_documents          enable row level security;
alter table public.investor_nda_acknowledgments enable row level security;
alter table public.investor_document_views     enable row level security;

-- investor_documents
create policy "investor_documents_select_investor"
  on public.investor_documents for select
  using (public.get_my_role() = 'investor' and is_published);

create policy "investor_documents_all_admin"
  on public.investor_documents for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- investor_nda_acknowledgments
create policy "investor_nda_select_own"
  on public.investor_nda_acknowledgments for select
  using (profile_id = auth.uid());

create policy "investor_nda_insert_own"
  on public.investor_nda_acknowledgments for insert
  with check (profile_id = auth.uid() and public.get_my_role() = 'investor');

create policy "investor_nda_select_admin"
  on public.investor_nda_acknowledgments for select
  using (public.get_my_role() = 'admin');

-- investor_document_views
create policy "investor_views_insert_own"
  on public.investor_document_views for insert
  with check (profile_id = auth.uid() and public.get_my_role() = 'investor');

create policy "investor_views_select_admin"
  on public.investor_document_views for select
  using (public.get_my_role() = 'admin');

-- ── 4. Storage bucket ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('investor-room', 'investor-room', false)
on conflict (id) do nothing;

-- Admin-only direct access; investors receive signed URLs from the service role.
create policy "investor_room_admin_all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'investor-room'
    and public.get_my_role() = 'admin'
  );
