# Code Prompt 5 — Overview, financials charts, deck viewer

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set. **Depends on Prompts 1 & 2** (and 3 for the deck-as-document option).

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

The data room needs three more pages: an **Overview** landing, a **Financials** page with charts and tables, and a **Deck** viewer. There is **no chart library** in this project (the admin reports page hand-rolls bars with CSS widths) — keep it that way: build charts as styled `div`/SVG, no new dependency. The financial figures are provided below as a typed data module so the page has real numbers without spreadsheet access.

## Goal

### 1. Financials data module

Create `src/lib/investor/financials.ts` — the single source for the financials UI. Use these figures (extracted from the live LLV Financial Model, billing mode **Split 6/12**, Year-1 pilot). All currency in whole USD.

```ts
export const FINANCIALS_META = {
  scenario: 'Split 6/12 (recommended billing basis)',
  pilotYear: 'Year 1 (Scottsdale pilot)',
  note: 'Year 1 ties to the live model. Years 2–3 are illustrative growth scenarios for direction only. Founder time is uncompensated in the pilot (sweat equity); the net gap is funded within the $25K–$40K pilot budget.',
} as const

// Year-1 pilot assumptions
export const PILOT_ASSUMPTIONS = [
  { label: 'Founding members', value: '12', note: 'Midpoint of the 10–15 target (4 Tier 1, 8 Tier 2)' },
  { label: 'Founding discount', value: '20%', note: 'First 12 months' },
  { label: 'Tier 3 requests / member', value: '3 / yr', note: '3 items per request' },
  { label: 'Avg wardrobe value / member', value: '$100,000', note: 'Drives insured-value estimate' },
  { label: 'Corridor', value: '1', note: 'WI ↔ AZ (Scottsdale)' },
] as const

// Pricing (Standard vs Founding −20%)
export const PRICING = [
  { item: 'Tier 1 — Seasonal Wardrobe Rotation', standard: 299, founding: 239, unit: '/mo' },
  { item: 'Tier 2 — Total Wardrobe Management', standard: 599, founding: 479, unit: '/mo' },
  { item: 'Tier 3 — On-demand base fee', standard: 75, founding: 60, unit: '/request' },
  { item: 'Tier 3 — Per-item fee', standard: 15, founding: 12, unit: '/item' },
] as const
// (Protection memberships — Basic/Premium/Vault/Signature — are planned post-pilot; omit from pilot revenue.)

// Year-1 revenue composition (Split 6/12)
export const YEAR1_REVENUE = [
  { label: 'Tier 1 subscriptions', amount: 5741 },
  { label: 'Tier 2 subscriptions', amount: 46003 },
  { label: 'Tier 3 on-demand + referral', amount: 3956 },
] as const // total ≈ $55,700

// Year-1 cost stack (Split 6/12)
export const YEAR1_COSTS = [
  { label: 'AZ operator stipend', amount: 24000 },
  { label: 'Cleaning / garment care (COGS)', amount: 13800 },
  { label: 'Transport / shipping', amount: 8280 },
  { label: 'Custody node leases (both ends)', amount: 6000 },
  { label: 'Bailee + general liability insurance', amount: 5000 },
  { label: 'Legal / entity formation (one-time)', amount: 3000 },
  { label: 'Payment processing', amount: 1671 },
  { label: 'Platform / SaaS', amount: 1500 },
] as const // total ≈ $63,251

// Billing-mode comparison (revenue / costs / net before founder comp)
export const BILLING_MODES = [
  { mode: 'Seasonal 6/6',     revenue: 32698, costs: 53360, net: -20662 },
  { mode: 'Split 6/12',       revenue: 55700, costs: 63251, net: -7551, recommended: true },
  { mode: 'Year-round 12/12', revenue: 61441, costs: 65720, net: -4279 },
] as const

// 3-year illustrative projection
export const PROJECTION_3YR = [
  { year: 'Year 1 (pilot)', members: 12,  corridors: 1, revenue: 55700,  insuredValue: 1200000 },
  { year: 'Year 2',         members: 40,  corridors: 2, revenue: 235000, insuredValue: 4000000 },
  { year: 'Year 3',         members: 100, corridors: 4, revenue: 612000, insuredValue: 10000000 },
] as const
```

