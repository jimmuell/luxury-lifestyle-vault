create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role not null default 'client',
  email           text not null,
  full_name       text,
  phone           text,
  avatar_url      text,
  onboarding_complete boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.client_profiles (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null unique references public.profiles(id) on delete cascade,
  membership_tier text not null default 'founding',
  stripe_customer_id text,
  preferred_contact_method text not null default 'email',
  internal_notes  text,
  preferences     jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.addresses (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  label           text not null default 'Home',
  line1           text not null,
  line2           text,
  city            text not null,
  state           text not null,
  postal_code     text not null,
  country         text not null default 'US',
  is_primary      boolean not null default false,
  delivery_instructions text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.providers (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid references public.profiles(id) on delete set null,
  business_name   text not null,
  contact_name    text not null,
  email           text not null,
  phone           text not null,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  postal_code     text,
  services        service_type[] not null default '{}',
  is_active       boolean not null default true,
  capacity_per_week int,
  turnaround_days_min int,
  turnaround_days_max int,
  stripe_account_id text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create sequence if not exists item_sku_seq start 1;

create table public.items (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  sku             text unique,
  category        item_category not null,
  brand           text,
  color           text,
  size            text,
  material        text,
  season          text,
  purchase_year   int,
  purchase_price  numeric(10,2),
  status          item_status not null default 'intake_pending',
  location_label  text,
  tags            text[] not null default '{}',
  description     text,
  care_instructions text,
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function generate_item_sku()
returns trigger language plpgsql as $$
begin
  if new.sku is null then
    new.sku := 'LLV-' || lpad(nextval('item_sku_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger items_sku_trigger
  before insert on public.items
  for each row execute function generate_item_sku();

create table public.item_photos (
  id              uuid primary key default uuid_generate_v4(),
  item_id         uuid not null references public.items(id) on delete cascade,
  uploaded_by     uuid not null references public.profiles(id),
  storage_path    text not null,
  storage_bucket  text not null default 'item-photos',
  public_url      text,
  photo_type      text not null,
  sort_order      int not null default 0,
  caption         text,
  ai_analysis     jsonb,
  created_at      timestamptz not null default now()
);

create table public.item_conditions (
  id              uuid primary key default uuid_generate_v4(),
  item_id         uuid not null references public.items(id) on delete cascade,
  assessed_by     uuid not null references public.profiles(id),
  condition_level condition_level not null,
  notes           text,
  issues          jsonb not null default '[]'::jsonb,
  assessed_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
