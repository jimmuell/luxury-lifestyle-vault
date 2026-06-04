# LLV — Launch Readiness Checklist

**Owner:** Founder (with Cowork maintaining this document)
**Date:** May 25, 2026
**Target launch:** October 2026 (founding-member soft launch, 10–15 clients)
**Status:** 🏁 Platform complete · ⏳ Business readiness in progress

This document tracks everything between the current state — a launch-ready platform — and the October 2026 soft launch. Three sections: what the platform delivers (done), what business strategy is still open (tracked in the assumptions register), and the concrete pre-launch checklist.

---

## Platform (COMPLETE)

**Phase A + Phase B both shipped May 25, 2026.** 31 of 32 Phase B features delivered; B1-05 (wardrobe analytics) deferred as a planned nice-to-have. Clean build.

- ✅ **All 31 Phase B features shipped and building clean.** See `docs/cowork/llv_phase_b_task_breakdown.md` for the full breakdown.
- ✅ **Seed Data Manager operational.** Env-gated admin route with 5 demo clients, 36 demo items, full seed suite (migration 010). Lets the founder demo the platform without touching production data. **Must be removed from the production build before launch** (see pre-launch checklist).
- ✅ **Stripe sandbox integrated via Lion Gate Technology.** Customer creation, subscription lifecycle for Tier 1/2, per-request billing for Tier 3, webhook handling with idempotency, admin pricing config. **Switch to live mode before launch** (see pre-launch checklist).
- ✅ **AI wardrobe search via Claude Haiku 4.5.** Natural-language search across the client's catalog, ranked by AI confidence; falls back to substring match if the API errors.
- ✅ **Email notifications via Resend.** Branded HTML templates for the full order lifecycle, payment events, and seasonal reminders. CAN-SPAM-compliant unsubscribe; per-client preferences; dev-mode inbox for QA.
- ✅ **Provider portal with order queue and status tracking.** Providers accept/decline assignments, update per-item service stages (received → cleaning → pressing → ready_for_pickup), upload optional completion photos, and message admin per-order. Client PII deliberately hidden.
- ✅ **Storage abstraction layer.** Supabase Storage today, future R2 migration is a one-file change. Archive bucket in place.
- ✅ **Ratified design system.** Obsidian & Ivory palette with gold accent; Cormorant Garamond + Inter typography primitives; admin styleguide at `/admin/styleguide`.
- ✅ **Configurability-first architecture.** Pricing, tier definitions, corridor endpoints, and provider relationships are all admin-editable. No business decision in the assumptions register requires a code change.

---

## Business Strategy (OPEN — from the assumptions register)

Each item below has a working assumption built into the platform. The platform will run on these assumptions; updating any of them is a configuration change (admin panel or DB), not a code change. See `docs/strategy/llv_business_strategy_assumptions_register.docx` for the full register including platform-impact assessments and timelines.

- **Item 1 — Wisconsin providers.** ✅ Research complete (June 1, 2026) — shortlist in `docs/strategy/llv_wisconsin_providers_research.md` (lead: Martinizing; secondary: Klinke; specialist: The London Cleaners). Outreach kit ready (`docs/cowork/llv_wisconsin_provider_outreach_kit.md`). Remaining: outreach calls → sign 1 primary + 1 secondary → load into admin. Working assumption: 1–3 premium WI providers onboarded via admin panel.
- **Item 2 — Pricing validation.** Live platform config (verified in QA June 1, 2026): **Seasonal Essentials (Tier 1) $299/mo, Seasonal Premier (Tier 2) $599/mo, On-Demand Occasion (Tier 3) $75 base + per-item surcharge, 20% founding-member discount.** *(Note: the original working assumption was $249/$449; the deployed tiers are $299/$599 — treat $299/$599 as current. Per-item surcharge: confirm the live value in admin — QA observed an effective ≈$28/item after discount.)* Still requires competitive + provider-cost analysis to validate; all values editable via the admin pricing configuration.
- **Item 3 — Provider terms.** Conversations needed with RAVE FabriCARE, European Couture Cleaners, and prospective WI providers. Working assumption: retail pricing initially, no revenue share; providers are vendors, LLV owns the client relationship.
- **Item 4 — Insurance.** Bailee coverage broker consultation needed. Working assumption: general liability + bailee, $5K per item / $50K per client caps; insurable evidence (item values, condition records) is already captured.
- **Item 5 — Daughter's role.** Family conversation needed. Working assumption: AZ Corridor Manager, $1,500–$2,500/month stipend, equity deferred. Role-based access already supports multiple admins.
- **Item 6 — Capital strategy.** Post-launch decision. Working assumption: self-fund the pilot; angel conversation from a position of strength after traction.
- **Item 8 — Entity formation.** Attorney needed. Working assumption: WI LLC primary + AZ foreign LLC registration; trademark filing on "Luxury Lifestyle Vault" and the tagline.
- **Item 9 — Wisconsin storage.** Depends on Item 1 (WI providers). Working assumption: provider-handled storage first; LLV-leased Brookfield unit ($150–$300/month) as overflow only.
- **Item 10 — Founding-member recruitment.** Outreach materials needed (Cowork drafts after pricing finalizes). Working assumption: 10–15 founding members via personal/referral channels (country clubs, wealth managers, estate attorneys, luxury real estate agents); no mass marketing.

