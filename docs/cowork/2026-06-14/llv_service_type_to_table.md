# Code Prompt — Convert `service_type` enum → `service_types` reference table (+ admin UI)

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-14
**Canonical location:** `docs/cowork/2026-06-14/llv_service_type_to_table.md` (this file). Single source of truth for this task — authored by Cowork, kept in the repo per the Source-of-Truth Map.
**Branch:** create `feat/service-types-table` off `main`.
**Workflow:** feature branch → push → PR → CI (`verify` + `build`) → Vercel preview → QA → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit org is out of review credits — self-review carefully.)
**Related:** `docs/adr/0001-enum-vs-reference-table.md` — this prompt implements Option C from that ADR. Only run it once a revisit trigger from the ADR has fired.

> **⚠️ PARKED — do not execute.**
> This prompt is backlog, not a work order. The current decision (ADR-0001) is to keep `service_type` as a Postgres enum. Execute this prompt only when a trigger defined in ADR-0001 fires (recurring admin request, per-service attributes required, or catalog growth beyond ~15 values).

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-14/llv_service_type_to_table.md`, create that folder and save this prompt there verbatim, then proceed. This keeps the repo as the single canonical home for Cowork prompts.

## Problem

Provider "Services Offered" values are backed by the Postgres enum `service_type` (`dry_cleaning`, `wet_cleaning`, `hand_wash`, `pressing_steaming`, `alterations`, `repair`, `storage`, `shoe_care`, `leather_care`), defined in `supabase/migrations/001_extensions_enums.sql` and stored on `providers.services service_type[]`. Adding or retiring a service requires a migration + code change + deploy, and no non-engineer can manage the list.

## Goal

Promote the service catalog to an admin-editable `service_types` reference table (mirroring how `service_tiers` and `corridors` work), give it a minimal admin CRUD screen, and repoint the provider form and provider actions at it — **without losing or renaming any existing service values, and without breaking existing `providers.services` data.**

Keep `providers.services` as a `text[]` of stable string keys (the same slugs as today). Do **not** introduce a join table in this pass — a `text[]` of keys validated against the reference table keeps the change small and matches the current read pattern. (A join table is a possible later step; out of scope here.)

## Design

New table (new migration — next number is **041**, confirm `ls supabase/migrations | tail -1` first):

```sql
-- supabase/migrations/041_service_types_table.sql
CREATE TABLE service_types (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        NOT NULL UNIQUE,   -- stable slug, matches existing enum values
  label       text        NOT NULL,          -- human-readable, was in app.ts / provider-form
  description text,
  active      boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_seed_data boolean    NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (provider form + onboarding need it)
CREATE POLICY "service_types_authenticated_read" ON service_types
  FOR SELECT TO authenticated USING (true);
-- Admin-only writes (match the service_tiers policy style)
CREATE POLICY "service_types_admin_write" ON service_types
  FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "service_types_admin_update" ON service_types
  FOR UPDATE TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "service_types_admin_delete" ON service_types
  FOR DELETE TO authenticated USING (public.get_my_role() = 'admin');

CREATE TRIGGER service_types_updated_at
  BEFORE UPDATE ON service_types FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Seed with the exact current enum values + their existing labels, preserving order
INSERT INTO service_types (key, label, sort_order, is_seed_data) VALUES
  ('dry_cleaning',      'Dry Cleaning',        1, true),
  ('wet_cleaning',      'Wet Cleaning',        2, true),
  ('hand_wash',         'Hand Wash',           3, true),
  ('pressing_steaming', 'Pressing / Steaming', 4, true),
  ('alterations',       'Alterations',         5, true),
  ('repair',            'Repair',              6, true),
  ('storage',           'Storage',             7, true),
  ('shoe_care',         'Shoe Care',           8, true),
  ('leather_care',      'Leather Care',        9, true);
```

**Migrating `providers.services` off the enum (same migration, after the seed):**

```sql
-- providers.services is service_type[]; convert to text[] of the same keys.
ALTER TABLE providers
  ALTER COLUMN services TYPE text[]
  USING services::text[];
ALTER TABLE providers
  ALTER COLUMN services SET DEFAULT '{}';
```

Leave the `service_type` enum type **in place but unused** for now (dropping it is a separate cleanup; nothing else references it once the column is converted — confirm with a grep). Note this in the migration as a comment.

> Verify the `handle_updated_at()` trigger function name against the repo (it's used by `service_tiers` in `012_service_tiers.sql` — match whatever that file calls).

## Where to change (locate first, don't assume — these are the known consumers)

- `supabase/migrations/001_extensions_enums.sql` — **do not edit** (history). The enum stays defined; we just stop using it.
- `supabase/migrations/041_service_types_table.sql` — **new**, per above.
- `src/types/database.ts` — after `supabase db push`, regenerate: `npx supabase gen types typescript --linked > src/types/database.ts`. Ensure the new `service_types` row type includes `Relationships: []`. `providers.services` becomes `string[]`.
- `src/types/app.ts` — add `export type ServiceTypeRow = Database['public']['Tables']['service_types']['Row']`. Keep the `ServiceType` enum alias for now (harmless) but it is no longer the source of provider services.
- `src/components/admin/provider-form.tsx` — currently hardcodes `SERVICE_OPTIONS` (lines ~13–23) and types `services` as `ServiceType[]`. Replace the hardcoded list with the active `service_types` rows (fetched server-side and passed in as a prop, or fetched in the form). Use `key`/`label`. Keep the existing checkbox-button UX; `services` becomes `string[]`.
- `src/actions/admin.ts` — `createProvider` / `updateProvider` read `formData.getAll('services')` (lines ~61, ~88) and write `services: services as never`. Validate the submitted keys against active `service_types.key` (reject unknown keys, return `{ error }`), then write as `string[]` (drop the `as never` cast once types are regenerated).
- `src/lib/seed/seed-providers.ts` — uses service values; keep using the same string keys (no change to values, just ensure they're plain strings).
- **Admin UI (new)** — add a `service_types` management surface mirroring tiers:
  - Route: `src/app/(admin)/admin/settings/services/page.tsx` (list) — model on `src/app/(admin)/admin/settings/tiers/page.tsx`.
  - Action file: `src/actions/service-types.ts` — `createServiceType`, `updateServiceType`, `toggleServiceType` (active flag), following the `{ error } | { success }` return convention and re-verifying admin via the same helper `admin.ts` uses (`verifyAdmin`).
  - Form component: `src/components/admin/service-type-form.tsx` — model on `src/components/admin/tier-edit-form.tsx`.
  - Add a nav link to the new settings page in the admin sidebar settings group (wherever `tiers`/`corridors`/`notifications` links live).
  - **Guardrail:** deactivating (not deleting) is the safe default. Block hard-delete of a `service_type` whose `key` is still present in any `providers.services` array (return `{ error: 'In use by N providers' }`); allow setting `active = false` instead.

## Do NOT touch

- `service_tiers`, `corridors`, `notification_config`, help tables, or any other enum (`item_status`, `order_status`, `item_category`, etc.) — this change is scoped to `service_type` only.
- The `item_status` / `order_status` transition maps in `app.ts`.
- Existing migration files (append a new one; never edit history).
- The local dev server — do not run `npm run dev` (founder owns it). Verify with `npm run verify`.

## Acceptance criteria

1. `npm run verify` passes (ESLint + `tsc --noEmit`), and `npm run build` succeeds.
2. `npx supabase db push` applies `041` cleanly; `service_types` has the 9 seeded rows; existing providers' `services` values are unchanged and now `text[]`.
3. Admin can add a new service type at `/admin/settings/services`, and it immediately appears as a checkbox option in the provider form (add/edit).
4. Admin can deactivate a service type; inactive types no longer offered in the provider form but existing provider records keep the value.
5. Submitting an unknown service key to `createProvider`/`updateProvider` is rejected with `{ error }` (no `as never`).
6. No remaining references to the `service_type` enum as the source of provider services (grep clean except the migration comment and the inert enum definition).
7. `database.ts` regenerated; `service_types` row type carries `Relationships: []`.

## Commit / PR

Commit message: `feat(providers): move service catalog from enum to service_types reference table + admin UI`. Open a PR against `main`, let CI + Vercel preview run, self-review carefully (CodeRabbit out of credits), then hand the preview URL back for QA. Do not auto-merge.
