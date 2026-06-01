# Luxury Lifestyle Vault — Session Handoff Document

**Last Updated:** June 1, 2026
**Purpose:** Paste this document into any new Claude Chat session to provide full project context. For Cowork sessions, this file lives in the local project folder and is read automatically.

---

## IMPORTANT: First Steps for Any New Session

1. **Read `DIVISION_OF_LABOR.md`** to understand your role. As of May 30, 2026, this is a **two-tool model**: Cowork owns strategy, research, documents, and Code prompts; Claude Code owns implementation, DevOps, and git operations. Claude Chat is no longer in the daily workflow (kept as optional backup).
2. **Read this document's "Session Summary — May 31, 2026" block below** (the newest block at the top) for the most recent state. Older summary blocks (May 30, May 25) follow it in reverse-chronological order.
3. **Read `docs/cowork/llv_engineering_polish_todos.md`** for the queued engineering polish items.
4. **Review the open items / build cycle status** in Section 13 for full context.
5. **Ask the founder** what they'd like to focus on this session — present the queued list as options.

---

## 🏁 Session Summary — June 1, 2026

**QA test run — Sections 2–13 executed against the live Vercel deployment (Cowork, browser-driven).** Cowork drove the platform end-to-end in a connected Chrome session against `luxury-lifestyle-vault.vercel.app` + hosted Supabase + Stripe sandbox, walking all 30 scenarios in order. Full results: **`docs/testing/llv_test_run_results_2026-06-01.md`**. Test plan updated (environment header + Bug Log populated).

### Result
Core pipelines are solid: onboarding → Stripe payment → active subscription, the full 9-status admin order lifecycle (incl. dispatch + UPS shipment), client ordering (rotations + on-demand with live cost preview), real-time notifications, reporting, audit trail, RBAC, and RLS all verified end-to-end. **4 High** issues (1 is a config fix) + **4 Low** polish bugs found.

### Bugs found → Code prompts written (all in `docs/cowork/`, dated 2026-06-01)
- **High — Save-pricing freeze** (`llv_code_prompt_2026-06-01_save_pricing_freeze.md`): "Save pricing" on a tier hard-freezes the page and never persists; non-Stripe "Save configuration" works → isolated to the Stripe price-creation path.
- **High — Admin concierge queue empty** (`llv_code_prompt_2026-06-01_concierge_queue_empty.md`): `/admin/concierge` shows no messages under any filter despite the dashboard counting "3 open" + client threads existing. Likely a list-query bug; provider messages also have null author.
- **High — Provider portal unreachable** (`llv_code_prompt_2026-06-01_provider_auth_seed.md`): `seedProviders()` never creates a provider auth account or sets `providers.profile_id` → no provider login, Section 7 untestable, provider concierge messages have null author.
- **High (config) — AI search unavailable on Vercel**: Haiku semantic search returns "AI search unavailable"; keyword fallback works. Almost certainly a missing `ANTHROPIC_API_KEY` env var on Vercel. (Noted in `llv_code_prompt_2026-06-01_qa_low_bugs.md`; founder/DevOps to set env var + redeploy.)
- **4 Low bugs** (`llv_code_prompt_2026-06-01_qa_low_bugs.md`): New-Corridor prefilled defaults not in form state; outfit-delete spurious error toast; requested-delivery date off-by-one on review screens; notification bell badge not reactive after "Mark all read".

### Needs founder / dashboard verification
- Stripe dashboard: subscription/customer creation, proration on tier change, refund processing, per-request invoice line items.
- Resend dashboard / dev inbox: email notifications. Inngest dashboard: per-request billing function + seasonal reminder schedules.
- Admin-side return processing (T12.1 steps 4–6) — client initiation verified; admin mark-received + item-location update not exercised.

### Design deviations noted (not bugs)
Tier names/prices in the test plan are stale ($299/$599 + On-Demand add-on is live); on-demand pricing is $28/item flat with total-only display; profile + payment method are concierge-managed (not client self-service); invoice download + billing date filter not wired.

### What's queued for next session
- **Hand the 4 new Code prompts to Claude Code** + set the `ANTHROPIC_API_KEY` env var on Vercel. Relay outcomes so Cowork logs Bug Fix Cycle #25+ and updates the test plan.
- Founder to run the dashboard-dependent verifications (Stripe/Resend/Inngest) above.
- Re-run the affected scenarios after fixes; then the platform is in strong shape for founding-member recruitment + business-strategy work (WI providers remain the soft-launch blocker).

---

## 🏁 Session Summary — May 31, 2026

Engineering-polish planning session (Cowork). Started toward resuming the test plan (Sections 2–13) but Jim pivoted to clearing the engineering-polish queue first. Per DIVISION_OF_LABOR.md, Cowork produced **5 Code prompts** (one per item) in `docs/cowork/` for Claude Code to execute; no application code was written by Cowork.

### Completed this session (Cowork)