*Item 7 (Operational choke points 3 & 4) is post-launch and not a pre-launch blocker — the pilot itself is the operational proof.*

---

## Pre-Launch Checklist

Concrete actions between today and October 2026 launch. Group by owner so the founder can run it.

### Legal & financial

- [ ] **Form LLC** — WI primary, AZ foreign registration. Attorney consultation (Item 8).
- [ ] **Register trademark** — "Luxury Lifestyle Vault" wordmark + tagline. File before public launch for priority.
- [ ] **Obtain bailee insurance** — General liability + bailee coverage. Broker consultation (Item 4). Confirm caps match the platform's configured liability limits.

### Provider network

- [x] **Research WI providers** — ✅ Done June 1, 2026. Shortlist + rationale in `docs/strategy/llv_wisconsin_providers_research.md`; outreach email + call script + one-page proposal in `docs/cowork/llv_wisconsin_provider_outreach_kit.md` (Item 1).
- [ ] **Outreach calls to WI shortlist** — Call Martinizing (lead) + Klinke (secondary), then The London Cleaners. Use the outreach kit to confirm capacity, B2B terms, insurance, and pickup/delivery (Item 1, Item 3).
- [ ] **Sign WI provider(s)** — Contract 1 primary + 1 secondary in Brookfield/Milwaukee after the calls (Item 1, Item 3).
- [ ] **Confirm AZ provider(s)** — RAVE FabriCARE (top priority), European Couture Cleaners, Mastel Dry Cleaning. Walk through the provider portal with each (Item 3). *(An AZ outreach kit can be mirrored from the WI one on request.)*
- [ ] **Load real provider data into admin** — Once contracts are signed, replace any demo provider rows with real ones via the admin Provider CRUD. Assign corridor roles via the corridor management surface.

### Pricing & service definitions

- [ ] **Finalize pricing** — Validate the working-assumption pricing against competitor analysis + provider cost analysis. Update via admin pricing configuration. Tier definitions, founding-member discount %, rush premium %, and per-request surcharges all configurable (Item 2).

### Team

- [ ] **Define daughter's role and compensation** — Family conversation; formalize as contractor or employee; document scope of authority on the AZ corridor (Item 5).

### Founding-member recruitment

- [ ] **Create founding-member outreach materials** — Cowork drafts once pricing is finalized. One-pager, FAQ, founding-member benefits sheet, personal-outreach script (Item 10).
- [ ] **Recruit 10–15 founding members** — Work personal/referral channels. Tag each as `founding_member = true` in admin so the 20% discount applies automatically through Stripe.

### Production infrastructure

- [ ] **Switch Stripe from sandbox to live** — Update keys in production env; confirm webhook endpoint points at production; reissue product/price objects against the live account (the sandbox-via-Lion-Gate-Technology setup is for development only).
- [ ] **Deploy to production (Vercel)** — Production project separate from development; confirm env vars; confirm build passes.
- [ ] **Set up custom domain** — Point DNS to Vercel; provision SSL certificate; update Stripe and Resend domain settings to match.
- [ ] **Production Supabase project** — Separate from dev/staging; run all migrations 001–N (final count per Code's build report); confirm RLS policies; rotate service-role keys.
- [ ] **Production Resend** — Verify sending domain; confirm DKIM/SPF records; test send to founder's address from the production app.

### Content & compliance

- [ ] **Terms of service / privacy policy** — Draft (Cowork can assist) and host. Link from onboarding flow and footer. Include bailee coverage terms, declared-value process, and the liability caps configured in admin.

### Pre-flight QA

- [ ] **Test full client journey end-to-end** — From signup → onboarding (tier selection + Stripe payment) → wardrobe intake → on-demand request → admin processing → provider workflow → shipping → delivery → return. Use real (not sandbox) Stripe in test mode against a real provider's portal. Confirm every email and in-app notification fires.
- [ ] **Remove seed data tools from production build** — The Admin Seed Data Manager (migration 010 + env-gated admin route) must be disabled in production. Confirm via env flag check; consider also removing the route file from the production bundle entirely.

---

## Tracking notes

- This file is the founder's launch-runway tracker. Check items off as they're completed; Cowork can mark them as well based on session updates.
- For per-item context, cross-reference `docs/strategy/llv_business_strategy_assumptions_register.docx` (the strategy items) and `docs/cowork/llv_phase_b_task_breakdown.md` (what the platform actually delivers).
- The October 2026 launch is the soft launch — 10–15 founding members. Public/wider launch comes after a successful first seasonal cycle (April 2027).
