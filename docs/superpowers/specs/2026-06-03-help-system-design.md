# Help System Design
**Date:** 2026-06-03  
**Phase:** 1.5 / §11 / Prompt 13.4  
**Status:** Approved — ready for implementation planning

---

## Overview

A data-driven help system where all content lives in Supabase Postgres tables managed by admins. The framework ships now with minimal seed content; adding help for a new area is: drop `<HelpTip areaKey="new.key" />` into the server page + add a row in `/admin/help`. No migration, no component change.

The luxury-concierge safety net — "Talk to your concierge" — is present everywhere help appears from day one.

---

## Data Model

### Migration: `028_help_system.sql`

**`help_tooltips`** — short contextual help keyed to a placement:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `area_key` | text NOT NULL UNIQUE | dot-namespaced: `surface.area` (e.g. `client.ondemand`) |
| `title` | text NOT NULL | |
| `body` | text NOT NULL | 1–3 sentences |
| `linked_article_slug` | text | optional "Learn more" anchor |
| `is_published` | boolean NOT NULL DEFAULT true | |
| `is_seed_data` | boolean NOT NULL DEFAULT false | |
| `created_at` | timestamptz DEFAULT now() | |
| `updated_at` | timestamptz DEFAULT now() | trigger-managed |

**`help_articles`** — longer FAQ/help-center entries:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `slug` | text NOT NULL UNIQUE | URL-safe, used as anchor `id` |
| `category` | text NOT NULL | free text: `getting_started`, `rotations`, `on_demand`, `billing`, `returns`, `coverage`, `provider` |
| `title` | text NOT NULL | |
| `body` | text NOT NULL | markdown/plain text |
| `area_key` | text | optional tie to a flow |
| `audience` | text NOT NULL DEFAULT `'client'` | `client` \| `provider` |
| `sort_order` | int NOT NULL DEFAULT 0 | |
| `is_published` | boolean NOT NULL DEFAULT true | |
| `is_seed_data` | boolean NOT NULL DEFAULT false | |
| `created_at` | timestamptz DEFAULT now() | |
| `updated_at` | timestamptz DEFAULT now() | trigger-managed |

**No CHECK/enum constraints on `category` or `audience`** — new values can be added without a migration (matches the expandable, config-driven goal).

### RLS (both tables)

```sql
ALTER TABLE public.help_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Authenticated users see published rows; admins see all rows
-- (admin visibility of drafts required for /admin/help CRUD)
CREATE POLICY "help_tooltips_select" ON public.help_tooltips
  FOR SELECT TO authenticated
  USING (is_published = true OR get_my_role() = 'admin');

CREATE POLICY "help_tooltips_admin_write" ON public.help_tooltips
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Same pattern for help_articles
```

**Optional performance index:**
```sql
CREATE INDEX IF NOT EXISTS help_articles_audience_idx
  ON public.help_articles (audience, category, is_published, sort_order);
```

### updated_at trigger

