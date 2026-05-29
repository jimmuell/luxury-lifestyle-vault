# Claude Code Prompt — Deployment Debug Handoff
**Date:** May 29, 2026
**Author:** Cowork (per DIVISION_OF_LABOR.md — code-level debugging belongs to Code)
**For:** Claude Code in VS Code, working in `~/Documents/Claude/Projects/luxury-lifestyle-vault`

---

## Context — what's already in place

Don't redo any of this; it's all live and working.

- **Hosted Supabase project** is provisioned and all 24 migrations are applied. Project ref + DB password are saved in Jim's password manager.
- **Vercel deployment** lives at `https://luxury-lifestyle-vault.vercel.app`. Project is on the Hobby tier under the `jamesloganmueller-4442s-projects` team. `main` branch auto-deploys.
- **Inngest cloud** is connected via the Vercel integration; real `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are in Vercel env vars. Functions register via `/api/inngest`.
- **Stripe sandbox** (Lion Gate Technology). `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are real values.
- **Service tiers synced** — `Seasonal Essentials` and `Seasonal Premier` both have `stripe_price_id_current` populated. `On-Demand Occasion` is intentionally not synced (per-request, not a subscription product).
- **Jim's test account** has been promoted to `role = admin` via direct Supabase Table Editor edit.
- **One code patch already shipped** this session (commit on `main`): `src/actions/stripe.ts` `createSetupIntent` now self-heals — creates the Stripe customer inline with idempotency key `profile_<user_id>` if `stripe_customer_id` is null. This unblocked the payment step of onboarding.

## Open items — pick these up in order

### 🔴 P0 — "Confirm & start membership" silent failure

**Symptom:** After completing all 5 prior onboarding steps (profile, primary home, seasonal home, tier select, payment with `4242 4242 4242 4242`), Jim reaches the Review screen showing the selected tier (Seasonal Essentials, $299/mo). Clicking **Confirm & start membership** appears to do nothing — page stays on Review. No visible toast. No redirect.

**Code path:**

1. `src/components/client/onboarding-flow.tsx` line ~245: `startTransition(async () => { await activateAndComplete(selectedTierId); router.push('/client') })`. The catch block at line 250 either:
   - Shows `toast.warning("Membership activated. Billing will be configured by your concierge.")` and proceeds when the error message contains `"not synced to Stripe"` or `"no stripe customer"`, OR
   - Shows `toast.error(msg || "Failed to activate membership")` for any other error.
2. `src/actions/stripe.ts` line 158: `activateAndComplete(tierId)` → calls `createSubscription(tierId)` → updates `client_profiles.subscription_active = true` and `profiles.onboarding_complete = true`.
3. `createSubscription` (line 64) creates a Stripe subscription with `payment_behavior: 'default_incomplete'`, then inserts a row into `client_subscriptions` via the **service-role** admin client.

**Diagnostic checklist (in order):**

