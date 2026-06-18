-- ── 043: Dashboard-native document management ──────────────────────────────
-- Three tables: categories, documents, document_versions.
-- RLS mirrors investor_documents / investor_updates patterns.

-- ── 1. categories ────────────────────────────────────────────────────────────

create table public.categories (
  id          uuid        primary key default gen_random_uuid(),
  key         text        not null unique,
  label       text        not null,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_sort_order_idx on public.categories (sort_order);

alter table public.categories enable row level security;

-- Investors (all tiers) and admins can read active categories (needed for section labels)
create policy "categories_select_investor"
  on public.categories for select
  using (
    public.get_my_role() in ('investor', 'admin')
    and is_active = true
  );

create policy "categories_admin"
  on public.categories for all
  using  (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

-- Seed canonical section list (matches existing SECTION_ORDER / SECTION_LABELS)
insert into public.categories (key, label, sort_order) values
  ('concept',    'The Concept',                    10),
  ('strategy',   'Strategy',                       20),
  ('market',     'Market & Competitive',            30),
  ('financials', 'Financials',                     40),
  ('product',    'Product & Technology',            50),
  ('operations', 'Operations',                     60),
  ('launch',     'Launch Plan',                    70),
  ('legal',      'Legal & Risk',                   80),
  ('team',       'Leadership & Team',              90),
  ('ip',         'Intellectual Property & Brand', 100),
  ('deck',       'Pitch Deck',                    110);

-- ── 2. documents ─────────────────────────────────────────────────────────────

create table public.documents (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  category_id       uuid        not null references public.categories(id),
  audience          text        not null default 'investor'
                                check (audience in ('prospect', 'investor', 'board')),
  doc_type          text        not null default 'document',
  body_markdown     text,
  source_kind       text        not null default 'markdown'
                                check (source_kind in ('markdown', 'upload')),
  status            text        not null default 'draft'
                                check (status in ('draft', 'published', 'archived')),
  sort_order        int         not null default 0,
  current_version   int         not null default 1,
  pdf_path          text,
  pdf_generated_at  timestamptz,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index documents_status_audience_idx on public.documents (status, audience);
create index documents_category_id_idx     on public.documents (category_id);
create index documents_sort_order_idx      on public.documents (category_id, sort_order);

alter table public.documents enable row level security;

-- Investors select published docs at or below their tier
create policy "documents_select_investor"
  on public.documents for select
  using (
    public.get_my_role() = 'investor'
    and status = 'published'
    and public.tier_rank(public.get_my_tier()) >= public.tier_rank(audience)
  );

-- Admins have full access
create policy "documents_admin"
  on public.documents for all
  using  (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

-- ── 3. document_versions ─────────────────────────────────────────────────────

create table public.document_versions (
  id             uuid        primary key default gen_random_uuid(),
  document_id    uuid        not null references public.documents(id) on delete cascade,
  version_no     int         not null,
  body_markdown  text,
  title          text,
  category_id    uuid,
  audience       text,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  unique (document_id, version_no)
);

create index document_versions_document_id_idx on public.document_versions (document_id, version_no desc);

alter table public.document_versions enable row level security;

-- Admin-only; investors never read version history
create policy "document_versions_admin"
  on public.document_versions for all
  using  (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');
