-- 034_investor_tier_ladder.sql
-- Expands the two-tier investor model (prospect / board) to an ordered
-- three-tier ladder: prospect(1) < investor(2) < board(3).
-- Migration 033 is unchanged. The RLS policy IS intentionally replaced:
-- the old policy hard-coded two tiers and would not handle 'investor'.
-- The new rank-based policy is the authoritative access-control for all tiers.

-- ── 1. Widen CHECK on profiles.investor_tier ──────────────────────────────────

alter table public.profiles
  drop constraint if exists profiles_investor_tier_check;

alter table public.profiles
  add constraint profiles_investor_tier_check
    check (investor_tier in ('prospect', 'investor', 'board'));

-- ── 2. Widen CHECK on investor_documents.audience ─────────────────────────────

alter table public.investor_documents
  drop constraint if exists investor_documents_audience_check;

alter table public.investor_documents
  add constraint investor_documents_audience_check
    check (audience in ('prospect', 'investor', 'board'));

-- ── 3. tier_rank() — maps tier text to an integer for >= comparisons ──────────

create or replace function public.tier_rank(tier text)
returns int
language sql security definer stable
as $$
  select case tier
    when 'prospect' then 1
    when 'investor' then 2
    when 'board'    then 3
    else 0
  end;
$$;

-- ── 4. Replace RLS policy with rank-based version ─────────────────────────────

drop policy if exists "investor_documents_select_investor" on public.investor_documents;

create policy "investor_documents_select_investor"
  on public.investor_documents for select
  using (
    public.get_my_role() = 'investor'
    and is_published = true
    and public.tier_rank(public.get_my_tier()) >= public.tier_rank(audience)
  );