Use the project's existing `handle_updated_at()` function (confirmed in migrations 007, 012, 022):
```sql
CREATE TRIGGER set_help_tooltips_updated_at
  BEFORE UPDATE ON public.help_tooltips
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

---

## Area-Key Taxonomy

Dot-namespaced `surface.area` form. Launch set:

| Key | Where it appears |
|-----|-----------------|
| `client.wardrobe` | `/client/wardrobe` page header |
| `client.ondemand` | `/client/orders/new` page header |
| `client.rotation` | `/client/rotations/new` page header |
| `client.billing` | `/client/settings/billing` page header |
| `client.returns` | `/client/orders` page header |
| `provider.stages` | `/provider/help` reference panel |

New areas require no migration or component change — just a new row in `help_tooltips`.

---

## TypeScript Types

Add both tables to `src/types/database.ts` with `Relationships: []` (required by project convention — Supabase inference breaks without it). Export convenience aliases from `src/types/app.ts`:

```typescript
export type HelpTooltip = Database['public']['Tables']['help_tooltips']['Row']
export type HelpArticle = Database['public']['Tables']['help_articles']['Row']
```

---

## Components

### `src/components/ui/popover.tsx`

Thin wrapper around `@base-ui/react/popover` (package already in project; import pattern: `import { Popover as PopoverPrimitive } from "@base-ui/react/popover"`). Exports `Popover`, `PopoverTrigger`, `PopoverContent`. Pattern mirrors `dropdown-menu.tsx` which uses `@base-ui/react/menu`.

### `src/components/help/help-tip.tsx` — async Server Component

```typescript
async function HelpTip({ areaKey }: { areaKey: string }) {
  // Fetch from help_tooltips by area_key (server DB read via createClient())
  // If no published row → return null (silent, no error, no empty popover)
  // If row found → return <HelpTipPopover content={...} />
}
```

**Server/Client boundary rule:** `HelpTip` is an async Server Component. It must only be placed in server-rendered files (page.tsx, layout.tsx). It must NOT be imported into `'use client'` components. Placement in client-rendered pages (`rotation-request-wizard.tsx`, `on-demand-request-form.tsx`) is intentionally in the parent page.tsx wrapper, in the page header area.

### `src/components/help/help-tip-popover.tsx` — Client Component

- `HelpCircle` Lucide icon as trigger (accessible, hover+click)
- Base UI Popover showing `title` (bold) + `body`
- "Learn more →" `<Link href={/client/help#${slug}}>` if `linked_article_slug` is set
- `<HelpEscalate />` button at the bottom of every popover

### `src/components/help/help-escalate.tsx` — Client Component

```tsx
interface HelpEscalateProps {
  href?: string  // defaults to '/client/concierge'
}

<Link
  href={href ?? '/client/concierge'}
  className={buttonVariants({ variant: 'outline', size: 'sm' })}
>
  <MessageCircle className="..." /> Talk to your concierge
</Link>
```

- `href` prop defaults to `/client/concierge`; pass a different value on non-client surfaces.
- `prefill` prop accepted but passed as query param (`?subject=...`); concierge page can use it if it chooses — no concierge page changes required in this PR.
- Route verified: `/client/concierge` exists at `src/app/(client)/client/concierge/page.tsx`.
- **Provider portal**: The provider portal has no provider-facing messaging/support route (confirmed: only `/provider` dashboard and `/provider/orders/[id]` exist). `HelpEscalate` is **omitted** from `/provider/help` — do not route providers to `/client/concierge`.

---

## HelpTip Drop-In Placements

All five target pages are server components — the client wizard/form components are nested inside them. `<HelpTip>` goes in the page header area of the server page, not inside the client component.

| Route | File | Placement |
|-------|------|-----------|
| `/client/wardrobe` | `src/app/(client)/client/wardrobe/page.tsx` | Page header |
| `/client/orders/new` | `src/app/(client)/client/orders/new/page.tsx` | Page header |
| `/client/rotations/new` | `src/app/(client)/client/rotations/new/page.tsx` | Page header |
| `/client/settings/billing` | `src/app/(client)/client/settings/billing/page.tsx` | Page header |
| `/client/orders` | `src/app/(client)/client/orders/page.tsx` | Page header (for returns) |

---

## Pages

### `/client/help`

**File:** `src/app/(client)/client/help/page.tsx` (server component)

- Fetches published client articles, groups by category server-side
- Passes groups to `HelpCenterContent` (Client Component) for search/filter (`useState`)
- Category display labels: `on_demand` → "On-Demand", `getting_started` → "Getting Started", etc. (a `HELP_CATEGORY_LABELS` map in `src/types/app.ts`)
- Each article rendered in a `<section id={article.slug}>` (required for "Learn more" anchor links from tooltips)
- `<HelpEscalate />` at the top and bottom of the page
- Linked from client nav (add to the existing client layout nav)

### `/provider/help`

**File:** `src/app/(provider)/provider/help/page.tsx` (server component)

- Fetches published articles where `audience = 'provider'`, ordered by `sort_order`
- Simple list (no search needed at launch — minimal content)
- **No `<HelpEscalate />`** — the provider portal has no provider messaging/support route; omitting the button avoids routing providers to the client concierge channel.
- Linked from provider layout (add a "Reference" or "Help" link; the provider layout has no dedicated nav component — add the link directly in `src/app/(provider)/layout.tsx`)

### `/admin/help`

**File:** `src/app/(admin)/admin/help/page.tsx` (server component)

- Two tabs using existing `tabs.tsx`: **Tooltips** and **Articles**
- Each tab: list of rows with edit/publish/delete actions; "Add new" opens a Base UI Dialog (consistent with `confirm-dialog.tsx` pattern)
- **All editable fields exposed:**
  - Tooltips: `area_key`, `title`, `body`, `linked_article_slug`, `is_published`
  - Articles: `slug`, `category`, `title`, `body`, `area_key`, `audience`, `sort_order`, `is_published`
- `area_key` field shows taxonomy helptext: "Dot-namespaced area identifier (e.g. client.ondemand, provider.stages). Controls which screen this tip appears on."
- Delete uses `useConfirm()` hook (not native `confirm`)
- `sonner` toast for success/error feedback
- Lucide icons only

**Server Actions** (`src/actions/help.ts`):
- `createTooltip(data)` → `{ success, data }` | `{ error }`
- `updateTooltip(id, data)` → `{ success }` | `{ error }`
- `deleteTooltip(id)` → `{ success }` | `{ error }`
- `createArticle(data)` → `{ success, data }` | `{ error }`
- `updateArticle(id, data)` → `{ success }` | `{ error }`
- `deleteArticle(id)` → `{ success }` | `{ error }`

Each action: re-verifies session + admin role (uses the project's `requireAdmin()` helper), revalidates `/admin/help`.

---

## Seed Data

**File:** `src/lib/seed/seed-help.ts` — new seed script added to `src/lib/seed/manifest.ts`

Idempotent (check for existing row by `area_key` / `slug` before insert). All records: `is_seed_data: true`.

**2 tooltips:**
- `area_key: 'client.ondemand'` — title: "How on-demand works", body: concise 2-sentence explanation
- `area_key: 'client.returns'` — title: "Starting a return", body: concise 2-sentence explanation

**2 articles:**
- `slug: 'how-on-demand-fulfillment-works'`, `category: 'on_demand'`, `audience: 'client'`
- `slug: 'garment-care-stages'`, `category: 'provider'`, `audience: 'provider'`

The other 4 area keys (`client.wardrobe`, `client.rotation`, `client.billing`, `provider.stages`) intentionally have no seed row — they render nothing. This is the proof that the framework expands cleanly.

---

## Nav Links

- **Client nav** (`src/components/client/client-nav.tsx` — `NAV_LINKS` array): add `{ href: '/client/help', label: 'Help', icon: HelpCircle }` entry.
- **Provider layout** (`src/app/(provider)/layout.tsx` — no dedicated nav component; nav is inline): add a simple "Reference" link to `/provider/help` in the layout header area.
- **Admin sidebar** (`src/app/(admin)/layout.tsx` — `NAV_ITEMS` array): add `{ href: '/admin/help', label: 'Help Content', icon: BookOpen }` entry.

---

## Dynamic Reads (Acceptance #2 requirement)

All help-data reads must be dynamic so a newly added row appears immediately without a redeploy.

**Why they're already dynamic:** Every help page and `HelpTip` component calls `createClient()` from `@/lib/supabase/server`, which reads the incoming request's cookies via Next.js `cookies()`. This opts the route into dynamic rendering automatically — Next.js does not statically cache routes that read cookies.

**Rules to maintain this:**
- Do **not** add `export const revalidate = <number>` or `export const dynamic = 'force-static'` to any help page or to `HelpTip`.
- Do **not** wrap help fetches in `unstable_cache()`.
- The `HelpTip` component inherits dynamic behavior from its parent server page (which already uses `createClient()`). No additional `noStore()` call is needed.

---

## Acceptance Criteria

1. With no DB row for an area key, `<HelpTip>` renders nothing (no error, no empty popover).
2. Adding a `help_tooltips` row via `/admin/help` makes the tip appear on the matching flow — no code change, no redeploy.
3. `/client/help` lists seeded client articles grouped by category; search filters them; "Talk to your concierge" opens the concierge thread.
4. Provider portal `/provider/help` shows the seeded provider article.
5. "Learn more" link in a tooltip navigates to the correct article anchor on `/client/help`.
6. A new area is supported by: drop `<HelpTip areaKey="new.key" />` in a server page + add a row — no migration, no component change.
7. RLS: a non-admin cannot write help content; unpublished rows are not visible to clients/providers (admin sees all).
8. `npm run verify` (ESLint + tsc) clean.

---

## File Index

| Purpose | Path |
|---------|------|
| Migration | `supabase/migrations/028_help_system.sql` |
| DB types | `src/types/database.ts` (add both tables) |
| App types | `src/types/app.ts` (aliases + HELP_CATEGORY_LABELS) |
| Popover UI primitive | `src/components/ui/popover.tsx` |
| HelpTip server component | `src/components/help/help-tip.tsx` |
| HelpTip popover wrapper | `src/components/help/help-tip-popover.tsx` |
| HelpEscalate button | `src/components/help/help-escalate.tsx` |
| Help center client content | `src/components/help/help-center-content.tsx` |
| Server actions | `src/actions/help.ts` |
| Seed script | `src/lib/seed/seed-help.ts` |
| Seed manifest (updated) | `src/lib/seed/manifest.ts` |
| Client help center page | `src/app/(client)/client/help/page.tsx` |
| Provider help page | `src/app/(provider)/provider/help/page.tsx` |
| Admin help page | `src/app/(admin)/admin/help/page.tsx` |
| Admin tooltips tab | `src/components/admin/help-tooltips-tab.tsx` (list + add/edit dialog) |
| Admin articles tab | `src/components/admin/help-articles-tab.tsx` (list + add/edit dialog) |
| HelpTip placements (5 files) | wardrobe, orders/new, rotations/new, billing, orders pages |
| Client nav | `src/components/client/client-nav.tsx` (add Help to NAV_LINKS) |
| Provider layout | `src/app/(provider)/layout.tsx` (add inline Reference link) |
| Admin layout | `src/app/(admin)/layout.tsx` (add Help Content to NAV_ITEMS) |