- ✅ **Category Art Card design — approved.** Replaced both the Unsplash fetch AND the previously-planned static-Pexels-bundle with deterministic, theme-aware **Category Art Cards**: a bespoke gold line glyph per item category + brand/name in Cormorant Garamond, inside the Obsidian & Ivory system. No image assets, no network, no rate limits; also serves as the empty-state for real clients and is replaced the moment a real photo is uploaded. Mockup reviewed and approved by Jim.
- ✅ **5 Code prompts written** (all dated 2026-05-31, in `docs/cowork/`):
  1. `llv_code_prompt_2026-05-31_photo_seeding_art_cards.md` — Category Art Cards across all render sites + delete Unsplash pipeline + **harden upload** (client-side downscale to ≤2048px + WebP/JPEG re-encode, addressing Jim's storage tech-debt caveat). Seed `ai_analysis` retained (AI search depends on it); seed rows skipped during URL signing.
  2. `llv_code_prompt_2026-05-31_theme_toggle_3state.md` — Light/Dark/System toggle + dev-badge collision fix.
  3. `llv_code_prompt_2026-05-31_cleanup_fk_gap.md` — 7 missing FK-to-profiles tables in clear-all + clear-test-accounts.
  4. `llv_code_prompt_2026-05-31_seeded_badge_label.md` — "X seeded" misnomer on clear ops.
  5. `llv_code_prompt_2026-05-31_tier_active_synced_indicator.md` — tier green-check active-vs-synced semantics.
- ✅ **Polish todos updated** — items moved to "In progress" with prompt references; Unsplash production-access item and the deferred photo-fetch UX badges marked **obsoleted** by the art-card approach.

### What's queued for next session

- **Hand the 5 prompts to Claude Code** (any order; they're independent). As each ships, relay the outcome so Cowork can move the todo item to Completed and add its Bug Fix Cycle entry (#23 onward).
- **Resume test plan Sections 2–13** (`docs/testing/llv_platform_test_plan.docx`) — still the main path to launch. Note: run against the Vercel deployment + hosted Supabase (the plan header still says localhost; environment has since moved). Section 1 passed May 26; Sections 2–13 pending.
- **Business strategy** — 10 assumptions-register items; Wisconsin providers is the soft-launch blocker.

---

## 🏁 Session Summary — May 30, 2026

A massive deployment day — went from "code exists locally" to "fully working test environment on Vercel that any tester can sign up and use." Built the entire production-style infrastructure from scratch and verified the platform's signup-to-active-subscription pipeline end-to-end on both local dev and Vercel deployment.

### Completed this session

**Infrastructure stood up:**
- ✅ **Hosted Supabase project provisioned** (project ref + DB password in Jim's password manager). All 25 migrations pushed.
- ✅ **Vercel deployment live** at `https://luxury-lifestyle-vault.vercel.app` (free Hobby tier, team `jamesloganmueller-4442s-projects`)
- ✅ **Inngest cloud integration** connected via Vercel integration — auto-installs INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY env vars, registers functions at `/api/inngest`
- ✅ **Stripe webhook integration** — local Stripe CLI forwarding to `localhost:3000/api/webhooks/stripe` AND production webhook endpoint configured in Stripe Dashboard pointing at the Vercel URL (6 events: subscription created/updated/deleted, invoice.paid, invoice.payment_failed, setup_intent.succeeded)
- ✅ **Test card flow verified** with `4242 4242 4242 4242` — Stripe Dashboard shows green `Succeeded` charges

**22 bugs shipped (Bug Fix Cycle entries #5–#22, see Section 13 for details):**
- Audit log pill fixes, tier copy cleanup (#5–#7, #10)
- Stripe customer creation self-heal patch (#11)
- Silent onboarding completion failure fix (#12–#13)
- On-Demand tier_type data correction (#14)
- Clear All Test Accounts admin tool + demo accounts seeding (#15–#16)
- Demo accounts in quick-login dropdown (#17)
- NODE_ENV → NEXT_PUBLIC_ENABLE_DEMO_LOGIN feature flag (#18, #20)
- Temp-disabled Unsplash photo fetch (#19)
- **Subscription payment fix — off_session + default_payment_method instead of default_incomplete (#21)** — biggest of the day, unlocked real payments going through
- Onboarding redirect fix (#22) — eventually swapped router.refresh+push for `window.location.href = '/client'` because Vercel was bypassing the cache invalidation

**Documents produced:**
- `docs/cowork/llv_engineering_polish_todos.md` — running list of code-level polish queued for future Code prompts
- `docs/cowork/llv_sql_delete_user.sql` — utility to delete a single user + all FK-cascaded data from hosted DB
- 4 Code prompts in `docs/cowork/` documenting today's handoffs
- `CLAUDE.md` — added Icons coding standard (Lucide only, no emoji in UI)

### Current state

| Layer | Status |
|---|---|
| **Local dev** | ✅ Fully verified — webhooktest3@example.com signup walked end-to-end, subscription active |
| **Vercel deployment** | ✅ Fully verified — vercelsmoke@example.com + finalsmoke@example.com signups walked end-to-end |
| **Stripe Dashboard (test mode)** | ✅ Multiple Succeeded charges visible, 3 subscription products synced (Seasonal Essentials, Seasonal Premier, On-Demand Occasion) |
| **Hosted Supabase** | ✅ All seed data + demo accounts populated, single source of truth shared between local + Vercel |
| **Webhook delivery** | ✅ 200 OK on every event |
| **Demo affordances** | ✅ Visible on both local + Vercel (gated by `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`) |

### What's queued for next session

**Engineering polish** (see `docs/cowork/llv_engineering_polish_todos.md` for full details):

1. **Photo seeding architecture rewrite** — replace Unsplash runtime fetch with static `public/seed-photos/` bundle (~50 photos curated from Pexels). Currently the Unsplash fetch is temp-disabled.
2. **3-state theme toggle (Light/Dark/System)** + visibility fix — current toggle is 2-state and obscured by Next.js dev indicator
3. **Admin visibility + cleanup enhancements** — show all admin accounts in admin panel with optional cleanup-non-current-admins feature
4. **`clear-all.ts` + `clear-test-accounts.ts` FK gap** — 7 missing tables (pricing_change_log, email_sends, admin_settings, reminder_sends, ai_search_logs, notification_template_config, admin_broadcasts) need to be added to the cleanup cascade
5. **"Seeded" badge label misnomer** on clear operations (says "X seeded" when it means "X deleted")
6. **Tier list "active" vs "synced" indicator semantics** — green check only reflects `active`, not whether tier is synced to Stripe

**Testing** (was paused mid-session):

- Test plan Section 2 onwards (`docs/testing/llv_platform_test_plan.docx`) — Section 1 passed; Sections 2–13 pending
- Smoke testing other surfaces on the deployed environment

**Business strategy** (10 items in `docs/strategy/llv_business_strategy_assumptions_register.docx`):

- Wisconsin providers research
- Pricing validation
- Provider partnership terms
- Insurance & liability
- Daughter's formal role
- Capital strategy
- Choke points 3 & 4
- Business entity formation
- Wisconsin storage facility
- Founding member recruitment strategy

### Next session priorities (recommended)

1. **Resume test plan execution** — Sections 2–13 (now that everything works end-to-end)
2. **OR pick a polish item** from the queue (photo seeding rewrite is the most impactful for user-facing demo quality)
3. **OR begin business strategy work** — particularly Wisconsin providers, since they're a soft-launch blocker

The platform is functional. The remaining work is testing, polish, and business operations — none of which are blocked on engineering.

---

## 🏁 Session Summary — May 25, 2026

The May 25, 2026 session ran from blueprint-drift resolution through Phase B completion to launch-readiness in a single sitting. Use this block as the fast briefing for the next session.

### Completed this session

- ✅ **All 12 needs-chat-review items resolved and ratified.** Blueprint Section 5 and handoff Section 7 updated to the ratified stack. Tech Stack Claude Code.docx retired to `docs/archive/`.
- ✅ **Phase A officially 100% complete.** DI-4 unblocked; photo storage abstraction layer shipped (`src/lib/storage/` + migration 009 archive bucket).
- ✅ **Phase B planned end-to-end.** Feature checklist (31 features across 7 groups, 3 sprints) and business strategy assumptions register (10 open items with platform-built working assumptions) delivered as `.docx` in `docs/strategy/`.
- ✅ **Admin Seed Data Manager built.** Env-gated, supports hard reset, idempotent reseeding.
- ✅ **Sprint B1 complete** (6 features) — wardrobe catalog with filters, AI search via Haiku 4.5, seasonal rotation wizard, on-demand request flow, 9-status order lifecycle, admin order management dashboard.
- ✅ **Sprint B2 complete** (15 features) — Stripe sandbox integration (Lion Gate Technology), subscriptions, per-request billing, admin pricing config, Resend email templates, in-app notification center, provider order queue + per-item status updates, service-tier CRUD, corridor management, enhanced onboarding with payment, client dashboard redesign, Phase B item detail view.
- ✅ **Sprint B3 complete** (10 features) — client order history, client settings & preferences, billing history with downloadable invoices, return flow, reporting & analytics with CSV export, audit trail, admin notification triggers + broadcasts, Inngest-scheduled seasonal reminders, provider messaging, outfit builder.
- ⏸️ **B1-05 (wardrobe analytics) deferred** as planned nice-to-have, post-launch.
- ✅ **Comprehensive seed data**: 431 records across 17 tables; 3 fully onboarded client personas with wardrobes, orders, outfits, and concierge messages.
- ✅ **Test plan created**: 13 sections, 30 scenarios, ~150 steps. Lives at `docs/testing/llv_platform_test_plan.docx`.
- ✅ **Test account quick-login selector** added to the login page.
- ✅ **Seed data debugging**: `is_seed_data` flag fixes, hard-reset path, migrations 023 + 024 for Phase B tables.

### Current state

| Track | Status |
|---|---|
| **Phase A** | ✅ COMPLETE |
| **Phase B** | ✅ COMPLETE (31 of 32 features, 1 deferred) |
| **Testing** | 🔧 IN PROGRESS — ✅ Section 1 PASSED (May 26, 2026); Sections 2–13 pending |
| **Business strategy** | ⛔ BLOCKED on testing completion |
| **Tech stack** | ✅ Fully ratified |
| **Documentation** | ✅ All docs current |

### Next session priorities

1. **Execute test plan sections 2–13.** Section 1 (setup & seed data) likely completed already; remaining sections cover the full E2E client + admin + provider journey.
2. **Log bugs, produce fix prompts, verify fixes.** Use the Bug Log section at the bottom of `docs/testing/llv_platform_test_plan.docx`. Each bug surfaces as a Code-targetable fix prompt; Cowork can help shape them.
3. **After all Critical/High tests pass, pivot to business strategy.** Work through the 10 assumptions-register items: WI providers, pricing validation, provider terms, insurance, daughter's role, capital strategy, entity formation, WI storage, founding-member recruitment. Choke points 3 & 4 are post-launch.

Full pre-launch checklist at `docs/strategy/llv_launch_readiness.md`.

---

## 1. Founder Background

- Technology entrepreneur who built and sold a technology company to UnitedHealthcare (~2004).
- Based in Brookfield, Wisconsin. Daughter lives in Tempe, Arizona.
- Technical founder who plans to build the MVP using Claude Code and Cowork.
- Prefers working through documents for continuity rather than long conversation threads.
- Three-tool workflow: Claude Chat (strategy/research), Cowork (documents/coordination), Claude Code (engineering).
- Update this handoff document and any relevant project files at the end of every session.

---

## 2. Business Concept

Luxury Lifestyle Vault (LLV) is a premium managed mobile lifestyle logistics platform for affluent mobile living. The platform enables customers to store, clean, rotate, ship, manage, and eventually resell luxury personal assets through a trusted concierge infrastructure.

**Critical positioning:** LLV is NOT a dry-cleaning company or a clothing rental business. It is a premium logistics and lifestyle continuity platform. The long-term vision extends into luxury lifestyle asset management (handbags, watches, jewelry, collectibles, estate transitions).

---

## 3. Three-Tier Service Model

| Tier | Service | Revenue Model | Engagement |
|------|---------|---------------|------------|
| **Tier 1** | Seasonal Wardrobe Rotation | Subscription (recurring) | Seasonal (Oct & Apr) |
| **Tier 2** | Total Wardrobe Management | Premium add-on | Seasonal (Oct & Apr) |
| **Tier 3** | On-Demand Occasion Fulfillment | Per-request fee | Year-round |

- **Tier 1:** Client sends seasonal wardrobe to LLV for cleaning, pressing, storage, and delivery to destination residence before arrival. Reverse flow when season ends.
- **Tier 2:** LLV manages the entire wardrobe transition. Client arrives to a fully prepared closet — everything cleaned, pressed, organized by category. Lifestyle experience, not logistics.
- **Tier 3:** The key differentiator — no competitor offers this. Client browses their own photographed/cataloged wardrobe remotely, selects specific items (tuxedo, evening gown, shoes for a black-tie event), and LLV pulls, prepares, and ships to arrive in time. Creates year-round engagement.

**Technology implication:** The digital wardrobe catalog must function as a browsable personal shopping interface for the client's own closet — searchable by category, occasion, season, and current location.

---

## 4. Bi-Directional Corridor Model

The pilot operates as a **Wisconsin-to-Arizona corridor**, not a single-market service.

- Snowbird customers maintain primary homes in Wisconsin and seasonal residences in Scottsdale/Phoenix.
- Garments rotate between locations seasonally, with cleaning and preparation at both ends.
- **Founder manages Wisconsin side; daughter manages Arizona side.**
- Technology must track items across multiple locations and states: with client, in storage (WI or AZ), at provider (WI or AZ), in transit, intake pending, delivery scheduled.

**Fall transition (Sep-Oct):** Warm-weather wardrobe cleaned and shipped WI → AZ before client arrives. Winter items at AZ cleaned and stored or shipped north.

**Spring transition (Mar-Apr):** Reverse flow. AZ wardrobe cleaned, stored, or shipped north. WI wardrobe prepared and delivered.

**Future corridor expansion:** Midwest→Florida, Northeast→Carolinas, PNW→California, Canadian→US Sun Belt. Same platform, same playbook, new provider partnerships at each end.

---

## 5. Pilot Market Details

- **Target launch:** October 2026 (start of snowbird season)
- **Initial clients:** 10-15 founding members
- **Estimated budget:** $25,000-$40,000

### Arizona Provider Targets (Researched & Vetted)

- **RAVE FabriCARE** (Scottsdale) — Nationally recognized, already offers clean-by-mail, handles handbags/accessories, recommended by luxury retailers. *Top priority.*
- **European Couture Cleaners** (Phoenix/Scottsdale/Paradise Valley) — Concierge pickup/delivery, couture specialist, handbag cleaning, 40+ years experience.
- **Mastel Dry Cleaning** (Scottsdale) — 50+ years serving luxury hotels and resorts.

### Wisconsin Providers — 🔎 Shortlist researched (June 1, 2026)

Desk research complete — shortlist for outreach in **`docs/strategy/llv_wisconsin_providers_research.md`**. Recommended: **Martinizing Cleaners** (lead — couture/fur/leather/gown preservation + free pickup/delivery, serves Brookfield), **Klinke Cleaners** (Brookfield-local secondary/overflow), **The London Cleaners** (premium couture/leather specialist); alternates: Prestige, Redi-Quick. Tier-4 handbag/leather restoration → national mail-in specialists (Margaret's, Leather Surgeons). **Next:** outreach calls to confirm capacity / B2B terms / insurance / pickup-delivery, then sign 1 primary + 1 secondary and load into the admin panel. *(Still the soft-launch blocker until partners are signed.)*

### Key Referral Channels

- Property management companies handling seasonal homes
- Luxury real estate agents (second-home buyers)
- Country club newsletters and bulletin boards
- Concierge services at high-end resorts
- Wealth management advisors serving retirees

---

## 6. Strategic Target Companies

| Company | Best Fit Type | Strategic Value |
|---------|--------------|-----------------|
| The RealReal | Best Overall Strategic Fit | Luxury asset lifecycle alignment |
| Rent the Runway | Best Operational Fit | Garment logistics infrastructure |
| FASHIONPHILE | Best Future Expansion | Luxury asset category expansion |
| Vivrelle | Best Membership Model | Luxury concierge subscription |
| MY WARDROBE HQ | Closest Conceptual Overlap | Wardrobe lifecycle management |

**Strategy:** Pilot first with real traction, then approach partners from position of strength. Position as a service layer they can't easily build internally. Protect IP with documentation and NDAs before any strategic conversations.

---

## 7. Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS | Fast dev, mobile-responsive, AI tooling support |
| UI Components | Shadcn/UI on Base UI | Accessible primitives, design-system consistency |
| Backend | Next.js API routes and Server Actions | Unified codebase, serverless-ready |
| Database | PostgreSQL via Supabase | Managed, built-in auth, real-time, row-level security |
| Auth | Supabase Auth | Multi-role (client, provider, admin) |
| File Storage | Supabase Storage (Cloudflare R2 cold archival deferred to Phase 4+) | Photo inventory, CDN delivery, RLS-controlled access |
| Background Jobs | Inngest | Durable async — AI categorization, seasonal scheduling, provider dispatch, status notifications |
| Notifications | Twilio (SMS), Resend (email) | Multi-channel, automated triggers |
| Payments | Stripe | Subscriptions, per-request billing, PCI compliance |
| Hosting | Vercel | Serverless, auto-scaling |
| AI | Anthropic Claude API — Haiku 4.5 (photo categorization); Sonnet 4.6 available for higher-tier concierge | Item categorization, concierge, operational intelligence |
| Design System | Obsidian & Ivory palette with gold accent; Cormorant Garamond + Inter; admin styleguide at `/admin/styleguide` | See `docs/cowork/llv_design_system.md` |

---

## 8. Development Timeline

| Period | Activities |
|--------|-----------|
| **Jun-Jul 2026** | Business formation, IP protection, provider outreach, begin platform dev (DB, auth, core UI) |
| **Aug 2026** | Formalize provider partnerships, build scheduling/dispatch, finalize pricing |
| **Sep 2026** | E2E testing with providers, soft marketing to referral channels, founding member recruitment |
| **Oct 2026** | Soft launch with 10-15 founding clients |
| **Oct 2026 - Apr 2027** | Full pilot season, collect data, prove unit economics, build testimonials |

---

## 9. Choke Points Identified & Resolution Status

| # | Choke Point | Status | Resolution |
|---|------------|--------|------------|
| 1 | Customer acquisition cost & trust at launch | ✅ Resolved | Pilot first with real traction, then approach strategic partners. Use premium provider credibility. Target referral channels, not mass marketing. |
| 2 | Unit economics at small scale | ✅ Resolved | Asset-light model — partner with existing premium garment care providers. LLV is the technology/coordination layer, not a facilities company. |
| 3 | Operationally proving MVP before expanding | ⏳ Open | Deferred — discuss after pilot data is available. |
| 4 | TBD | ⏳ Open | To be identified in future session. |

---

## 10. Expansion Roadmap

- **Phase 1:** Seasonal wardrobe storage and delivery
- **Phase 2:** Digital wardrobe management
- **Phase 3:** Luxury resale enablement
- **Phase 4:** Lifestyle asset logistics (handbags, watches, jewelry)
- **Phase 5:** Estate and downsizing services

---

## 11. Three-Tool Workflow

| Tool | Role | Key Output |
|------|------|------------|
| **Claude Chat** | Strategy, research, architecture | Strategic direction, draft documents, market research |
| **Claude Cowork** | Document management, coordination, task breakdown | Polished documents, sprint plans, SOPs, outreach materials |
| **Claude Code** | Engineering, implementation, testing | Production application code |

**Workflow:** Claude Chat defines strategy → Founder saves drafts to local folder → Cowork polishes and maintains documents → Cowork breaks architecture into dev tasks → Claude Code builds the platform. See `DIVISION_OF_LABOR.md` for full details.

---

## 12. Project Documents Reference

| Document | Location | Purpose |
|----------|----------|---------|
| `llv_strategy.docx` | `docs/strategy/` | Executive vision, MVP strategy, expansion roadmap |
| `llv_target_companies.docx` | `docs/strategy/` | Strategic partners and partnership opportunities |
| `llv_strategic_analysis.docx` | `docs/strategy/` | Detailed partnership and market analysis |
| `llv_technology_architecture_blueprint.docx` | `docs/strategy/tech-stack/` | Full system architecture (11 sections) |
| `llv_phase_b_feature_checklist.docx` | `docs/strategy/` | Phase B feature catalog — 31 features across 7 groups, organized into 3 sprints (B1/B2/B3) |
| `llv_business_strategy_assumptions_register.docx` | `docs/strategy/` | 10 open business items with working assumptions the platform is built against, plus space for actual decisions |
| `llv_launch_readiness.md` | `docs/strategy/` | Launch-runway tracker: platform-complete summary, open business strategy items, concrete pre-launch checklist (legal, providers, pricing, recruitment, production, QA) |
| `llv_platform_test_plan.docx` | `docs/testing/` | End-to-end test plan covering Phase A + Phase B — sequential scenarios with pass/fail checkboxes; complete before founding-member recruitment |
| `llv_phase_a_task_breakdown.md` | `docs/cowork/` | Phase A Code-level task breakdown (complete) |
| `llv_phase_b_task_breakdown.md` | `docs/cowork/` | Phase B Code-level task breakdown — Sprint B1 ✅ complete; Sprints B2 + B3 fully detailed (B1-05 tagged nice-to-have) |
| `llv_design_system.md` | `docs/cowork/` | Design system reference (palette, typography, components) |
| `llv_platform_test_plan.docx` | `docs/testing/` | Comprehensive QA test plan — 13 sections, 30 scenarios, ~150 test steps. Covers Critical, High, and Medium priority tests across all platform surfaces. Includes Bug Log table. **Platform must pass all Critical + High tests before founding-member recruitment.** |
| `llv_session_handoff.md` | Project root | This document — running decisions and open items |
| `llv_needs_chat_review.md` | Project root | Items requiring Claude Chat resolution (all 12 resolved May 25, 2026) |
| `DIVISION_OF_LABOR.md` | Project root | Role definitions for Chat, Cowork, and Code |

---

## 12a. Phase B — Digital Wardrobe Management & Launch-Ready Platform

**Phase status:** 🏁 **PHASE B COMPLETE (May 25, 2026).** All 31 required features shipped across all three sprints in a single session. B1-05 (wardrobe analytics) deferred as planned nice-to-have, post-launch. Platform is **launch-ready for the founding-member pilot**.

**Scope:** 31 features across 7 functional groups (Digital Wardrobe Catalog, Order & Request System, Payments & Subscriptions, Notifications & Communication, Provider Portal Expansion, Admin Operations & Configuration, Client Portal Polish & Onboarding), organized into 3 sprints (B1/B2/B3). Target: **October 2026 soft launch** with 10–15 founding members.

**Sprint plan:**

| Sprint | Status | Features | Count |
|--------|------|----------|-------|
| **B1 — Core Client Experience** | ✅ Complete (May 25, 2026) | B1-01, B1-02, B2-01, B2-02, B2-03, B6-01 | 6 |
| **B2 — Payments, Providers & Notifications** | ✅ Complete (May 25, 2026) | B1-03, B2-04, B2-05, B3-01–04, B4-01, B4-02, B5-01, B5-02, B6-02, B6-03, B7-01, B7-02 | 15 |
| **B3 — Polish, Analytics & Nice-to-Have** | ✅ Complete (May 25, 2026) — B1-05 deferred | B1-04, B2-06, B3-05, B4-03, B4-04, B5-03, B6-04, B6-05, B7-03, B7-04 (✅); B1-05 (⏸️ deferred) | 10 + 1 deferred |

**Design principles (apply to every Phase B feature):**

- Admin-configurable over hardcoded (pricing, tier names, services, corridors, providers)
- Data-driven service tiers (Tier 1/2/3 definitions in DB; adding Tier 4 = zero code change)
- Provider-agnostic workflows (swap providers via admin, not code)
- Corridor-extensible (WI-AZ is the pilot; data model supports WI-FL, NY-AZ, etc.)
- Luxury client experience using the ratified design system (Obsidian & Ivory, Cormorant + Inter)

**Authoritative documents:**

- `docs/strategy/llv_phase_b_feature_checklist.docx` — full feature catalog with acceptance criteria.
- `docs/strategy/llv_business_strategy_assumptions_register.docx` — working assumptions for the 10 open business items; the platform is designed so each one is a configuration change, not a code change.
- `docs/cowork/llv_phase_b_task_breakdown.md` — Sprint B1 ✅ complete; Sprints B2 (15 features) and B3 (11 features, B1-05 nice-to-have) fully detailed at Code-level. Full Phase B task plan is now spec-complete through soft launch.

**Open business items now tracked in the assumptions register (no longer blocking platform development):** Wisconsin providers, pricing & packaging, provider terms, insurance & liability, daughter's role, capital strategy, choke points 3 & 4, business entity formation, Wisconsin storage, founding member recruitment. Each has a working assumption built into the platform; actual decisions can be updated via admin panel or DB without code rewrites. See Section 13 below for routing.

---

## 13. Open Items for Next Session

### Build cycle status (latest)

| Date | Reported by | Completed | Reference |
|---|---|---|---|
| June 1, 2026 | Cowork | **🧪 QA TEST RUN — SECTIONS 2–13 EXECUTED** against the live Vercel deployment (browser-driven). All 30 scenarios walked in order. **Core pipelines solid** (onboarding→payment→active sub, full 9-status order lifecycle incl. dispatch+UPS shipment, client ordering w/ live cost preview, real-time notifications, reporting, audit, RBAC, RLS). Found **4 High** (Save-pricing freeze; admin concierge queue empty; provider portal unreachable / no provider auth seed; AI search unavailable on Vercel = likely missing `ANTHROPIC_API_KEY`) + **4 Low** (corridor prefilled defaults; outfit-delete toast; date off-by-one; bell badge not reactive). **4 new Code prompts written** (`docs/cowork/llv_code_prompt_2026-06-01_*.md`). Test plan env header + Bug Log updated. | June 1 Session Summary block (top of doc); **`docs/testing/llv_test_run_results_2026-06-01.md`** (full per-section results); Bug Fix Cycle #25–#32 below. |
| May 31, 2026 | Founder + Cowork | **🎨 ENGINEERING POLISH IN FLIGHT.** Pivoted from test-plan resumption to clearing the polish queue. Cowork wrote **6 Code prompts** (`docs/cowork/llv_code_prompt_2026-05-31_*.md`): photo-seeding → Category Art Cards + upload hardening; 3-state theme toggle; clear-all/clear-test-accounts FK gap; "seeded" badge label; tier active-vs-synced indicator; accessories glyph inference. **Bug Fix Cycle #23 SHIPPED** — Category Art Cards (14 gold glyphs) replace the Unsplash seed fetch across 9 render sites; upload pipeline hardened (downscale ≤2048px + WebP/JPEG). Remaining 5 prompts queued for Code. A flip-card idea (click → reveal real photo) was assessed and **declined** (the art card exists only when there's no photo, so there's nothing to flip to). | May 31 Session Summary block (top of doc); Bug Fix Cycle #23 below; `docs/cowork/llv_engineering_polish_todos.md`. |
| May 28–30, 2026 | Founder + Cowork | **🚀 DEPLOYED + 22 BUGS SHIPPED.** Hosted Supabase provisioned (25 migrations pushed), Vercel deployment live (`luxury-lifestyle-vault.vercel.app`), Inngest cloud + Stripe webhooks wired, test-card flow verified. Signup → active-subscription verified end-to-end on **both** local and Vercel. Bug Fix Cycle **#5–#22** — audit-log entity-type fixes, tier copy cleanup, Stripe customer self-heal, silent onboarding-completion fix, on-demand tier_type correction, Clear-All-Test-Accounts + demo-account seeding, NODE_ENV→NEXT_PUBLIC_ENABLE_DEMO_LOGIN flag, Unsplash interim disable, subscription off_session payment fix, onboarding redirect fix. | May 30 Session Summary block; Bug Fix Cycle #5–#22 below. |
| May 26, 2026 | Founder + Cowork | **✅ TEST PLAN SECTION 1 PASSED.** Dev environment verified, seed data manager exercised end-to-end (full population, idempotency, clean removal, re-seed). 4 bugs surfaced during the run and all 4 fixed in-session: (1) Clear All FK ordering on `billing_history_cache` / `item_photos` / `client_profiles` (Medium); (2) Wardrobe photos not displaying — missing `public_url` from Unsplash fetch + Suspense hydration blanking (High); (3) Outfit cards "No items" due to photo query missing `public_url` (Medium); (4) `npm run verify` failing with 21 errors / 22 warnings — unused vars, unescaped entities, prefer-const, ts-ignore (Medium). T1.2 step 6 expected counts updated in test plan to reflect actual seed (99 items / 99 photos / 431 total records). **Next: Section 2 (Admin Configuration).** | Bug Fix Cycle table below; `docs/testing/llv_platform_test_plan.docx` (T1.2 step 6 updated). |
| May 25, 2026 | Founder + Cowork | **🏁 SESSION WRAP-UP.** Phase A complete, Phase B complete (31/32, B1-05 deferred), test plan created (13 sections, 30 scenarios, ~150 steps), seed data built (431 records, 17 tables, 3 client personas), test account quick-login selector live. Migrations through 024. **Testing is the current phase; business strategy items remain blocked until Critical/High tests pass.** | Session Summary block at the top of this document captures everything completed. Test plan at `docs/testing/llv_platform_test_plan.docx`. |
| May 25, 2026 | Founder | **🏁 PHASE B COMPLETE.** 31 of 32 required features shipped across all three sprints in a single session. B1-05 (wardrobe analytics) deferred as planned nice-to-have, post-launch. Stripe sandbox integrated via Lion Gate Technology. Email notifications live via Resend. AI wardrobe search shipping on Haiku 4.5. Provider portal operational with order queue + status tracking. **Platform is launch-ready for the founding-member pilot.** Final route and migration count per Code's build report. | All Phase B features marked ✅ Done in `docs/cowork/llv_phase_b_task_breakdown.md`. Launch-readiness checklist at `docs/strategy/llv_launch_readiness.md`. |
| May 25, 2026 | Founder | **🏁 SPRINT B3 COMPLETE.** All 10 B3 features delivered: B7-03 (client order history), B7-04 (client settings & preferences), B3-05 (billing history & invoices), B2-06 (return flow), B6-04 (reporting & analytics), B6-05 (audit trail), B4-03 (admin notification triggers), B4-04 (seasonal rotation reminders), B5-03 (provider messaging), B1-04 (outfit builder). B1-05 deferred. | All B3 features marked ✅ Done in `docs/cowork/llv_phase_b_task_breakdown.md`. |
| May 25, 2026 | Founder | **🏁 SPRINT B2 COMPLETE.** All 15 B2 features delivered: B1-03 (item detail), B2-04 (provider dispatch), B2-05 (shipping), B3-01 (Stripe sandbox via Lion Gate Technology), B3-02 (subscriptions), B3-03 (per-request billing), B3-04 (admin pricing config), B4-01 (Resend emails), B4-02 (in-app notifications), B5-01 (provider order queue), B5-02 (provider status updates), B6-02 (tier & pricing config), B6-03 (corridor management), B7-01 (enhanced onboarding with payment), B7-02 (client dashboard redesign). | All B2 features marked ✅ Done in `docs/cowork/llv_phase_b_task_breakdown.md`. |
| May 25, 2026 | Cowork | **🟢 Sprint B3 task breakdown delivered.** All 11 B3 features expanded to Code-level detail, sequenced in founder's build order: B7-03 → B7-04 → B3-05 → B2-06 → B6-04 → B6-05 → B4-03 → B4-04 → B5-03 → B1-04 → B1-05 *(nice-to-have)*. Phase B task plan is now spec-complete through soft launch. Code can pick up B3 as soon as B2 wraps. | `docs/cowork/llv_phase_b_task_breakdown.md` (Sprint B3 detailed). |
| May 25, 2026 | Founder | **🏁 SPRINT B1 COMPLETE.** All 6 features delivered: B1-01 (wardrobe browse & filter), B1-02 (AI-powered search via Haiku 4.5), B2-01 (seasonal rotation request), B2-02 (on-demand item request with cost preview), B2-03 (order lifecycle — 9 statuses), B6-01 (admin order management dashboard with provider assignment). **31 routes, clean build.** Next: Sprint B2 (payments, providers, notifications). | All Sprint B1 features marked ✅ Done in `docs/cowork/llv_phase_b_task_breakdown.md`. |
| May 25, 2026 | Chat + Cowork | **🟢 PHASE B PLANNING COMPLETE.** Feature checklist (31 features / 7 groups / 3 sprints) and business strategy assumptions register (10 open items with working assumptions) delivered. Phase B target: October 2026 soft launch with 10–15 founding members. Sprint B1 task breakdown produced for Code to begin. | `docs/strategy/llv_phase_b_feature_checklist.docx`; `docs/strategy/llv_business_strategy_assumptions_register.docx`; `docs/cowork/llv_phase_b_task_breakdown.md` (Sprint B1 detailed). |
| May 25, 2026 | Founder | **Admin Seed Data Manager shipped.** Migration 010 adds env-gated seed routine: 5 demo clients with realistic profiles, 36 demo items spanning categories, full seed suite (addresses, conditions, photos paths). Admin can reset/reseed without touching the DB. | Migration `010_seed_data_manager.sql` in `supabase/migrations/`; admin route gated by env flag. |
| May 25, 2026 | Chat (resolution) | **🏁 PHASE A FULLY COMPLETE.** All 12 `llv_needs_chat_review.md` items resolved by Chat. DI-4 unblocked — Phase A operates on Supabase Storage with a clean storage abstraction layer (R2 cold archival deferred to Phase 4+). Blueprint Section 5 and handoff Section 7 updated to reflect ratified stack (Supabase, Supabase Auth, Supabase Storage, Resend, Vercel, Inngest, Shadcn/UI, Haiku 4.5, ratified design system). `docs/tech-stack/Tech Stack Claude Code.docx` retired to `docs/archive/`. | `llv_needs_chat_review.md` (all items in Resolved section); `docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx` Section 5; `docs/cowork/llv_phase_a_task_breakdown.md` DI-4 unblocked. |
| May 24, 2026 | Founder | **🏁 PHASE A COMPLETE.** 21 of 22 tasks delivered. 25 routes, 8 migrations, clean build. OE-4 location enum + migration 007 shipped, UI-1 typography primitives shipped and enforced, `/admin/styleguide` live for design QA. Only DI-4 (photo storage strategy) remains held — blocked on Chat resolution of needs-chat-review Item 3. | All Phase A sprints A1/A2/A3 marked ✅ Complete in `docs/cowork/llv_phase_a_task_breakdown.md`. Chat session prep at `docs/cowork/llv_chat_session_prep.md`. |
| May 24, 2026 | Founder | **Sprint A2 nearly complete.** 24 routes live. OE-3 admin inventory detail, CX-7 concierge messaging (table-backed), PN-2 provider portal landing all delivered. OE-4 unblocked — founder approved enum approach for location vocabulary; migration 007 in progress. Sprint A2 remainder: UI-1, OE-5. DI-4 still held pending Chat. | Phase A tasks OE-3, CX-7, PN-2 marked ✅ Done and OE-4 marked 🔧 In progress in `docs/cowork/llv_phase_a_task_breakdown.md`. |
| May 24, 2026 | Founder | **Sprint A1 complete.** 20 routes live, clean build. Capabilities now in place — see "Current codebase capabilities" below. | Phase A tasks F-1, F-2, F-3, CX-1, CX-2, CX-3, CX-4, CX-5, CX-6, OE-1, OE-2, PN-1, DI-1, DI-2, DI-3 marked ✅ Done in `docs/cowork/llv_phase_a_task_breakdown.md`. DI-4 remains blocked on Chat resolution of needs-chat-review Item 3. |
| May 24, 2026 | Founder | Photo system shipped — drag-and-drop uploader, gallery with lightbox, 5-step intake form, wardrobe grid with thumbnails | Phase A tasks DI-2, CX-2, CX-3, CX-4 (first reported as a partial cut; superseded by Sprint A1 row above) |

Cowork updates this table when the founder reports build progress. Cross-reference task IDs to the Phase A breakdown for acceptance criteria and what changed in the codebase.

### Current codebase capabilities (as of May 25, 2026 — Phase B complete, launch-ready)

Delivered through Phase A (Sprints A1, A2, A3 all complete) — verifiable in the live build:

- **Client dashboard** with status tiles, quick actions, and activity feed.
- **Address management** with corridor-aware WI/AZ copy.
- **Client onboarding flow** — 4-step stepper with middleware gating until completion.
- **Admin dashboard** with client counts, item status grid, and concierge queue.
- **Admin client roster** with search, filters, and per-client detail pages.
- **Admin inventory detail** — item search across all clients and per-item admin view with status-transition controls and condition logging (OE-5).
- **Controlled location vocabulary** — `item_location` enum (migration 007) supports the WI/AZ corridor model: client/storage/provider/in-transit on both sides.
- **Concierge messaging** — table-backed client-to-LLV message channel with admin queue.
- **Provider CRUD** — create, edit, deactivate, reactivate.
- **Provider portal landing** — Phase A scope (welcome page, contact channel, deferred-functionality copy).
- **AI photo categorization** — Haiku 4.5 via Inngest, async on photo upload.
- **Photo upload system** — drag-and-drop uploader, gallery with lightbox, integrated into intake and item detail.
- **Typography primitives** — `<Display>`, `<H1>`–`<H3>`, `<Body>`, `<BodySmall>`, `<Caption>`, `<Mono>` exported from `src/components/ui/typography.tsx`; type scale enforced; `/admin/styleguide` page live for design QA.
- **Photo storage abstraction** — `src/lib/storage/constants.ts` + `server.ts` wrap Supabase Storage behind a provider-agnostic `PhotoStorage` interface; archive bucket `item-photos-archive` (migration 009) with admin-write + client-read-own policies; future R2 swap is a one-file change.
- **Admin Seed Data Manager** — env-gated seed routine with hard-reset and idempotent reseed; produces **431 records across 17 tables** including **3 fully onboarded client personas** (Margaret Hartwell, Catherine Beaumont, James Thornton) with wardrobes, orders, outfits, and concierge messages. Initial seed at migration 010; Phase B tables added in migrations 023 + 024.
- **Wardrobe catalog with AI search** (Sprint B1) — `/client/wardrobe` upgraded with multi-filter (category, occasion, season, color, brand, location), grid/list toggle, sort, pagination, and a Haiku 4.5 natural-language search box that ranks items against AI-categorized metadata.
- **Seasonal rotation request wizard** (Sprint B1) — `/client/rotations/new` multi-step flow: items → destination → date → review. Creates `orders` rows with `order_type = seasonal_rotation`.
- **On-demand item request flow** (Sprint B1) — "Request this item" CTA on catalog and item detail; modal flow with destination, delivery date, special instructions, and live cost preview pulled from `service_tiers` (founding-member discount applied automatically).
- **Order lifecycle — 9 statuses** (Sprint B1) — `requested` → `confirmed` → `dispatched_to_provider` → `in_preparation` → `shipped` → `delivered` → `return_initiated` → `return_received`, plus `cancelled`. Transition map in `src/types/app.ts`; admin-only transitions enforced in `src/actions/orders.ts`; append-only `order_status_history` audit table.
- **Client order tracking** (Sprint B1) — `/client/orders` list with status filters; `/client/orders/[id]` detail page with vertical status timeline, items, destination, cost, and "Cancel order" action gated by the state machine.
- **Admin order management dashboard** (Sprint B1) — `/admin/orders` with multi-filter list (status, client, type, corridor, provider, date range), calendar view toggle, bulk actions (assign provider, transition status), and `/admin/orders/[id]` detail with status panel + provider assignment + admin notes + full audit trail. Open-order count tile on `/admin`.
- **Stripe sandbox integrated** (Sprint B2, via Lion Gate Technology) — customer creation on signup, subscription management for Tier 1/2, per-request billing for Tier 3, admin pricing configuration backed by `service_tiers`, webhook handling with idempotency.
- **Email notifications via Resend** (Sprint B2) — branded HTML templates for order lifecycle and payment events; per-client and per-template preference controls; CAN-SPAM-compliant unsubscribe; dev-mode inbox for QA.
- **In-app notification center** (Sprint B2) — bell icon with realtime unread count, notification drawer + full page, filter by type, mark-all-read.
- **Provider portal — fully operational** (Sprint B2) — order queue with accept/decline + per-item service stage updates (received → cleaning → pressing → ready_for_pickup) + optional photo upload + per-order messaging back to admin (Sprint B3 B5-03).
- **Admin pricing & corridor configuration** (Sprint B2) — admin CRUD for `service_tiers` (B6-02) with grandfathering on Stripe price changes; corridor management (B6-03) supporting WI-AZ pilot and future corridors as pure data.
- **Enhanced onboarding with payment** (Sprint B2) — 6-step flow ending in Stripe Setup Intent + subscription activation; middleware gates `/client/*` until subscription is active.
- **Client dashboard, settings & history** (Sprint B2/B3) — luxury concierge dashboard composition (B7-02); `/client/settings` with billing, notifications, addresses, account sub-pages (B7-04); full `/client/orders` history with type/date filters and printable summaries (B7-03); billing history with downloadable Stripe invoices (B3-05).
- **Return flow** (Sprint B3) — client-initiated returns for delivered orders; admin marks return received → items re-enter storage automatically.
- **Reporting & analytics** (Sprint B3) — `/admin/reports` with KPIs (active clients, MRR, per-request revenue, pipeline), revenue trend chart, fulfillment performance, provider performance; CSV export.
- **Audit trail** (Sprint B3) — unified `admin_audit_log` capturing every admin mutation; `/admin/audit` browser with filter + diff view + CSV export.
- **Admin notification triggers & seasonal reminders** (Sprint B3) — template-level enable/disable per channel; per-client overrides; broadcast-to-all flow; Inngest-scheduled seasonal rotation reminders at configurable lead days.
- **Outfit builder** (Sprint B3) — save groupings of items as named outfits; request whole outfits via the on-demand flow; outfits surface in AI search alongside individual items.
- **Build state:** All Phase A + Phase B features shipped and building clean. Migration count through 024 (Phase B tables completed in migrations 023 + 024). Final route count per Code's build report.
- **Test account quick-login selector** on the login page for fast persona switching during QA — surfaces the three seeded client personas plus admin.

**Deferred:** B1-05 (wardrobe analytics) — nice-to-have, post-launch. Skipping does not block any launch surface.

**Phase A held items:** *(none — DI-4 unblocked May 25, 2026)*
- **DI-4** (photo storage strategy) — ✅ **Unblocked May 25, 2026.** Ruling: Supabase Storage buckets with a clean abstraction layer (storage service interface) so a future R2 migration is straightforward. No R2 integration needed now; cold archival deferred to Phase 4+.

**Next phase: Testing, then business strategy.** Platform is code-complete and launch-ready. The path to October 2026 soft launch runs through QA first, then business operations:

1. **Platform testing** *(CURRENT PHASE)* — Founder executes `docs/testing/llv_platform_test_plan.docx` (13 sections, 30 scenarios, ~150 steps). **All Critical and High priority tests must pass before founding-member recruitment begins.** Bugs reported in Chat → Chat produces Code prompts → Code fixes → founder re-tests → tracked in the Bug Fix Cycle table below.
2. **Business strategy resolution** — Work through the 10 open items in `docs/strategy/llv_business_strategy_assumptions_register.docx` (WI providers, pricing validation, provider terms, insurance, daughter's role, capital strategy, choke points, entity formation, WI storage, founding-member recruitment). Each is configuration-only; no code changes required.
3. **Founding-member recruitment** — Build outreach materials, work personal/referral channels, recruit 10–15 founding members.
4. **Provider onboarding** — Sign WI provider(s); confirm AZ provider(s) (RAVE FabriCARE, European Couture Cleaners); load real provider data into the admin panel.
5. **Launch preparation** — LLC formation, trademark filing, bailee insurance, switch Stripe from sandbox to live, deploy to Vercel production with a custom domain, set up production Supabase project, draft ToS/privacy policy, remove seed-data tools from production, end-to-end smoke test of the full client journey.

Full launch-readiness checklist at `docs/strategy/llv_launch_readiness.md`.

### Bug Fix Cycle

Founder tests the platform using `llv_platform_test_plan.docx`. When a test fails:
1. Founder describes the bug in **Claude Chat**.
2. Chat diagnoses and produces a **Code prompt** describing the fix.
3. Founder pastes the Code prompt into **Claude Code** to implement the fix.
4. Founder re-tests to confirm the bug is resolved.
5. Bug is logged below.

| # | Date | Priority | Area | Description | Status |
|---|------|----------|------|-------------|--------|
| 1 | May 26, 2026 | Medium | Seed Data | Clear All FK ordering — `billing_history_cache`, `item_photos`, and `client_profiles` deleted in wrong order causing 5 FK constraint errors. | ✅ FIXED |
| 2 | May 26, 2026 | High | Wardrobe | Wardrobe photos not displaying — `public_url` column not populated by Unsplash fetch script, plus hydration Suspense issue blanking photos on render. | ✅ FIXED |
| 3 | May 26, 2026 | Medium | Outfits | Outfit cards showing "No items" — `item_photos` query missing `public_url` column. | ✅ FIXED |
| 4 | May 26, 2026 | Medium | Code Quality | `npm run verify` failing with 21 errors and 22 warnings — unused vars, unescaped entities, prefer-const, ts-ignore. | ✅ FIXED |
| 5 | May 28, 2026 | High | Audit Log | `src/actions/orders.ts` wrote `entityType: 'order'` (singular) at 3 sites (`order.status_transition`, `order.refunded`, `order.return_received`) while the Orders pill on `/admin/audit` filters on `'orders'` (plural). Every real order-action audit entry was invisible to the pill filter. Standardized on plural. | ✅ FIXED |
| 6 | May 28, 2026 | Medium | Audit Log | Seed-audit emitted `entity_type = 'provider_order_assignments'` for `provider.assigned` events but no pill surfaced them — entries only reachable via "All". Rolled under `entity_type = 'orders'` so dispatch actions appear under the Orders pill (matches admin mental model). | ✅ FIXED |
| 7 | May 28, 2026 | Low | Audit Log | Pill labeled "Service Tiers" was leaking the database table name into the UI. Renamed to "Pricing" (underlying filter value unchanged: `service_tiers`). | ✅ FIXED |
| 8 | May 28, 2026 | Low | Tiers / Copy | Internal "Tier 1/2/3" shorthand leaking into two user-facing surfaces: client onboarding copy ("On-demand requests (Tier 3) are available…") and admin tier-edit form section label ("Tier 3 billing"). Rewrote onboarding to drop the parenthetical and renamed admin label to "On-demand billing". Tier 1/2/3 vocabulary preserved everywhere it's internal (code comments, seed files, strategy docs). | ✅ FIXED |
| 9 | May 28, 2026 | Low | Audit Log | Items and Pricing pills on `/admin/audit` appeared empty. Root cause: seed-audit.ts had been edited (Bug #6 fix above) but the audit seed hadn't been re-run, so the 4 items + 4 service_tiers entries weren't in the DB. No code change needed — resolved by re-running the "Admin Audit Log" individual seed script (additive + idempotent). Operational note: re-run audit seed after any seed-audit.ts edits. | ✅ FIXED |
| 10 | May 29, 2026 | High | Migrations | `supabase db push` to hosted project failed on migration 002 with `function uuid_generate_v4() does not exist`. Root cause: hosted Supabase installs `uuid-ossp` into the `extensions` schema (not `public`), so unqualified `uuid_generate_v4()` calls are unreachable. Migrations 002 (6 sites) and 007 (1 site) used the old function; all migrations from 011 onward correctly use `gen_random_uuid()` (Postgres built-in). Updated migrations 002 + 007 to use `gen_random_uuid()` and re-ran push successfully (all 24 migrations applied to hosted project). | ✅ FIXED |
| 11 | May 29, 2026 | High | Onboarding / Stripe | New signups on deployed env hit "Stripe customer not yet created" 500 at payment step. Root cause: architectural ordering bug — `inngest.send('profile/created')` is only fired by `completeOnboarding()`, but `createSetupIntent()` runs BEFORE that step during payment. So `client_profiles.stripe_customer_id` is always null when the payment step asks for it. Fixed by making `createSetupIntent` self-heal: if customer is missing, create it inline using same idempotencyKey as Inngest function (`profile_<user_id>`) so no duplicates can occur. `src/actions/stripe.ts` — ~25 line change. | ✅ FIXED |
| 12 | May 29, 2026 | High | Onboarding / Subscriptions | "Confirm & start membership" silently failed — button click appeared to do nothing, page stayed on Review screen. Root cause: Supabase JS `.update()` returns `{data, error}` rather than throwing; the `profiles.onboarding_complete = true` update was silently failing, then `router.push('/client')` ran, then middleware saw `onboarding_complete = false` and bounced the user straight back to `/client/onboarding`. Fixes (via Claude Code per DIVISION_OF_LABOR.md): (a) `profiles.onboarding_complete` update now throws on failure — this is the middleware gate, it MUST succeed; (b) `client_subscriptions` insert + `subscription_active` update made non-blocking but log via `console.error` to Vercel logs; (c) `createSetupIntent` upsert also logs on failure. | ✅ FIXED |
| 13 | May 29, 2026 | High | Onboarding / Catch logic | Related to #12. The catch block in `handleActivate` pattern-matched on `'no stripe customer'` but `createSubscription` actually throws `'Stripe customer not found'`. So the fallback toast "Membership activated. Concierge will configure billing." never fired for that error class. Broadened the pattern to match. | ✅ FIXED |
| 14 | May 29, 2026 | Low | Tier data | `On-Demand Occasion` tier showed `tier_type = 'subscription'` in admin panel — should be `'on_demand'` (per-request, not a subscription product). Fix: migration 025 corrects the value. Requires `npx supabase db push` to apply to hosted project. | ✅ FIXED (pending push to hosted) |
| 15 | May 29, 2026 | Medium | Seed / Cleanup | Clear All Seed Data only removed `is_seed_data = true` rows — leftover test-signup accounts (created during deployed testing) had no cleanup path inside the app. New `clearAllTestAccounts()` server action + preview-then-confirm UI in admin seed panel; deletes non-admin users + cascades through 19 FK-safe table sequence. Gated by `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` so it disappears in true production. | ✅ FIXED |
| 16 | May 29, 2026 | Medium | Seed / Demo | `demo.admin@llv.dev` and `demo.client@llv.dev` were referenced by the demo-login buttons and the `signInAsDemo` action but never seeded. New `seedDemoAccounts()` script — idempotent — creates both auth users, fully onboards the demo client (2 addresses, subscription on Seasonal Essentials, 6 wardrobe items, 1 completed order). Added to `SEED_MANIFEST` and `seedAll()` pipeline. | ✅ FIXED |
| 17 | May 29, 2026 | Low | Login UI | Quick-login dropdown in `login-form.tsx` listed the 5 client personas and the dev admin but not the demo accounts. Added `Demo — Admin` and `Demo — Client (fully onboarded)` to top of `QUICK_ACCOUNTS`. | ✅ FIXED |
| 18 | May 29, 2026 | High | Login UI / Env | Demo-login UI (dropdown, demo buttons, `signInAsDemo` action) was gated by `process.env.NODE_ENV !== 'production'`, which is always false on Vercel — so demo affordances were invisible on the deployed test environment. Replaced every gate with `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'` feature flag. To enable on Vercel: add env var `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` and redeploy. Removing the var disables all demo affordances when going live. | ✅ FIXED |
| 19 | May 30, 2026 | Medium | Seed / Unsplash | Interim disable — `fetchUnsplashPhotos()` was burning through the Unsplash 50 req/hr demo cap due to (a) a 403 vs 429 rate-limit detection bug and (b) the cap being insufficient for the ~118-photo seed. Seed All would hang for ~5+ minutes on this step and leave the quota at −56/50. Commented out the call in `seed-all.ts` and replaced with a stub result. Changed the standalone "Fetch Wardrobe Photos" button to open a dialog explaining the temp disable instead of running the broken script. Both changes are reversible (one-line uncomment). Proper fix (static `public/seed-photos/` bundle) tracked in `llv_engineering_polish_todos.md`. | ✅ FIXED (interim) |
| 20 | May 30, 2026 | Low | Login UI | Bug #18 cleanup miss — `src/app/(auth)/auth/login/page.tsx` line 25 still wrapped `<DemoLogin />` in the old `NODE_ENV !== 'production'` gate. In production builds (local and Vercel) the demo client/admin buttons never rendered even though `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` was set. Quick Login dropdown was unaffected since `login-form.tsx` was correctly migrated. Removed the wrapper entirely — `DemoLogin` self-gates internally so the outer check was redundant. | ✅ FIXED |
| 21 | May 30, 2026 | High | Subscriptions / Stripe | New client signups left subscriptions stuck at `status=incomplete` because `createSubscription` used `payment_behavior: 'default_incomplete'` — a mode designed for SCA flows that requires client-side PaymentIntent confirmation we never performed. Result: invoice generated, PaymentIntent created, but never confirmed → `invoice.payment_succeeded` never fired → subscription never transitioned to active → no actual money charged. Fixed by fetching the customer's default payment method (set during SetupIntent flow), passing it explicitly to `subscriptions.create` with `off_session: true`, and removing `payment_behavior: 'default_incomplete'`. Applied same pattern to `adminSetSubscription`. Surfaced via local Stripe CLI webhook testing. | ✅ FIXED |
| 22 | May 30, 2026 | Medium | Onboarding UI | After successful "Confirm & start membership," `router.push('/client')` did not auto-navigate users to the client dashboard — they stayed on `/client/onboarding` until manual refresh. DB data correct; only client-side navigation failing. Initial fix (`router.refresh()` + `router.push`) worked locally but not on Vercel. Switched both call sites to `window.location.href = '/client'` (hard browser navigation, bypasses Next.js router entirely). Removed now-unused `useRouter` import and instance. | ✅ FIXED |
| 23 | May 31, 2026 | Medium | Seed / Wardrobe UX | Replaced the Unsplash runtime seed-photo fetch with deterministic, theme-aware **Category Art Cards**. New `src/components/wardrobe/category-glyphs.tsx` (14 single-weight gold line glyphs: 6 canonical from spec + 8 new) and `category-art-card.tsx` (server-safe, CSS-var themed, size grid/list/detail). Wired into 9 render sites (wardrobe grid/list/search, item detail, all 4 outfit pages + 2 outfit form components, orders, admin inventory detail). URL-signing loops skip `seed-main.jpg` paths so seed items deterministically show art cards; `ai_analysis` rows retained for AI search. Deleted `fetch-unsplash-photos.ts` + `scripts/fetch-seed-photos.ts`; stripped Unsplash plumbing from `seed-all.ts`, `manifest.ts`, `seed-runner.tsx` (disabled dialog, rate-limit badge, Unsplash log all gone); removed `images.unsplash.com` from `next.config.ts`. **Upload hardened:** `uploadItemPhoto` now runs `toJpeg → downscaleAndEncode → validate`; `downscaleAndEncode` caps longest edge at 2048px and re-encodes WebP@0.82 (JPEG@0.85 fallback) via canvas — ends full-resolution-original storage. `npm run verify` clean; pushed to main. | ✅ FIXED |
| 24 | May 31, 2026 | Low | Wardrobe UX | Accessories glyph inference: for items in the `accessories` category, infer the glyph from keywords in the item name rather than always showing the fallback bow-tie. Added 6 named glyph components (`NecktieGlyph`, `BowTieGlyph`, `NecklaceGlyph`, `ScarfGlyph`, `WatchGlyph`, `GemGlyph`) and `ACCESSORY_GLYPH_RULES` (bow-tie tested before tie to avoid substring collision). `CATEGORY_GLYPHS['accessories']` now points at `GemGlyph` (faceted gem as fallback). New `resolveGlyph(category, name, className)` helper returns `React.ReactElement` directly — avoids `react-hooks/static-components` lint error that firing when returning a component reference. `CategoryArtCard` updated to call `{resolveGlyph(category, name, 'w-full h-full')}` inline. `GlyphFC` narrowed from `React.FC` to `(props) => React.ReactElement` to fix return-type mismatch. `npm run verify` clean; pushed to main. | ✅ FIXED |
| 25 | June 1, 2026 | High | Admin / Pricing | **Save-pricing freeze — ROOT CAUSE FOUND (not a Stripe hang).** `tier-edit-form.tsx:185` gated the price save on a **native `window.confirm()`** then `if (!ok) return`; the native dialog blocked the page so during QA it was dismissed → save returned early → price never persisted. Fixed as part of the native-dialog sweep (#33) — Save pricing now uses the custom `useConfirm()` dialog. ✅ **Re-tested June 1 (Cowork):** changing Seasonal Essentials $299→$309 now shows the custom "New Stripe price" dialog (no native chrome, no freeze), and the price **persists** on reload + the pricing change log increments. Reverted to $299. | ✅ FIXED & VERIFIED |
| 26 | June 1, 2026 | High | Admin / Concierge | **Admin concierge queue empty.** `/admin/concierge` page used `.select('*, profiles(...)')` against a table with two FKs to profiles (`client_id` mig 007 + `author_profile_id` mig 021) → PostgREST ambiguity error → page silently rendered empty. Fixed with `!client_id` disambiguation hint (no re-seed needed). ✅ **Re-tested June 1 (Cowork):** queue now lists client + provider messages with source badges, View-order links, status actions; Provider source filter isolates the RAVE message. | ✅ FIXED & VERIFIED |
| 27 | June 1, 2026 | High | Seed / Providers | **Provider portal unreachable.** `seedProviders()` now creates a Supabase auth user per provider → trigger creates profile → sets `role='provider'` + links `providers.profile_id` (idempotent, repairs null links). `seedConcierge()` patches provider-message authors on re-run. RAVE + European Couture added to quick-login (all 5 providers use `TestLLV2026!`). ✅ **Re-tested June 1 (Cowork):** ran Providers seed (5 seeded) + Concierge; quick-login as European Couture → `/provider` shows "Welcome, Sophia Marchetti" with the order queue ("Awaiting your response (1)" = the #C9892E85 dispatch + 2 active orders). ⚠️ But the provider order **detail** page 404s — new bug #34. | ✅ FIXED & VERIFIED (login + portal queue) |
| 28 | June 1, 2026 | High (config) | AI Search | **AI semantic search unavailable on Vercel.** Natural-language wardrobe search returns "AI search unavailable — showing best-effort matches"; keyword fallback works. Almost certainly a missing `ANTHROPIC_API_KEY` env var on Vercel. Surfaced T4.2. | 🆕 OPEN — config: set env var + redeploy (noted in `llv_code_prompt_2026-06-01_qa_low_bugs.md`) |
| 29 | June 1, 2026 | Low | Admin / Corridors | New Corridor modal's prefilled origin/destination code defaults ("WI"/"AZ") aren't in form state → false "All fields are required" unless retyped. Surfaced T2.2. Fix: initialize `useState('WI')` / `useState('AZ')` in `corridor-create-form.tsx`. ✅ Re-tested & verified June 1 (Cowork): "Defaults Fixed Check" created with the prefilled origin "WI" (never retyped) → WI↔TX, "Corridor created". | ✅ FIXED & VERIFIED |
| 30 | June 1, 2026 | Low | Client / Outfits | Outfit delete succeeds but shows a spurious "Failed to delete outfit" error toast. Surfaced T4.4. Fix: removed `redirect()` from `deleteOutfit` server action (NEXT_REDIRECT was being caught as an error); client component now calls `router.push('/client/outfits')` on success. ✅ Re-tested & verified June 1 (Cowork): created + deleted a throwaway outfit → no error toast, outfit removed, others intact. | ✅ FIXED & VERIFIED |
| 31 | June 1, 2026 | Low | Orders / Dates | Requested-delivery date shows one day early on mid-flow review/details/dispatch-modal screens (final saved date correct) — timezone/UTC parsing. Surfaced T5.1/T5.2/T6.2. Fix: replaced `new Date('YYYY-MM-DD')` (UTC midnight → prior day in US timezones) with `parse(str, 'yyyy-MM-dd', new Date())` (local midnight) in rotation wizard, on-demand form, and dispatch modal. ✅ Re-tested & verified June 1 (Cowork): on-demand review screen — field 06/03/2026 now shows "June 3, 2026" (was "June 2"); admin order view also correct. | ✅ FIXED & VERIFIED |
| 32 | June 1, 2026 | Low | Notifications | Notification bell badge not reactive after "Mark all read" (stale until reload; single reads do update it). Surfaced T9.1. First fix (UPDATE realtime listener) failed re-test: bulk server-side UPDATE events were unreliable on the deployment. Root fix: `NotificationList` fires `CustomEvent('notifications:allRead')` after `markAllNotificationsRead()` resolves; bell adds a `window` listener that immediately marks all its items read without relying on realtime. ✅ **Re-tested & verified June 1 (Cowork):** gave Margaret 1 unread → "Mark all read" → bell badge reset 1→0 **on the same page, no navigation** (vs. stuck at "1" for 14s+ before). | ✅ FIXED & VERIFIED |
| 35 | June 1, 2026 | Low | Admin / Corridors | **Duplicate-corridor creation throws an ungraceful error.** Root cause: `throw` from Server Actions is masked by Next.js in production builds (generic digest). Fix: `createCorridor` now returns `{ error: '…already exists' }` on Postgres `23505` (matching codebase `return { error }` pattern); client checks `result?.error` and shows toast. Modal stays open. | ✅ FIXED |
| 34 | June 1, 2026 | High | Provider / RLS | **Provider order detail 404s + item counts show 0.** After the #27 seed fix, provider login + portal queue work, but opening any provider order (`/provider/orders/<id>`) 404s. Root cause: no provider SELECT RLS on `orders`/`order_items`/`items`/`item_photos` (only `provider_order_assignments` + `concierge_messages` have provider policies), so the detail page's order query returns null → notFound(). Blocks T7.1–T7.4 (open order, accept/decline, stage updates, damage, messaging). Surfaced during #27 re-verification; confirmed via RLS migration audit. **Code shipped a migration: 5 policies — `orders_provider_read` (SELECT), `order_items_provider_read` (SELECT), `order_items_provider_update` (UPDATE: stage/notes/damage), `items_provider_read` (SELECT), `item_photos_provider_read` (SELECT)** — all scoped to assigned orders via `order_items → provider_order_assignments → providers.profile_id`. Migration `026_provider_order_rls.sql` pushed to hosted DB (June 1). ✅ **Re-tested June 1 (Cowork):** as European Couture Cleaners — order detail loads (no 404) with the 3 items, pickup/delivery, prep instructions; **Accept assignment** works; item expands to the Received→Cleaning→Pressing→Ready stage flow; **Mark as received** persists (UPDATE policy works); damage-flag + "Message LLV operations" UI present. Queue cards now show real item counts (3/4/1). **Negative check ✓:** opening RAVE's order (#9E93E08B) as European Couture → 404 (provider sees only assigned orders). **Section 7 (Provider Journey) is now unblocked & working.** | ✅ FIXED & VERIFIED |
| 33 | June 1, 2026 | High | UX / Brand | **Native `window.confirm()` dialogs at 8 sites** replaced with a custom in-app confirm dialog. Shipped: new `src/components/ui/confirm-dialog.tsx` (`ConfirmDialogProvider` + promise-based `useConfirm()` / `openConfirm({title, body?, confirmLabel?, cancelLabel?, tone?})`, built on the existing Base UI Dialog; backdrop click resolves false). Provider mounted once at the root in `src/app/layout.tsx` (covers admin/client/provider). All 8 call sites migrated (tier-edit-form: save-pricing + deactivate; admin-order-status-panel: refund + mark-return-received; order-action-buttons: cancel + initiate-return; account-settings-form: sign-out-everywhere + close-account). `eslint.config.mjs` adds `no-restricted-globals` error for `confirm`/`alert`/`prompt`. Closes #25. | ✅ FIXED |

### Priority-ordered list of topics not yet fully addressed:

Items 1–5, 7–9, 11, and 13 below are **now tracked in `docs/strategy/llv_business_strategy_assumptions_register.docx`** with working assumptions the platform is built against. They remain OPEN business decisions, but are **no longer blocking platform development** — every one is a configuration change (admin panel or DB), not a code change.

1. **Identify premium garment care providers in Wisconsin/Brookfield area** — Same research approach used for Arizona providers. *📋 Tracked in assumptions register Item 1. Working assumption: 1–3 premium WI providers will be onboarded via admin panel.*
2. **Pricing and service packages for founding members** — Define what Tier 1, 2, and 3 cost, founding member discounts or perks. *📋 Tracked in assumptions register Item 2. Live config (verified QA June 1, 2026): **Seasonal Essentials (Tier 1) $299/mo, Seasonal Premier (Tier 2) $599/mo, On-Demand Occasion (Tier 3) $75 base + per-item surcharge, 20% founding discount.** (Original working assumption was $249/$449 — $299/$599 is current.) All admin-editable via B3-04.*
3. **Provider partnership terms and negotiation approach** — What to propose to RAVE FabriCARE and European Couture Cleaners. What to offer Wisconsin providers. *📋 Tracked in assumptions register Item 3. Working assumption: pay retail initially, no revenue share; providers are vendors, LLV owns client relationship.*
4. **Insurance and liability structure** — Coverage requirements for high-value asset custody, in-transit insurance, provider insurance coordination. *📋 Tracked in assumptions register Item 4. Working assumption: bailee coverage + general liability; $5K per item / $50K per client cap. Value fields and condition history already captured (Phase A).*
5. **Daughter's formal role** — Casual family involvement vs. structured business arrangement with compensation or equity. Needs to be decided before launch. *📋 Tracked in assumptions register Item 5. Working assumption: AZ Corridor Manager, $1,500–$2,500/mo stipend, equity deferred. Role-based access already supports multiple admins.*
6. **Detailed technology build plan** — Break the architecture blueprint into sprint-level tasks for Claude Code. *✅ **DONE (May 25, 2026)** — Phase A breakdown at `docs/cowork/llv_phase_a_task_breakdown.md`; Phase B breakdown at `docs/cowork/llv_phase_b_task_breakdown.md`. All Phase A sprints delivered. Phase B planning complete; Sprint B1 ready for Code.*
7. **Self-funding vs. angel investment** — Capital strategy decision. Current budget estimate ($25K-$40K) is self-fundable, but growth capital may be needed. *📋 Tracked in assumptions register Item 6. Working assumption: self-fund pilot; angel conversation after traction. Platform costs are minimal on free/hobby tiers.*
8. **Choke Points 3 & 4** — Operational proving and TBD fourth choke point. *📋 Tracked in assumptions register Item 7. Working assumption: the pilot IS the operational proof; reporting (B6-04) and audit trail (B6-05) capture the data needed to evaluate.*
9. **Business entity formation** — LLC in Arizona vs. Wisconsin vs. both. Trademark filing for "Luxury Lifestyle Vault." *📋 Tracked in assumptions register Item 8. Working assumption: WI LLC primary + AZ foreign LLC registration; trademark filing before launch. Content-only impact on platform.*
10. **Resolve needs-chat-review items** — Review llv_needs_chat_review.md for blueprint drift and Tech Stack Claude Code.docx resolution. *✅ **DONE (May 25, 2026)** — all 12 items resolved by Chat. Blueprint Section 5 and handoff Section 7 updated to ratified stack; Tech Stack Claude Code.docx retired to `docs/archive/`. See Resolved section of `llv_needs_chat_review.md` for per-item rulings.*
11. **Wisconsin storage facility research** — Identify climate-controlled storage options in the Brookfield/Milwaukee area. *📋 Tracked in assumptions register Item 9. Working assumption: provider-handled storage first; LLV-leased unit ($150–$300/mo) only as overflow.*
12. **Client onboarding workflow design** — Define the step-by-step intake process for founding members. *⏳ In progress — first draft at `docs/cowork/llv_client_onboarding_sop.md` (Cowork, May 24, 2026). Pending founder review. Enhanced onboarding with tier selection + payment is Phase B feature B7-01.*
13. **Founding member recruitment strategy** — Specific outreach plan for securing first 10-15 clients through personal networks and referral channels. *📋 Tracked in assumptions register Item 10. Working assumption: 10–15 founding members via personal/referral channels (country clubs, wealth managers, estate attorneys, luxury real estate); 20% discount for 12 months; no mass marketing.*

---

## 14. Arizona Investor Strategy

- AZ startup scene focuses on tech, biotech, RE, SaaS — LLV needs targeted approach.
- Best investor prospects: affluent individuals who personally experience the problem (snowbirds, second-home owners).
- Networking channels: country clubs, wealth management firms, estate attorneys in Scottsdale.
- Founder's UHC exit provides immediate credibility.
- Strongest pitch comes after demonstrating traction (even a handful of paying pilot customers).
- ASU entrepreneurship ecosystem is a secondary resource for mentorship, angel networks, and potential early hires.

---

*End of handoff document. Update this file after every working session to maintain continuity.*
