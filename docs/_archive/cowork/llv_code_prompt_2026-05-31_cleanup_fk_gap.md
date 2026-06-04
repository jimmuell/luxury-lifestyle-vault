# Code Prompt — Add 7 missing FK-to-profiles tables to clear-all + clear-test-accounts

**Date:** 2026-05-31
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**Polish todo:** `docs/cowork/llv_engineering_polish_todos.md` → "`clear-all.ts` and `clear-test-accounts.ts` miss 7 FK-to-profiles tables"
**Bug Fix Cycle:** add entry after shipping (template at end).

## Context

`src/lib/seed/clear-all.ts` and `src/lib/seed/clear-test-accounts.ts` walk ~19 tables in FK-safe order before deleting `profiles`/auth users, but miss **7** tables that hold FKs to `profiles(id)`. Discovered running `docs/cowork/llv_sql_delete_user.sql` against an admin who had synced tiers — `pricing_change_log.actor_profile_id` blocked the profile delete. The same gap will hit `clear-all.ts` when clearing any seed admin with history in these tables, and `clear-test-accounts.ts` for any non-admin recorded in them (rare but possible, e.g. `ai_search_logs.client_id`, `reminder_sends.client_id`).

## Missing tables and their FK columns to `profiles`

- `pricing_change_log.actor_profile_id`
- `email_sends.recipient_profile_id`
- `admin_settings.updated_by`
- `reminder_sends.client_id`
- `ai_search_logs.client_id`
- `notification_template_config.updated_by`
- `admin_broadcasts.sent_by`

## Goal

Both cleanup functions delete from all 7 tables in FK-safe order so profile/auth deletion never fails on these constraints.

## Implementation

- In **both** `src/lib/seed/clear-all.ts` and `src/lib/seed/clear-test-accounts.ts`, add deletes for the 7 tables **between** the existing `addresses` step and the final `profiles`/auth-user delete (these tables are leaf-ish w.r.t. profiles, so deleting them before profiles is correct; verify none of them are referenced by an even-later table in the existing sequence).
- Match each function's existing scoping:
  - `clear-all.ts` deletes seed data — scope by `is_seed_data = true` where the column exists; if a table has no `is_seed_data`, scope by the profile ids being removed (mirror how the function already handles such tables).
  - `clear-test-accounts.ts` deletes by the set of non-admin user ids it already computes — delete rows in these 7 tables whose profile-FK is in that id set.
- Reference `docs/cowork/llv_sql_delete_user.sql` Step 19 (the lines added May 30) for the exact column names and delete pattern; keep parity between the SQL utility and these two functions.
- Preserve existing FK-safe ordering and the functions' result accounting (counts feed `SeedResult`).

## Verification

1. `npm run verify` clean.
2. Seed All, then sync a tier to Stripe as a seed admin (writes `pricing_change_log`), trigger an AI search (writes `ai_search_logs`), then **Clear All Seed Data** → completes with **no FK constraint errors**.
3. Create a test signup, have it generate a row in at least one of the 7 tables if reachable, then **Clear All Test Accounts** → completes cleanly.
4. (Optional) Re-run `llv_sql_delete_user.sql` against a user with history in these tables → succeeds.

## Bug Fix Cycle entry

> | NN | 2026-05-31 | Medium | Seed / Cleanup | Added the 7 missing FK-to-`profiles` tables (`pricing_change_log`, `email_sends`, `admin_settings`, `reminder_sends`, `ai_search_logs`, `notification_template_config`, `admin_broadcasts`) to the FK-safe delete sequence in both `clear-all.ts` and `clear-test-accounts.ts`, matching `llv_sql_delete_user.sql` Step 19. Profile/auth deletion no longer fails on these constraints. | ✅ FIXED |
