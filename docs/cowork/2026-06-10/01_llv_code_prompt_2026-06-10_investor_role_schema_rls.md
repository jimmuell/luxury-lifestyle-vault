# Code Prompt 1 — Investor role, data-room schema, RLS, storage

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set (`00_README_investor_dashboard.md`). **Depends on Prompt 0** (skeleton), which already added the `investor` enum value as migration `030`. This prompt adds migration `031` (schema/RLS/storage).

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

We are adding a gated Investor Data Room. It needs a new auth role, a way to gate access until an NDA is acknowledged, tables for the documents/acknowledgments/view-audit, RLS so investors can read only room content, and a private storage bucket for the document files. This prompt lays all of that down at the database layer so later prompts can build UI on top.

## Goal

### 1. Migration `030_investor_role.sql` — already created by Prompt 0

Prompt 0 (skeleton) added `alter type user_role add value if not exists 'investor';` as standalone migration `030`. **Do not duplicate it.** If you are running prompts out of order and `030` does not exist, create it exactly as Prompt 0 specifies (a new enum value must be added in its own transaction before it can be used by the policies below). Everything else in this prompt is migration `031`.

### 2. Migration `031_investor_data_room.sql` — schema + RLS + storage

**2a. Gate flag on `profiles`** (mirrors the existing `onboarding_complete` pattern so `proxy.ts` can gate cheaply in one query):

```sql
alter table public.profiles
  add column if not exists nda_acknowledged boolean not null default false;
```

**2b. Tables.** Use `gen_random_uuid()` for ids (consistent with existing migrations) and the project's existing `updated_at` trigger pattern (find the trigger function defined in `005_triggers_functions.sql` and reuse it; do not invent a new name).

```sql
-- The documents that make up the data room (metadata; files live in storage).
create table public.investor_documents (
  id            uuid primary key default gen_random_uuid(),
  section       text not null,              -- e.g. 'concept','strategy','market','financials','product','operations','launch','legal'
  title         text not null,
  description   text,
  storage_path  text not null,             -- path within the 'investor-room' bucket
  file_type     text not null default 'pdf',
  file_size_bytes bigint,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index investor_documents_section_idx on public.investor_documents (section, sort_order);

-- NDA acknowledgments (the legal record behind the gate flag on profiles).
create table public.investor_nda_acknowledgments (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  nda_version     text not null default 'v1',
  full_name       text not null,           -- typed name as the acknowledgment
  acknowledged_at timestamptz not null default now(),
  ip_address      text,
  user_agent      text,
  unique (profile_id, nda_version)
);

-- View/download audit — powers "who viewed what" in the admin area.
create table public.investor_document_views (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  document_id uuid not null references public.investor_documents(id) on delete cascade,
  view_type   text not null default 'view',  -- 'view' | 'download'
  viewed_at   timestamptz not null default now()
);
create index investor_document_views_profile_idx on public.investor_document_views (profile_id, viewed_at desc);
create index investor_document_views_document_idx on public.investor_document_views (document_id, viewed_at desc);
```

**2c. RLS.** Enable RLS on all three tables and add policies using the existing `public.get_my_role()` helper:

```sql
alter table public.investor_documents enable row level security;
alter table public.investor_nda_acknowledgments enable row level security;
alter table public.investor_document_views enable row level security;

-- investor_documents: investors read published docs; admin full control.
create policy "investor_documents_select_investor"
  on public.investor_documents for select
  using (public.get_my_role() = 'investor' and is_published);
create policy "investor_documents_all_admin"
  on public.investor_documents for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- nda_acknowledgments: investor reads/inserts OWN rows; admin reads all.
create policy "investor_nda_select_own"
  on public.investor_nda_acknowledgments for select
  using (profile_id = auth.uid());
create policy "investor_nda_insert_own"
  on public.investor_nda_acknowledgments for insert
  with check (profile_id = auth.uid() and public.get_my_role() = 'investor');
create policy "investor_nda_select_admin"
  on public.investor_nda_acknowledgments for select
  using (public.get_my_role() = 'admin');

-- document_views: investor inserts OWN rows; admin reads all.
create policy "investor_views_insert_own"
  on public.investor_document_views for insert
  with check (profile_id = auth.uid() and public.get_my_role() = 'investor');
create policy "investor_views_select_admin"
  on public.investor_document_views for select
  using (public.get_my_role() = 'admin');
```

> Note: the `profiles` SELECT/UPDATE policies already exist (own + admin) and cover the new `nda_acknowledged` column. The existing `profiles_update_own` policy pins `role` to its current value, so an investor cannot self-escalate; updating `nda_acknowledged` for one's own row is permitted. Confirm this holds — if that policy's `with check` is too strict to allow the flag update, the acknowledge action in Prompt 2 will use the service-role client instead (note it back).

**2d. Private storage bucket `investor-room`.** Mirror how existing private buckets are created in `supabase/migrations/004_storage_buckets.sql` / `009_photo_archive_bucket.sql`:

```sql
insert into storage.buckets (id, name, public)
values ('investor-room', 'investor-room', false)
on conflict (id) do nothing;
```

Storage object policies for this bucket: **admin only** for direct select/insert/update/delete (match the admin storage policy style in `004`/`009`, gated by `public.get_my_role() = 'admin'`). Investors will **not** read the bucket directly — Prompt 3 serves files via short-lived signed URLs minted by the service-role client. Keeping the bucket admin-only at the RLS layer is the safe default.

### 3. Storage constants

In `src/lib/storage/constants.ts`, add:

```ts
export const INVESTOR_BUCKET = 'investor-room' as const
```
(Leave `SIGNED_URL_TTL` as-is; Prompt 3 reuses it.)

### 4. Regenerate types & app-level role wiring

- `npx supabase gen types typescript --linked > src/types/database.ts` — confirm the three new tables each carry `Relationships: []`.
- In `src/types/app.ts`: add `'investor'` anywhere the role union / label maps are defined (e.g. a `ROLE_LABELS` map → `investor: 'Investor'`). Search for `'provider'` to find every spot the role set is enumerated and extend each consistently.

## Acceptance criteria

- `npx supabase db push` applies `030` then `031` with no error (the enum-value-in-separate-migration ordering is the reason for two files).
- `user_role` now includes `investor`; `profiles.nda_acknowledged` exists, defaults `false`, not null.
- The three tables exist with the RLS policies above; `select * from storage.buckets where id='investor-room'` returns a row with `public=false`.
- `src/types/database.ts` regenerated; new tables have `Relationships: []`. `src/types/app.ts` includes the investor role/label.
- `npm run verify` (ESLint + tsc) is clean.

## Report back

Files added/changed, the `supabase db push` result, confirmation of the enum + flag + tables + bucket, whether the existing `profiles_update_own` policy permits an investor to set their own `nda_acknowledged` (or whether Prompt 2 must use the service-role client), and the `npm run verify` result.
