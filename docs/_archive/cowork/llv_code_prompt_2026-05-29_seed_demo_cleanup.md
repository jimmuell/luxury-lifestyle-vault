# Claude Code Prompt — Seed Pipeline, Demo Accounts, and Test-User Cleanup
**Date:** May 29, 2026
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**For:** Claude Code in VS Code, working in `~/Documents/Claude/Projects/luxury-lifestyle-vault`

---

## Context

The deployed test environment at `https://luxury-lifestyle-vault.vercel.app` is now functional after the bug fixes you shipped earlier today (Bugs #12–#14). Three follow-up issues surfaced during testing that all relate to seed data, demo accounts, and test-user lifecycle. Continue numbering from where you left off — next entry in the Bug Fix Cycle table (`llv_session_handoff.md`) is **#15**.

All three of these are dev-environment concerns. They should be implemented behind appropriate gates so nothing leaks to a real production deployment when launch time comes.

---

## Issue A — `Clear All Seed Data` doesn't remove test-signup accounts

**Symptom.** `src/lib/seed/clear-all.ts` only deletes rows where `is_seed_data = true`. Accounts created by signing up through the deployed app have `is_seed_data = false`, so Clear All Seed Data never touches them. Over a day of testing the hosted DB accumulates broken test accounts with no cleanup path inside the app — you have to hand-edit `profiles` + auth users in the Supabase dashboard.

**Fix.** Add a **separate** admin action — leave the existing `clearAll()` exactly as it is (safe, idempotent, well-tested) and add a new one alongside it.

**Spec for the new action:**

- New server action: `clearAllTestAccounts()` in `src/actions/seed.ts` (or a new `src/lib/seed/clear-test-accounts.ts`).
- Walks the same 19 tables in the same FK-safe order as `clearAll()`, but filtered differently:
  - For tables with a `client_id` or owner FK to profiles: delete where `client_id IN (SELECT id FROM profiles WHERE role != 'admin')`.
  - For tables joined indirectly: cascade via the relevant join (e.g., `order_items.order_id IN (SELECT id FROM orders WHERE client_id IN ...)`).
  - At the end: `auth.admin.deleteUser()` for every non-admin profile id.
- **Preserve every `admin` profile** including the one Jim manually promoted on hosted (`role = 'admin'`).
- Returns a preview-first / commit-second result shape if possible: caller gets a count of accounts that would be deleted, then a second call actually deletes. (Or two server actions: `previewTestAccountCleanup()` and `clearAllTestAccounts()`.)
- Hard gate: refuses to run unless `process.env.NODE_ENV !== 'production'` **AND** a new env var like `ENABLE_DEMO_LOGIN === 'true'` is set. Belt + suspenders so launch doesn't accidentally nuke real users.

**UI changes:**

- In `src/components/admin/seed-runner.tsx`, add a new section below the existing "Clear All Seed Data" button labeled "Test Account Cleanup."
- Two-step interaction:
  1. Click "Preview test accounts to delete" → shows a list/count of non-admin emails that would be removed.
  2. Click "Confirm — delete all test accounts" (red destructive button) → only enabled after preview.
- Gate the UI section behind the same env flag — don't render it at all if `process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'true'`.

**Decision rationale captured for the handoff doc:** Separate action because the existing Clear All Seed Data is a safe, narrowly-scoped operation we want to keep using even after real founding members exist. The destructive "Clear All Test Accounts" is a strictly-dev tool that disappears in production.

---

## Issue B — Demo accounts (`demo.admin@llv.dev` and `demo.client@llv.dev`) are referenced everywhere but never seeded

**Symptom.** `src/components/auth/demo-login.tsx` renders two buttons (Demo Client / Demo Admin) that call `signInAsDemo(role)` in `src/actions/auth.ts`. That action tries to log in with `demo.admin@llv.dev` / `demo.client@llv.dev` (both password `demo1234`) — but **no seed script ever creates these accounts**. The buttons currently throw "Invalid login credentials."

**Fix.** Add the two demo accounts to the seed pipeline.

**Spec:**

- New file: `src/lib/seed/seed-demo-accounts.ts` (or extend `seed-clients.ts` — your call based on what's cleaner).
- Creates exactly two accounts via `auth.admin.createUser({ email, password, email_confirm: true })`:
  - `demo.admin@llv.dev` — password `demo1234`, profile `role = 'admin'`, `is_seed_data = true`.
  - `demo.client@llv.dev` — password `demo1234`, profile `role = 'client'`, `is_seed_data = true`, fully onboarded with:
    - `client_profile` row with `subscription_active = true`, `onboarding_complete = true` on the profile row
    - One primary address (any reasonable WI address) and one seasonal address (any reasonable AZ address)
    - Active subscription on `Seasonal Essentials` tier (the cheaper one — picks up `stripe_price_id_current` if synced, otherwise leaves `stripe_subscription_id = null` and `subscription_active = true` so middleware passes)
    - A small wardrobe — 5–8 items across mixed categories so the demo dashboard isn't empty
    - One past completed seasonal rotation order so the order history page has something
- Idempotent: if accounts already exist (by email), skip the create and just ensure their profile data is correct.
- Add to `seed-all.ts` pipeline at an appropriate phase (after `seed-clients.ts`, before `seed-items.ts` so the wardrobe items can FK to the demo client).
- Add to `manifest.ts` so it appears in the admin Seed Data Manager as a standalone runnable script labeled "Demo Accounts."
- Cleanup: because `is_seed_data = true`, the existing `clearAll()` already handles teardown via auth.admin.deleteUser at step 19. No changes needed to clear-all.

---

## Issue C — Demo accounts aren't in the quick-login dropdown

**Symptom.** `QUICK_ACCOUNTS` in `src/components/auth/login-form.tsx` lists 5 client personas + optionally `NEXT_PUBLIC_DEV_ADMIN_EMAIL`. The demo accounts don't appear.

**Fix.** Add two entries to the top of `QUICK_ACCOUNTS`:

```typescript
{ label: 'Demo — Admin', email: 'demo.admin@llv.dev', password: 'demo1234' },
{ label: 'Demo — Client (fully onboarded)', email: 'demo.client@llv.dev', password: 'demo1234' },
// then existing entries...
```

Jim explicitly wants to keep **both** the buttons AND the dropdown entries — both UIs available, two paths to the same accounts.

---

## Issue D — Demo login UI is gated by `NODE_ENV !== 'production'` and won't work on Vercel

**Critical context Jim flagged after I drafted this prompt.** The Vercel deployment IS Jim's test environment for the time being — it's what he and other testers will hit. But:

- `login-form.tsx` line 75 hides the dropdown if `NODE_ENV === 'production'`.
- `auth.ts` line 52 returns an error from `signInAsDemo` if `NODE_ENV === 'production'`.
- Vercel sets `NODE_ENV=production` automatically on every deploy.

So none of the demo login affordances work on the deployed env today. They need a different gate.

**Fix.** Replace the `NODE_ENV` checks with a feature-flag env var that we can flip per environment.

**Spec:**

- New env var: `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` (default `'false'`).
- Replace every `process.env.NODE_ENV !== 'production'` check that's specifically gating demo-login UI or the `signInAsDemo` action with `process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'`.
  - In `login-form.tsx` (the dropdown render gate).
  - In `demo-login.tsx` (consider whether to render the buttons conditionally too — currently they always render but the action refuses).
  - In `auth.ts` `signInAsDemo` (server-side enforcement).
- Set the env var to `true` in Vercel for the current test deployment. **When Jim is ready for real production launch, he removes that var from Vercel and all demo affordances disappear automatically.**
- Keep the same env flag protecting the new "Clear All Test Accounts" admin action from Issue A.
- Add a note in `README.md` (Technical setup section) documenting the flag and what it controls.

---

## Reporting protocol

Per the **Bug Fix Cycle** convention in `llv_session_handoff.md` Section 13:

- Each shipped fix gets a row in the Bug Fix Cycle table.
- Continue numbering from **#15** (most recent entry in the table is #14).
- Commit + push so Vercel auto-deploys.
- Notify Jim with: "Bugs #15–#18 fixed, deploy in progress / live at <URL>, please retry <specific test>."

**Suggested numbering:**
- #15 — Clear All Test Accounts admin action (Issue A)
- #16 — Demo accounts in seed pipeline (Issue B)
- #17 — Demo accounts in quick-login dropdown (Issue C)
- #18 — Replace NODE_ENV gate with `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` feature flag (Issue D)

Combine into fewer commits if it makes sense (e.g., one commit per issue, or one big commit for the whole batch — your call).

---

## Files of interest

| File | Why |
|---|---|
| `src/lib/seed/clear-all.ts` | Reference for the FK-safe deletion order; new action mirrors it with different WHERE clauses |
| `src/lib/seed/seed-clients.ts` | Pattern for how to create profiles + client_profiles + addresses + subscriptions |
| `src/lib/seed/seed-all.ts` | Pipeline orchestrator — add the new demo accounts step here |
| `src/lib/seed/manifest.ts` | Admin UI script list — register the new "Demo Accounts" entry |
| `src/components/admin/seed-runner.tsx` | Admin UI — add the new "Test Account Cleanup" section |
| `src/components/auth/login-form.tsx` | Quick-login dropdown + the NODE_ENV gate to replace |
| `src/components/auth/demo-login.tsx` | The Demo Client/Demo Admin buttons |
| `src/actions/auth.ts` | `signInAsDemo` action + NODE_ENV gate to replace |
| `src/actions/seed.ts` | Where the new server actions should live |

---

## Environment changes Jim will need to make after you ship

1. **Vercel env vars:** add `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` so the dropdown, demo buttons, and Clear All Test Accounts admin section show up on the deployed env.
2. **Local `.env.local` (if applicable):** add the same var. Optional — Jim is mostly using the deployed env now.
3. **Run the new "Demo Accounts" seed script** on hosted via the admin Seed Data Manager (or `npx supabase` if you make it a one-off SQL).
4. **Test the new Clear All Test Accounts flow** by signing up a couple of throwaway accounts, then running the cleanup to verify they're all removed.

Jim will handle these steps after Vercel rebuilds with your code changes.

---

## Open question to surface for Jim

The "Clear All Test Accounts" action — should it also clean up the test-signup accounts that are currently stuck in broken states on the hosted DB (the ones from earlier testing that hit the createSetupIntent bug before it was patched)? If yes, this action solves the immediate cleanup problem too. If no (e.g., Jim wants to preserve them for forensic reasons), document that the action will also remove them so he isn't surprised.

Recommend just including them — they're broken accounts taking up space, and the action is destructive-with-preview anyway so Jim sees exactly what will go.