1. **Pull Vercel runtime logs for the failed click.** Vercel project → Logs tab → filter to last 10 minutes → look for the most recent POST to `/client/onboarding` or RSC server action. Click into it. Paste the actual error and stack trace.
2. **Check the browser console.** Open dev tools on the Review page before clicking. Confirm whether the button shows the `Activating…` pending state (in which case the transition started) or stays as "Confirm & start membership →" (in which case the click may not even be wiring through).
3. **Verify `client_subscriptions` table exists and is writable from service role.** Migration 014 (`sprint_b2_schema.sql`) creates this table. Confirm in Supabase Table Editor. If it exists, check RLS policies — service role should bypass RLS, but a `service_role_only` insert policy may have been written to require additional checks.
4. **Verify `client_profiles.subscription_active` column exists.** Same migration 014. The `activateAndComplete` action at line 168 does `update({ subscription_active: true })`. If the column is missing on hosted (migration drift), the update throws.
5. **Verify Stripe key/account alignment.** The tiers were synced to Stripe from this Vercel deployment, so the price IDs should belong to the same Stripe account as `STRIPE_SECRET_KEY`. Confirm by hitting the Stripe dashboard (https://dashboard.stripe.com) → Products → check that `Seasonal Essentials` and `Seasonal Premier` are both visible. Then in Vercel env, verify the `STRIPE_SECRET_KEY` matches.

**Most likely culprits, ranked:**
1. `client_subscriptions` insert failing (RLS or schema mismatch from hosted migration drift).
2. `subscription_active` column missing on `client_profiles` (migration 014 drift).
3. Coupon creation in `createSubscription` line 96–110 throwing (founding-member coupon path). Jim's manually-promoted admin account may not have `founding_member = true` set, so this path probably isn't hit — but worth confirming.

**Reasonable fix patterns:**

- If `client_subscriptions` insert fails, treat the subscription as a non-blocking step like `createSetupIntent` did — log the failure, still complete onboarding, surface a `toast.warning("Membership activated. Concierge will reconcile billing.")` to the client. That keeps the user unblocked while we resolve the data issue.
- If a column is missing, generate a forward-only migration adding it conditionally (`add column if not exists`), commit + push, let Vercel auto-deploy, then run `supabase db push` to apply on hosted.

### 🟡 P1 — `STRIPE_WEBHOOK_SECRET` is still a placeholder

Currently set to `whsec_placeholder` in Vercel env vars. This means real Stripe events (subscription status changes, invoice paid, refunds, etc.) won't be processed by the webhook handler at `/api/webhooks/stripe`. Subscription state in our DB will drift from Stripe's truth.

**Steps:**
1. In Stripe sandbox dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://luxury-lifestyle-vault.vercel.app/api/webhooks/stripe`.
3. Subscribe to (at minimum) these events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `setup_intent.succeeded`. (Cross-check against the codebase's webhook handler — `src/app/api/webhooks/stripe/route.ts` or similar — and subscribe to whatever events that file actually handles.)
4. After creating the endpoint, copy the signing secret (`whsec_...`).
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel env vars to the real value.
6. Trigger a fresh redeploy (uncheck Build Cache).
7. Test by triggering an event from the Stripe CLI or the dashboard's "Send test webhook" button. Verify Vercel logs show the webhook received and processed.

### 🟢 P2 — `On-Demand Occasion` tier shows `tier_type = 'subscription'`

Data inconsistency. The tier is per-request, not subscription. Likely caused by a later migration adding `tier_type` with a default value of `subscription` and not backfilling the existing On-Demand row.

**Fix:** A simple `UPDATE service_tiers SET tier_type = 'per_request' WHERE name = 'On-Demand Occasion'` would do it. Either as a one-off in the Supabase SQL editor or as a forward migration. Doesn't block anything right now (the onboarding tier picker filters by `tier_type === 'subscription' AND stripe_price_id_current`, so On-Demand is correctly excluded either way), but it'd be misleading in the admin tier list UI.

Also check whether the `tier_type` enum or check constraint accepts `per_request` — if not, fix that too.

---

## How to report results back to Jim

Per the **Bug Fix Cycle** convention in `llv_session_handoff.md` (Section 13):

1. For each fix shipped, append a row to the Bug Fix Cycle table with: number, date, priority, area, description, status.
2. Commit + push so Vercel auto-deploys.
3. Notify Jim with: "Bug #X fixed, deploy in progress / live at <URL>, please retry <specific test>."
4. Jim re-tests and confirms.

The current Bug Fix Cycle entries go up to #11. Continue numbering from #12.

---

## Files of interest

| File | Why |
|---|---|
| `src/actions/stripe.ts` | `createSubscription`, `activateAndComplete`, `createSetupIntent` (already patched) |
| `src/components/client/onboarding-flow.tsx` | Onboarding state machine, button handlers, catch logic |
| `src/app/api/webhooks/stripe/route.ts` (or wherever Stripe webhooks land) | Webhook handler — confirm what events it handles before subscribing in Stripe |
| `supabase/migrations/014_sprint_b2_schema.sql` | Source of truth for `client_subscriptions` + `subscription_active` |
| `llv_session_handoff.md` | Bug Fix Cycle table; update after each fix |

---

## Environment quick reference

- **Vercel project:** `luxury-lifestyle-vault` under team `jamesloganmueller-4442s-projects`
- **GitHub:** `jimmuell/luxury-lifestyle-vault`, working branch `main`
- **Supabase hosted project:** Jim has the project ref and DB password
- **Stripe sandbox:** Lion Gate Technology account
- **Inngest org:** Luxury Lifestyle Vault (slug: `luxury-lifestyle-vault`)
- **Deployed URL:** https://luxury-lifestyle-vault.vercel.app
- **Test card for happy path:** `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