> If any figure later changes, this file is the only thing to edit. Keep a one-line comment pointing back to the canonical Financial Model (`03 Financial Model & Projections`) in Drive.

### 2. `/investor/financials` page

`src/app/(investor)/investor/financials/page.tsx` (server component, gated by the layout). Render, in luxury-restrained card panels (reuse the report-panel styling — `rounded-lg border border-border bg-card p-5`):

- **KPI strip** (like admin reports): Year-1 revenue `$55.7K`, Year-1 members `12`, Year-3 revenue `$612K`, Year-3 insured value `$10M`.
- **Revenue composition** (Year 1): horizontal bars (CSS width = `amount / total`), labeled with `$` values, from `YEAR1_REVENUE`.
- **Cost stack** (Year 1): horizontal bars from `YEAR1_COSTS`.
- **Billing-mode comparison**: a small table from `BILLING_MODES` (revenue / costs / net), highlighting the recommended row; show net in the destructive color when negative.
- **3-year projection**: grouped vertical bars for revenue across the three years (CSS heights, like the admin revenue-trend chart) + a compact table with members/corridors/insured value.
- **Pricing** + **Assumptions**: two tables from `PRICING` and `PILOT_ASSUMPTIONS`.
- A footnote rendering `FINANCIALS_META.note`.

Build a couple of tiny presentational helpers (e.g. `BarRow`, `formatUsd`) — pure, no deps. `formatUsd` should render compact (`$55.7K`, `$1.2M`) for KPIs and full (`$46,003`) in tables. Make it print-clean (`@media print`).

### 3. `/investor` overview

`src/app/(investor)/investor/page.tsx` — a warm landing: serif headline (the brand line "Your Lifestyle, Wherever Life Takes You."), one or two sentences framing the data room, the KPI strip (reuse the financials KPIs), and three "Jump in" cards linking to Documents, Financials, and Deck (Lucide icons, `buttonVariants`). Optionally surface a "Recently added" list from `investor_documents` ordered by `created_at desc` (top 3).

### 4. `/investor/deck`

`src/app/(investor)/investor/deck/page.tsx`. The pitch deck is currently a Google Slides file; for the data room it should be a **PDF export** stored as an `investor_documents` row in section `concept` (or a dedicated `deck` section). Implement the page to:
- Find the deck document (e.g. a row with a known `section='deck'` or a title match), mint a signed URL via the Prompt 3 endpoint, and embed it in an `<iframe>`/`<object>` viewer sized to the content area, with **Open in new tab** and **Download** buttons (logged via the Prompt 3 endpoint).
- If no deck document exists yet, render a graceful empty state ("The deck will appear here once uploaded") rather than erroring.

> Cowork will supply the deck PDF; the founder loads it via the Prompt 4 seed script. No Google Slides API integration in v1.

## Acceptance criteria

- `/investor/financials` renders all panels from `src/lib/investor/financials.ts` with correct totals (revenue ≈ $55.7K, costs ≈ $63.3K, net ≈ −$7.55K for Split 6/12) and no chart-library dependency added to `package.json`.
- `/investor` overview renders KPIs + jump-in cards and (if present) recent documents.
- `/investor/deck` embeds the deck via a signed URL when the document exists, logs view/download, and shows a clean empty state when it doesn't.
- All three pages are print-clean and match the Obsidian & Ivory styling.
- `npm run verify` is clean.

## Conventions (from CLAUDE.md)
- No new dependencies for charts (hand-rolled CSS/SVG, mirroring `admin/reports`); Shadcn Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); Obsidian & Ivory; `font-serif` for headings.

## Report back
Files added/changed, confirmation totals tie out and no chart dependency was added, deck behavior with/without an uploaded file, and the `npm run verify` result.
