# Code Prompt — Fix "X seeded" badge label on clear operations

**Date:** 2026-05-31
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**Polish todo:** `docs/cowork/llv_engineering_polish_todos.md` → "'Clear All Seed Data' badge label says 'seeded'"
**Bug Fix Cycle:** add entry after shipping (template at end).

## Context

In `src/components/admin/seed-runner.tsx`, `formatResult()` (line ~42–48) and `ResultBadge` render `${result.seeded} seeded` for **every** operation because `SeedResult` reuses the `seeded` field for both seed and clear runs. After a **Clear All Seed Data** or **Clear All Test Accounts** run, the badge reads e.g. "468 seeded" when it actually means "468 **deleted**." Cosmetic but misleading. Clear paths are at `clearAllSeeds()` (~line 135) and `clearAllTestAccounts()` (~line 171); their results flow through the same `ResultBadge` (~lines 435, 473, 495).

## Goal

The badge shows the correct verb per operation: "N seeded" for seed runs, "N cleared/deleted" for clear runs.

## Implementation (pick the cleaner of these — recommend Option B)

**Option A — minimal:** Add an `operation: 'seeded' | 'cleared'` field to the result type (default `'seeded'`). Set `operation: 'cleared'` in the clear paths. Update `formatResult()` to choose the verb from `operation`.

**Option B — clearer typing:** Rename `SeedResult.seeded` → `count` and add `operation: 'seeded' | 'cleared'`; update all producers (`seed-*.ts`, `clear-all.ts`, `clear-test-accounts.ts`) and `formatResult()`/`ResultBadge`. More touch points but removes the semantic overload at the source.

Either way:
- Thread `operation` through `formatResult`/`ResultBadge` so the verb is data-driven, not guessed from context.
- Keep `skipped` and `errors` wording unchanged.
- If you take Option B, also update `AllSeedsResult` aggregation labels (~line 443 `{r.totalSeeded} seeded`) to stay consistent.

## Verification

1. `npm run verify` clean.
2. Seed All → badge reads "… seeded". Clear All Seed Data → badge reads "… cleared" (or "deleted"). Clear All Test Accounts → same correct verb.
3. Error and skipped counts still render correctly.

## Bug Fix Cycle entry

> | NN | 2026-05-31 | Low | Seed / UI | Clear operations no longer mislabel deletions as "seeded". Added an `operation` discriminator to the seed result so `formatResult`/`ResultBadge` render the correct verb ("seeded" vs "cleared") for seed vs clear runs in the admin Seed Data panel. | ✅ FIXED |
