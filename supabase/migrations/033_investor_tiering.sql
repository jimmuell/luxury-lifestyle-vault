-- 033_investor_tiering.sql
-- Audience tiering for the investor data room:
-- - investor_tier on profiles (prospect / board)
-- - audience + doc_type columns on investor_documents
-- - get_my_tier() security-definer helper (mirrors get_my_role())
-- - Updated RLS so prospects only see prospect-audience docs

-- ── 1. profiles: investor_tier ────────────────────────────────────────────────

alter table public.profiles
  add column if not exists investor_tier text not null default 'prospect'
    check (investor_tier in ('prospect', 'board'));

-- ── 2. investor_documents: audience + doc_type ────────────────────────────────

alter table public.investor_documents
  add column if not exists audience text not null default 'board'
    check (audience in ('prospect', 'board'));

alter table public.investor_documents
  add column if not exists doc_type text not null default 'document'
    check (doc_type in ('document', 'presentation'));

-- ── 3. Composite index for filtered listing queries ───────────────────────────

create index if not exists investor_documents_type_audience_order_idx
  on public.investor_documents (doc_type, audience, sort_order);

-- ── 4. get_my_tier() — mirrors get_my_role() ─────────────────────────────────

create or replace function public.get_my_tier()
returns text
language sql security definer stable
as $$
  select investor_tier from public.profiles where id = auth.uid();
$$;

-- ── 5. RLS: replace investor select policy with tier-aware version ─────────────

drop policy if exists "investor_documents_select_investor" on public.investor_documents;

create policy "investor_documents_select_investor"
  on public.investor_documents for select
  using (
    public.get_my_role() = 'investor'
    and is_published = true
    and (audience = 'prospect' or public.get_my_tier() = 'board')
  );
