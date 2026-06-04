# Code Prompt — Baseline Help System (scaffolding-first)

**Date:** 2026-06-03
**Author:** Cowork
**For:** Claude Code
**Launch Plan ref:** Phase 1.5 / §11 / prompt 13.4
**Priority:** Phase 1 (functional gap)

> **Local environment — important:** The founder runs the local dev server, exclusively. Do NOT run `npm run dev` / `next dev` or `pkill`/`kill` Next processes (it collides on port 3000 and breaks local dev). Verify your work with `npm run verify` (ESLint + TypeScript — no server needed); the founder will exercise the running app for the manual UI checks in this prompt. Also: don't edit `node_modules`; run under Node 20.19.5.

---

## Founder's vision (read first)

Build the **infrastructure now, content later**. This pass is NOT about writing a full help library. It is about standing up the framework so that adding help to any area later is *just adding content* — never building new plumbing. Ship with deliberately **minimal seed content** (one or two entries), prove the framework works end to end, then grow it area by area over time.

Design principle (consistent with the platform's configuration-over-code approach): **help is data-driven content sitting on a fixed framework, keyed by area, expandable incrementally.** All content lives in **Supabase Postgres** (admin-editable tables with RLS) — never hardcoded in components. Supabase Storage is only involved if an article later needs an image/attachment.

The luxury-concierge stance: a thin help library is acceptable at launch **because a human is always one tap away** — the "Talk to your concierge" escalation is the safety net, so it must be present everywhere from day one.

---

## Goal

A new founding member can get unstuck on every core flow without leaving the app, and can always reach a human. Admins (and the founder) can add or edit help for any area **without code changes or a redeploy**. Adding help to a brand-new area is: drop `<HelpTip areaKey="…" />` into that screen + add a row in the admin UI.

---

## Data model (Supabase Postgres — new migration `028_help_system.sql`)

Two admin-editable tables. Both carry `is_seed_data boolean default false` (for cleanup targeting per existing convention) and `created_at` / `updated_at`.

**`help_tooltips`** — short contextual help keyed to a placement.
- `id uuid pk default gen_random_uuid()`
- `area_key text not null unique` — stable, dot-namespaced placement id (see taxonomy below)
- `title text not null`
- `body text not null` — short (1–3 sentences)
- `linked_article_slug text null` — optional "Learn more" → a help article
- `is_published boolean not null default true`
- `is_seed_data`, `created_at`, `updated_at`

**`help_articles`** — longer FAQ / help-center entries.
- `id uuid pk default gen_random_uuid()`
- `slug text not null unique`
- `category text not null` — e.g. `getting_started`, `rotations`, `on_demand`, `billing`, `returns`, `coverage`, `provider`
- `title text not null`
- `body text not null` — markdown/plain text
- `area_key text null` — optional tie to a flow (same namespace as tooltips), so an area can surface its relevant article
- `audience text not null default 'client'` — `client` | `provider` (lets the provider reference panel pull its own set)
- `sort_order int not null default 0`
- `is_published boolean not null default true`
- `is_seed_data`, `created_at`, `updated_at`

**RLS (enforced at DB layer, per project convention):**
- Authenticated users may `SELECT` rows where `is_published = true`.
- All `INSERT/UPDATE/DELETE` are **admin-only** (mirror the pattern used for `service_tiers` / config tables).
- No client may write help content.

**Area-key taxonomy (the thing that makes future additions trivial — document it in code comments + the admin UI helptext):**
Dot-namespaced, `surface.area` form. Launch set:
`client.wardrobe`, `client.ondemand`, `client.rotation`, `client.billing`, `client.returns`, `provider.stages`.
New areas later are just new keys — no schema change.

After the migration, regenerate types: `npx supabase gen types typescript --linked > src/types/database.ts`. Both new tables **must** include `Relationships: []` or Supabase's generic inference breaks (per CLAUDE.md).

---

## Components & surfaces

1. **`<HelpTip areaKey="…" />`** — the reusable contextual-help primitive.
   - Lucide icon (`HelpCircle` or `Info`) trigger + Base UI Popover showing the tooltip's `title` + `body`, and a "Learn more" link to the linked article if present.
   - Content fetched from `help_tooltips` by `area_key` (server component reads DB and passes content to a small client popover wrapper — no hardcoded copy in the component).
   - If no published tooltip exists for that key, render **nothing** (so placing the component early, before content is written, is safe and invisible).
   - Place it on the core client flows now: wardrobe catalog, on-demand request, rotation wizard, billing, returns. Most will initially have no row → renders nothing → that's expected.

2. **Help center page — `/client/help`**
   - Lists published `help_articles` (audience `client`) grouped by `category`, with a simple client-side search/filter box.
   - Each article rendered from its DB `body`.
   - A persistent **"Talk to your concierge"** action (see #4) at the top and bottom.

3. **`<HelpEscalate />` — "Talk to your concierge"** (the safety net, must be everywhere help appears)
   - Reuses the **existing concierge messaging** (`concierge_messages`) — opens/links to the client's concierge thread, optionally prefilled with the area context.
   - Available from the help center and from each `HelpTip` popover.
   - Use `buttonVariants` on a `<Link>` (Base UI Button has no `asChild`, per CLAUDE.md) or the existing messaging entry point.

4. **Provider reference panel — in the provider portal**
   - A handling-protocol / stage-definition reference reading `help_articles` where `audience = 'provider'` (e.g. definitions for received → cleaning → pressing → ready_for_pickup).
   - Same data-driven pattern.

5. **Admin help management — `/admin/help`** (this is what makes it expandable)
   - Admin-only CRUD for both tables: create/edit/publish/unpublish/delete tooltips and articles.
   - Show the `area_key` taxonomy as helptext so the founder knows where a tooltip will appear.
   - Follow project conventions: server actions return `{ error }` / `{ success }` (never throw to a form); destructive deletes use the existing `useConfirm()` hook (not native `confirm`); `sonner` for toasts; Lucide icons only (no emoji in UI).

---

## Minimal seed content (prove the framework, nothing more)

Add via a small seed routine (idempotent, `is_seed_data = true`), gated like other seed data:
- **2 tooltips:** `client.ondemand` ("How on-demand works"), `client.returns` ("Starting a return").
- **2 articles:** `how-on-demand-fulfillment-works` (category `on_demand`, audience `client`) and one provider article `garment-care-stages` (audience `provider`).
- Leave the other area keys empty on purpose — they should render nothing until the founder adds content. That absence is the proof the framework expands cleanly.

---

## Acceptance criteria

- With no row for an area key, `<HelpTip>` renders nothing (no error, no empty popover).
- Adding a `help_tooltips` row via `/admin/help` makes the tip appear on the matching flow with **no code change / no redeploy**.
- `/client/help` lists seeded client articles, search filters them, and "Talk to your concierge" opens the existing concierge thread.
- Provider portal reference panel shows the seeded provider article.
- A new area is supported by dropping `<HelpTip areaKey="new.key" />` into a screen and adding a row — no migration, no component change.
- RLS verified: a non-admin cannot write help content; unpublished rows are not visible to clients.
- `npm run verify` (ESLint + tsc) clean.

## Verification step

- Run `npm run verify`.
- Manually: seed → confirm tooltip renders from DB; edit its body in `/admin/help` → confirm the change shows on the client flow; unpublish → confirm it disappears; click "Talk to your concierge" → confirm it lands in the concierge messaging thread; load `/provider` reference panel.
- Negative RLS check: as a client/provider session, confirm help write actions are rejected and unpublished rows are hidden.

## Conventions reminder (from CLAUDE.md)

- Migrations in `supabase/migrations/`; use `gen_random_uuid()`; RLS at the DB layer; admin-only mutations in server actions that re-verify the session.
- `src/types/database.ts`: add both tables with `Relationships: []`.
- Server actions: return `{ error }` on failure, `{ success }`/`{ data }` on success; throw only for auth/permission violations.
- UI: Shadcn on Base UI (no `asChild`; use `buttonVariants` on `<Link>`); Lucide icons only (no emoji); `useConfirm()` for destructive confirms; `sonner` for toasts; Obsidian & Ivory design system.

## After shipping

Report back so Cowork can log the Bug Fix / build-cycle entry and tick Phase 1.5 in the Launch Readiness Tracker. Post-launch help phases (full KB + search, guided tours, AI help assistant, admin runbook) remain deferred per Launch Plan §11.
