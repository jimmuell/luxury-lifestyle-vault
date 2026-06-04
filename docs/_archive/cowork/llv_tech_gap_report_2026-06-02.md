# LLV Technology & Platform — Gap Report
**Date:** June 2, 2026  
**Source doc:** `docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx`  
**Compared against:** repo as of commit `a25a561` + uncommitted changes (27 migrations)  
**Scope:** Text-only audit — no code changes. Engineering actions flagged at end.

---

## A. Implemented-Stack Inventory

| Layer | Blueprint spec | Actual version |
|---|---|---|
| Frontend | Next.js + React + Tailwind CSS | Next.js **16.2.6**, React **19.2.4**, Tailwind CSS **v4** |
| UI Components | Shadcn/UI on Base UI | Shadcn **4.8.0** on **@base-ui/react 1.5.0** (NOT Radix) |
| Backend | Next.js API routes + Server Actions | ✅ — 6 API routes (`/api/inngest`, `/api/webhooks/stripe`, 3 admin data routes, `/auth/callback`), Server Actions throughout |
| Database | PostgreSQL via Supabase | **@supabase/supabase-js 2.106.1**, 27 migrations |
| Auth | Supabase Auth | ✅ — `@supabase/ssr 0.10.3`, 3-client pattern (browser / server / admin) |
| File Storage | Supabase Storage (R2 deferred) | ✅ — `item-photos` + `item-photos-archive` buckets, storage abstraction layer in place |
| Email | Resend | **resend 6.12.3** — fully implemented (HTML templates, Inngest queue, dev inbox, unsubscribe) |
| SMS | Twilio | **twilio 6.0.2** — package installed; **NO SMS sends implemented** (see Gap #1) |
| Payments | Stripe | **stripe 22.1.1** — full subscription lifecycle, webhook handling, per-request billing, admin pricing config; sandbox mode only (see Gap #6) |
| Hosting | Vercel | ✅ — deployed to Vercel; production env confirmed in prior QA run |
| AI | Claude Haiku 4.5 (categorization) + Sonnet 4.6 (concierge) | **@anthropic-ai/sdk 0.98.0** — Haiku only (`claude-haiku-4-5-20251001`); **Sonnet 4.6 not called anywhere** (see Gap #2) |
| Background Jobs | Inngest | **inngest 4.4.0** — `categorize-item-photo`, `create-stripe-customer`, `bill-on-demand-order`, seasonal-reminder functions |
| Design System | Obsidian & Ivory / Cormorant Garamond + Inter | ✅ — ratified, CSS variables in `globals.css`, admin styleguide at `/admin/styleguide`, Lucide icons |
| Seed photos | (not in blueprint) | Pexels API (migrated from Unsplash, June 1 2026); `PEXELS_API_KEY` env var |

---

## B. Stack Drift

### B1. Significant drift

**GAP #1 — SMS not implemented (HIGH risk, pre-launch blocker)**  
Blueprint Section 5 lists "Twilio (SMS), Resend (email), push notifications" as the notifications stack. The Twilio package is installed but there are no `twilio` SDK calls in the codebase. `client.messages.create` calls in `src/actions/search.ts` and `src/lib/inngest/functions/categorize-photo.ts` are both Anthropic SDK calls. The SMS preference UI exists (onboarding, account settings, notification config panel) and `sms_enabled` is in the DB schema, but nothing actually sends a text. Push notifications are also not implemented (no service worker, no FCM, no push subscription).  
**Impact:** Clients who select SMS or Email+SMS at onboarding will silently receive no SMS.

**GAP #2 — Sonnet 4.6 not wired (MEDIUM risk)**  
Blueprint: "Haiku 4.5 for photo categorization; Sonnet 4.6 available for higher-tier concierge features." Codebase: only `claude-haiku-4-5-20251001` is used (or the `AI_CATEGORIZATION_MODEL` env var override, which defaults to Haiku). No Sonnet 4.6 calls exist anywhere. The natural-language wardrobe search and concierge messaging AI both use Haiku. Not a launch blocker if Haiku is sufficient for MVP, but the "available for higher-tier concierge features" capability does not exist yet.

**GAP #3 — Push notifications not present (LOW risk, deferred acceptable)**  
Blueprint lists "push notifications" in the notifications stack. No implementation exists (no service worker, no FCM registration, no push subscription table). This is likely a known deferral since it requires native app context for meaningful value. Worth explicitly noting as deferred rather than "available."

### B2. Minor drift

**GAP #4 — Unsplash remote pattern stale (cosmetic)**  
`next.config.ts` still includes `{ protocol: 'https', hostname: 'images.unsplash.com' }` after the Pexels migration (June 1, 2026). Unsplash is no longer called anywhere. Harmless but clutters config.

**GAP #5 — `AI_CATEGORIZATION_MODEL` env var undocumented**  
`src/lib/inngest/functions/categorize-photo.ts` reads `process.env.AI_CATEGORIZATION_MODEL`. This env var is not mentioned in the blueprint, the launch readiness checklist, or any doc. It defaults to `claude-haiku-4-5-20251001`, so it doesn't break anything, but it should be in the env var reference (see Gap #9).

**GAP #6 — Stripe in sandbox mode only (known, pre-launch blocker)**  
Already tracked in the launch readiness checklist. Confirmed: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` currently point to sandbox. The `src/lib/stripe/server.ts` client is the same for sandbox/live — only the keys differ. Launch checklist item: "Switch Stripe from sandbox to live."

---

## C. Build-State Accuracy

### Route count
**Actual (June 2, 2026):** 48 page routes + 6 API routes = **54 routes total.**

| Portal | Page routes |
|---|---|
| Admin | 20 (`/admin`, clients, inventory, orders, concierge, providers, reports, seed-data, settings/corridors, settings/tiers, settings/notifications, transactions, audit, styleguide, dev/emails, plus `[id]` detail pages) |
| Client | 22 (`/client`, wardrobe, wardrobe/intake, wardrobe/[id], orders, orders/new, orders/[id], outfits, outfits/new, outfits/[id], outfits/[id]/edit, rotations/new, concierge, notifications, profile, settings/*, addresses, onboarding) |
| Provider | 2 (`/provider`, orders/[id]) |
| Auth | 3 (`/auth/login`, signup, verify) |
| Root | 1 (`/`) |

The launch readiness doc references "39 routes as of Sprint B2 (May 25, 2026)." The growth to 54 reflects Sprint B2 additions (provider portal, outfit builder, rotation wizard, settings pages) that were completed exactly on the B2 cutoff date.

### Migration count
**Actual:** 27 migrations (001–027). Migrations 023–027 added Phase B client tables, seed flags, tier-type fix, provider RLS, and Pexels attribution column.

### Development timeline
Blueprint Sections 6.1 plans:
- Phase A: Foundation — June–July 2026
- Phase B: Core Operations — August 2026
- Phase C: Polish & Launch Prep — September 2026
- Phase D: Soft Launch — October 2026

**Actual:** Phase A + Phase B both shipped **May 25, 2026** — approximately 2–3 months ahead of the blueprint timeline. The September–October Phase C/D timeline remains applicable for business readiness items.

---

## D. Launch-Checklist Engineering Items

From `docs/strategy/llv_launch_readiness.md` — engineering items only:

| Item | Status | Notes |
|---|---|---|
| Switch Stripe sandbox → live | ❌ OPEN | Keys need updating in Vercel production env; product/price objects need re-creating in live Stripe account |
| Deploy to production Vercel | ✅ DONE | Confirmed in QA test run June 1, 2026 |
| Custom domain + SSL | ❌ OPEN | DNS not yet pointed; Stripe and Resend domain settings not yet updated |
| Production Supabase project | ❌ OPEN | Not confirmed separate from dev/staging in any doc |
| Production Resend domain | ❌ OPEN | DKIM/SPF records not confirmed |
| Remove seed data tools from production | ⚠️ PARTIAL | See Gap #7 |
| Error monitoring | ❌ MISSING | See Gap #8 |

**GAP #7 — Seed data page env gate is weaker than documented (HIGH risk)**  
The admin seed-data page (`/admin/seed-data`) renders for all admins regardless of env vars — the page component has a warning banner that *says* "gated by `NEXT_PUBLIC_ENABLE_SEED_TOOLS=true`" but there is no `notFound()` or redirect in the page component checking that flag. In `src/actions/seed.ts`, `clearAllSeeds()` is gated only by `requireAdmin()` — no env flag check. `clearAllTestAccounts()` does check `NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'true'` and refuses. An admin on the production deployment can currently navigate to `/admin/seed-data` and invoke `clearAllSeeds()`, which would delete all seed-tagged inventory.  
**Risk:** Production data safety. The launch checklist says "must be disabled in production" — this is not yet enforced at the action layer for `clearAllSeeds`.

**GAP #8 — No error monitoring (MEDIUM risk, pre-launch blocker)**  
No Sentry, DataDog, LogRocket, Bugsnag, or equivalent found in `package.json` or `src/`. Blueprint Section 7 lists "regular security assessments" and live monitoring; Section 8 defines KPIs like "Item Accuracy 99.9%" and "Zero damage incidents" that require observability. Post-launch there will be no visibility into JavaScript exceptions, server errors, or Inngest function failures beyond Vercel function logs and Inngest dashboard.  
**Risk:** Silent production failures during the founding-member pilot season. At minimum Sentry (free tier covers 5k errors/month) on both client and server should be added before October.

---

## E. Env Var Reference

**GAP #9 — No `.env.example` file**  
There is no `.env.example` in the repository root. The 15 env vars in active use are:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ANTHROPIC_API_KEY
AI_CATEGORIZATION_MODEL          # optional, defaults to claude-haiku-4-5-20251001
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_DEV_MODE                   # set 'true' to route all email to dev inbox
PEXELS_API_KEY                    # required for seed photo fetch script
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_ENABLE_DEMO_LOGIN     # 'true' enables demo login + clearAllTestAccounts
NEXT_PUBLIC_DEV_ADMIN_EMAIL       # dev-only: email for demo admin account
```

`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` are NOT yet referenced — consistent with SMS not being implemented.

---

## Summary of Gaps by Priority

| # | Gap | Priority | Blocker? |
|---|---|---|---|
| 1 | SMS sending not implemented; UI promises it | HIGH | Soft — won't crash, but clients get no SMS |
| 7 | `clearAllSeeds()` has no production env guard | HIGH | Pre-launch must-fix |
| 8 | No error monitoring | MEDIUM | Strongly recommended before Oct launch |
| 2 | Sonnet 4.6 not wired (doc says "available") | MEDIUM | No — Haiku works for MVP |
| 6 | Stripe in sandbox mode | KNOWN | Pre-launch checklist item (already tracked) |
| 9 | No `.env.example` | MEDIUM | Operational risk for env setup |
| 3 | Push notifications not present | LOW | Acceptable deferral |
| 4 | Unsplash remote pattern stale in `next.config.ts` | LOW | Cosmetic |
| 5 | `AI_CATEGORIZATION_MODEL` env var undocumented | LOW | Add to `.env.example` |

---

## Engineering Actions (for Claude Code)

These items require code changes and should be tracked as Code Prompts, not doc updates:

1. **Add production env guard to `clearAllSeeds()`** — check `NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'true'` (or a new `NEXT_PUBLIC_ENABLE_SEED_TOOLS` var) and return an error if not set. Match the existing pattern in `clearAllTestAccounts()`.
2. **Add `notFound()` to `/admin/seed-data/page.tsx`** when `NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'true'`.
3. **Add Sentry** — `@sentry/nextjs` with DSN in env, wired to both client and server; add `SENTRY_DSN` to `.env.example`.
4. **Create `.env.example`** — document all 15 env vars with comments; include placeholder values.
5. **Remove Unsplash remote pattern** from `next.config.ts`.
6. **SMS stub or explicit TODO** — either implement Twilio sending for the `preferred_channel === 'sms'` case in the notification triggers, or add a clear TODO and update the onboarding UI to remove the SMS option until it's built.
