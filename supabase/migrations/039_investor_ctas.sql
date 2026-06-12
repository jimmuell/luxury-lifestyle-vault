-- 039_investor_ctas.sql
-- Adds investor_ctas and investor_cta_interactions tables.
-- Admin manages CTAs; investors see active ones and click them.
-- action_type: 'url' opens a link, 'email' opens mailto, 'log' records interest only.

-- ── 1. investor_ctas table ────────────────────────────────────────────────────

create table public.investor_ctas (
  id           uuid        primary key default gen_random_uuid(),
  label        text        not null,
  action_type  text        not null check (action_type in ('url', 'email', 'log')),
  action_value text        not null default '',
  is_active    boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 2. investor_cta_interactions table ───────────────────────────────────────

create table public.investor_cta_interactions (
  id             uuid        primary key default gen_random_uuid(),
  profile_id     uuid        not null references public.profiles(id) on delete cascade,
  cta_id         uuid        not null references public.investor_ctas(id) on delete cascade,
  interacted_at  timestamptz not null default now()
);

-- ── 3. Indexes ────────────────────────────────────────────────────────────────

create index investor_ctas_active_sort_idx
  on public.investor_ctas (is_active, sort_order);

create index investor_cta_interactions_profile_idx
  on public.investor_cta_interactions (profile_id);

create index investor_cta_interactions_cta_idx
  on public.investor_cta_interactions (cta_id);

-- ── 4. RLS — investor_ctas ───────────────────────────────────────────────────

alter table public.investor_ctas enable row level security;

-- Investors select only active CTAs
create policy "investor_ctas_select_investor"
  on public.investor_ctas for select
  using (
    public.get_my_role() = 'investor'
    and is_active = true
  );

-- Admins have full access
create policy "investor_ctas_admin"
  on public.investor_ctas for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ── 5. RLS — investor_cta_interactions ───────────────────────────────────────

alter table public.investor_cta_interactions enable row level security;

-- Each investor can select their own interactions
create policy "investor_cta_interactions_select_own"
  on public.investor_cta_interactions for select
  using (
    public.get_my_role() = 'investor'
    and profile_id = auth.uid()
  );

-- Each investor can insert their own interactions
create policy "investor_cta_interactions_insert_own"
  on public.investor_cta_interactions for insert
  with check (
    public.get_my_role() = 'investor'
    and profile_id = auth.uid()
  );

-- Admins can select all interactions
create policy "investor_cta_interactions_admin_select"
  on public.investor_cta_interactions for select
  using (public.get_my_role() = 'admin');

-- ── 6. updated_at trigger ─────────────────────────────────────────────────────

create trigger investor_ctas_updated_at
  before update on public.investor_ctas
  for each row execute function public.handle_updated_at();
