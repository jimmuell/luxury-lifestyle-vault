-- 035_investor_faq.sql
-- Adds the investor_faq table for FAQ entries visible in the investor portal.
-- Audience tiers mirror the investor_documents model: prospect, investor, board.
-- Investors see published entries where their tier rank >= the entry's audience rank.
-- Admins have full CRUD access.

-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table public.investor_faq (
  id          uuid        primary key default gen_random_uuid(),
  question    text        not null,
  answer      text        not null,
  sort_order  integer     not null default 0,
  audience    text        not null default 'prospect'
                          check (audience in ('prospect', 'investor', 'board')),
  is_published boolean    not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 2. Index ──────────────────────────────────────────────────────────────────

create index investor_faq_audience_sort_idx
  on public.investor_faq (audience, sort_order)
  where is_published = true;

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

alter table public.investor_faq enable row level security;

-- Investors (and admin viewing as investor) select published entries at or below their tier
create policy "investor_faq_select_investor"
  on public.investor_faq for select
  using (
    public.get_my_role() = 'investor'
    and is_published = true
    and public.tier_rank(public.get_my_tier()) >= public.tier_rank(audience)
  );

-- Admins have full access to all rows
create policy "investor_faq_admin"
  on public.investor_faq for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ── 4. updated_at trigger ─────────────────────────────────────────────────────

create or replace function public.investor_faq_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger investor_faq_updated_at
  before update on public.investor_faq
  for each row execute function public.investor_faq_set_updated_at();
