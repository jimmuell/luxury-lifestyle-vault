-- 036_investor_config.sql
-- Single-row config table for the investor portal welcome panel.
-- The founder can edit welcome_heading / welcome_body without a deploy via the admin UI.

-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table public.investor_config (
  id              uuid        primary key default gen_random_uuid(),
  welcome_heading text        not null default '',
  welcome_body    text        not null default '',
  updated_at      timestamptz not null default now()
);

-- ── 2. Seed the default row ───────────────────────────────────────────────────

insert into public.investor_config (welcome_heading, welcome_body)
values (
  'Welcome to the LLV Investor Room',
  'Luxury Lifestyle Vault is a concierge wardrobe management platform for affluent clients — we handle storage, seasonal rotation, cleaning coordination, and on-demand delivery of luxury wardrobes. We''re building toward an October 2026 soft launch in the Scottsdale market.'
);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

alter table public.investor_config enable row level security;

-- Any authenticated user (investors, admins) may read the config row
create policy "investor_config_select_authenticated"
  on public.investor_config for select
  using (auth.role() = 'authenticated');

-- Only admins may update
create policy "investor_config_update_admin"
  on public.investor_config for update
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ── 4. updated_at trigger ─────────────────────────────────────────────────────

create trigger investor_config_updated_at
  before update on public.investor_config
  for each row execute function public.handle_updated_at();
