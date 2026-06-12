-- 038_investor_updates.sql
-- Adds the investor_updates table for founder-posted updates visible in the investor portal.
-- Audience tiers mirror the investor_documents model: prospect, investor, board.
-- Investors see published updates where their tier rank >= the update's audience rank.
-- Admins have full CRUD access.

-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table public.investor_updates (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  body         text        not null,
  audience     text        not null default 'prospect'
                           check (audience in ('prospect', 'investor', 'board')),
  is_published boolean     not null default false,
  sent_at      timestamptz null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 2. Index ──────────────────────────────────────────────────────────────────

create index investor_updates_audience_published_idx
  on public.investor_updates (audience, is_published);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

alter table public.investor_updates enable row level security;

-- Investors (and admin viewing as investor) select published updates at or below their tier
create policy "investor_updates_select_investor"
  on public.investor_updates for select
  using (
    public.get_my_role() = 'investor'
    and is_published = true
    and public.tier_rank(public.get_my_tier()) >= public.tier_rank(audience)
  );

-- Admins have full access to all rows
create policy "investor_updates_admin"
  on public.investor_updates for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ── 4. updated_at trigger ─────────────────────────────────────────────────────

create trigger investor_updates_updated_at
  before update on public.investor_updates
  for each row execute function public.handle_updated_at();
