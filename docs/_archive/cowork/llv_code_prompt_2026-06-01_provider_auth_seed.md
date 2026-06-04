# Code Prompt — Seed a provider login so the provider portal is testable

**Date:** 2026-06-01
**Severity:** High (blocks the entire provider journey + provider onboarding)
**Surfaced by:** QA test run (Section 7) against the Vercel deployment.

## Problem
The provider portal exists (`src/app/(provider)/provider/...`, order queue, service-stage updates) and `ProviderLayout` gates on `profiles.role === 'provider'`. But **`seedProviders()` (`src/lib/seed/seed-providers.ts`) only inserts rows into the `providers` table** — it never creates an auth user / `profiles` row, and `providers.profile_id` stays **null** for every seeded provider. Consequences:
- No provider can log in; there's no provider entry in the quick-login dropdown; `/provider` redirects all non-providers away. **T7.1–T7.4 are untestable.**
- Provider-attributed concierge messages get a null author (contributes to the empty admin concierge queue — see that prompt).

## Asks
1. In the seed pipeline, for each seeded provider (at least RAVE FabriCARE + European Couture Cleaners, ideally all 5): create a Supabase auth user (`adminClient.auth.admin.createUser`, confirmed email, known test password like the client seed `TestLLV2026!`), create/ensure a `profiles` row with `role = 'provider'`, and set `providers.profile_id` to that profile id. Make it idempotent (skip if already linked), matching the existing seed patterns in `seed-clients.ts` / `seed-demo-accounts.ts`.
2. Add a provider option (e.g., "Provider — RAVE FabriCARE") to `QUICK_ACCOUNTS` in `src/components/auth/login-form.tsx`, gated by the same `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` flag used for the other dev accounts.
3. Re-run the concierge seed afterward so provider messages get a real `author_profile_id`.
4. Add the Bug Fix Cycle entry when shipped.

## Verify
- Quick-login as the provider → lands on `/provider` with a personalized portal and an order queue showing assigned orders (e.g., the European Couture Cleaners dispatch from order #C9892E85, and RAVE's seeded assignments).
- Provider can accept/decline, advance item service stages (received → cleaning → pressing → ready_for_pickup), flag damage, and message admin; those provider messages then appear in `/admin/concierge` under the Provider source filter.
