Launch Implementation Plan

This is the ordered, gated plan for getting from today's code-complete platform to a live launch. It is the companion to the Launch Gates Action Plan; live task status is maintained in the Notion tracker "LLV Launch — Project Tracker." This plan governs sequence, dependencies, owners, and the engineering prompts. Phases 0–4 are the gated critical path; Tracks A–D run in parallel alongside the phases.

## 1. The Critical Path at a Glance

Gated phases (in order): Phase 0 — testing gate (pass the full test plan before anything downstream begins); Phase 1 — close functional gaps in engineering, including the baseline help system; Phase 2 — observability and cleanup; Phase 3 — production infrastructure and cutover; Phase 4 — final production smoke test and go/no-go. Parallel tracks (started now): Track A — legal and formation (entity, trademark, insurance, policies); Track B — business-strategy decisions (the assumptions register); Track C — provider onboarding (AZ confirm, WI sign); Track D — founding-member recruitment. Hard truth on timing: launch is October — roughly four months out. Three items have external lead times and must start early: A2P 10DLC SMS registration, business insurance (bailee + general liability), and entity/trademark filings.

## 2. Phase 0 — Testing Gate

Goal: prove the platform works end to end before investing in production cutover. Execute the full test plan (13 sections, 30 scenarios, ~150 steps); all Critical and High tests must pass. Bug-fix cycle: Cowork captures the failure (often via browser-driven QA) and writes a Claude Code fix prompt; Code implements and pushes; Cowork re-verifies; the bug is logged. Exit criteria: every Critical and High scenario green with no open Critical/High items. Nothing in Phase 3 starts until this gate is cleared.

## 3. Phase 1 — Close Functional Gaps (Engineering)

Each becomes a Claude Code task, in order: the seed/reset production guard (critical security — harden destructive actions and /admin/seed-data with a server-side admin check plus a server-only env flag, 404 when unset, and remove the test-account quick-login from production); wire Twilio SMS for high-signal events only (order confirmed, shipped, delivered, damage/exception), respecting opt-in; verify email completeness via Resend; add a .env.example documenting all ~15 variables; and the baseline help system. Several of these have since shipped.

## 4. Phase 2 — Observability and Cleanup

Add Sentry across client, server, and Inngest functions with environment tags and alerting; confirm the image config no longer references Unsplash (moved to Pexels) with attribution stored per terms; and leave higher-tier AI (Sonnet 4.6) deferred — Haiku 4.5 handles categorization and concierge for the pilot.

## 5. Phase 3 — Production Infrastructure and Cutover

Begins only after Phase 0 passes and Phases 1–2 are substantially complete; every item is verified in the Phase 4 smoke test. Stand up a production Supabase project separate from development (apply migrations, verify RLS, enable automated backups / point-in-time recovery); move Stripe from sandbox to live mode; authenticate the Resend sending domain; provision the Twilio production number and complete US A2P 10DLC registration (start early — multi-week lead time); configure the Inngest production environment; deploy production on Vercel with the custom domain and SSL; strip development tooling from production; complete a security and RLS audit with admin MFA; and load real provider and pricing configuration via the admin panel.

## 6. Phase 4 — Final Production Smoke Test and Go/No-Go

Run the full client journey in production: onboarding, catalog, on-demand order, provider processing, shipping, delivery, return, and billing — confirming live payments, emails, SMS, and notifications, and that the membership-card surfaces render across mobile, iPad, and desktop. Go/No-Go review: testing gate cleared; production infra verified; legal/insurance in place (Track A); minimum founding cohort committed (Track D); providers signed (Track C).

## 7. Track A — Legal and Formation (Parallel, Start Now)

Wisconsin LLC (primary) plus Arizona foreign registration; trademark filing for "Luxury Lifestyle Vault" and the tagline; bailee / warehouse-legal-liability coverage plus general liability with a defined claims process and reserve (a launch gate and the prerequisite for honestly claiming "insured custody" — begin the broker conversation now); published Terms of Service and Privacy Policy; and executed provider agreements/SLAs plus a finalized client service agreement. Detailed steps, costs, and timelines live in the Launch Gates Action Plan.

## 8. Track B — Business Strategy Decisions (Parallel)

Tracked in the Business Strategy Assumptions Register, with working assumptions already built into the platform and none requiring code changes: pricing and packaging ($299/$599, $75 + $15/item, 20% founding-member discount, validate against provider costs); provider terms (pay retail initially, no revenue share); the AZ Corridor Manager role ($1,500–$2,500/month stipend, equity deferred); capital strategy (self-fund the pilot); Wisconsin storage (provider-handled first); and choke points (the pilot itself is the proof).

## 9. Track C — Provider Onboarding (Parallel)

Arizona: confirm RAVE FabriCARE (top priority), with European Couture Cleaners and Mastel Dry Cleaning as alternates. Wisconsin: work the shortlist — Martinizing (lead), Klinke (secondary), The London Cleaners (specialist) — targeting one primary plus one secondary before launch. Load all signed providers and their service/turnaround/capacity data into the admin panel.

## 10. Track D — Founding-Member Recruitment (Parallel)

Target 10–15 founding members for the October 2026 corridor pilot; offer 20% off for the first 12 months with a voice in the service and locked-in pricing; recruit through personal and referral networks (country clubs, wealth managers, estate attorneys, luxury real estate, resort/property concierges) with no mass marketing. Assets ready: the marketing brochure (folder 02) and the brand membership card (folder 09).

## 11. The Help System (Scoped)

For a luxury concierge platform, help leans on human escalation, not generic SaaS support. Baseline (ship before launch): contextual tooltips on core client flows with clear empty states; a small, searchable, admin-editable FAQ/help center; a persistent "Talk to your concierge" escalation that opens the existing concierge messaging; and a provider-portal handling-protocol reference. Phased (post-launch): a full knowledge base, guided first-run tours, an AI help assistant extending the existing Claude/Haiku integration, and an admin operations runbook — kept data-driven and admin-editable.

## 12. Indicative Timeline (June–October 2026)

June: Phase 0 testing and Phase 1 engineering (seed-guard first); start Track A and Track C; begin A2P 10DLC. July: finish Phases 1–2; pricing and provider terms decided; provider agreements in progress. August: Phase 3 production cutover; sign providers; load real config; Terms/Privacy live; recruitment intensifies. September: Phase 4 production smoke test; founding cohort committed. October: go/no-go, then soft launch with 10–15 founding members.

## 13. Owners and Workflow

Founder (Wisconsin): final decisions, WI provider relationships, recruitment, legal/insurance engagement, runs the local dev server and testing, and pastes Code prompts. Family operator (Arizona): Arizona-side operations and provider relationships (pending role confirmation). Claude Cowork: strategy, research, sequencing, Code-prompt authoring, browser-driven QA, and maintaining documents. Claude Code: implements all engineering items, commits, pushes, and reports back.
