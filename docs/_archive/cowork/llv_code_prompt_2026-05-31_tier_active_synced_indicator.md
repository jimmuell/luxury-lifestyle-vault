# Code Prompt — Fix tier-list green-check: distinguish "active" from "synced to Stripe"

**Date:** 2026-05-31
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**Polish todo:** `docs/cowork/llv_engineering_polish_todos.md` → "Tier list 'active' indicator conflates active vs. synced"
**Bug Fix Cycle:** add entry after shipping (template at end).

## Context

`src/components/admin/tier-list.tsx` (~line 73) shows a green `CheckCircle` based only on `tier.active`. It reads like "Stripe sync OK" but really means "this tier is enabled." Confusing case: a subscription tier shows the green check **and** "Not synced to Stripe" (line ~83–88) simultaneously — both true, but the green check's meaning is misleading. The component already knows `tier.stripe_price_id_current` and `tier.tier_type`.

## Goal

The status icon reflects real readiness, and Stripe-sync state isn't implied by an icon that only tracks `active`.

## Implementation

In `tier-list.tsx`, change the icon logic (~lines 73–77):

- **Subscription tiers:** green `CheckCircle` only when `tier.active && tier.stripe_price_id_current`. If `active` but **not** synced, show a distinct non-green state (e.g. amber `CheckCircle`/`AlertCircle`, or a neutral dot) — not the same green that implies fully ready. If inactive, keep the muted `XCircle`. The existing "Not synced to Stripe" text (lines ~83–88) stays as the explicit detail.
- **Non-subscription tiers** (on-demand / future per-request types): Stripe price-object sync doesn't apply the same way, so don't show a Stripe-implying green check. Show a neutral indicator tied to `active` only (e.g. a small "Per-request" tag or a neutral active/inactive dot), and suppress the "Not synced to Stripe" line for these (guarded already by `tier.tier_type === 'subscription'` ✓).
- Keep icons Lucide (per `CLAUDE.md`). Make sure the chosen colors read in light and dark (use Tailwind/semantic tokens, not raw hex where avoidable; `text-emerald-500`/`text-amber-600`/`text-muted-foreground` are already in use here).

Add a tiny legend or tooltip only if it reads cleanly — otherwise the icon + existing text line is enough.

## Verification

1. `npm run verify` clean.
2. On `/admin/settings/tiers`: a subscription tier that is active **and** synced shows green; active **but not** synced shows the distinct non-green state **and** the "Not synced to Stripe" text (no contradiction). Inactive shows muted.
3. The On-Demand tier shows a neutral/per-request indicator with no Stripe-sync implication and no "Not synced" line.

## Bug Fix Cycle entry

> | NN | 2026-05-31 | Low | Admin / Pricing | Tier-list status icon no longer conflates "enabled" with "synced to Stripe". Subscription tiers show green only when `active && stripe_price_id_current`, a distinct non-green state when active-but-unsynced (alongside the existing "Not synced" text), and non-subscription tiers show a neutral per-request indicator with no Stripe-sync implication. | ✅ FIXED |
