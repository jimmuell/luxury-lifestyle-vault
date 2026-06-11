**LUXURY LIFESTYLE VAULT**

Technology & Platform

**DOCUMENT CONTROL**

**Version:** v3 — DRAFT (vision-aligned; services overview merged in)

**Status:** Draft for review — aligned to Vision & Strategy v3

**Prepared:** June 2026 (consolidated 2026-06-07)

**Source of truth:** LLV Vision & Strategy v3 (folder 01) governs the business narrative. This document is canonical for architecture and stack; the git repository is canonical for the actual code.

**Supersedes:** Technology Architecture Blueprint (working draft, May 24 2026); the Tech Stack Claude Code recommendation (retained in 99 Archive); the standalone "App Services Overview" (now merged in as Appendix A).

**Revision note:** v3 merges the plain-English "Services at a Glance" overview into this document (Appendix A), adds **Sentry** (error monitoring, activated in production June 6 2026) to the stack, and updates the launch-readiness checklist accordingly.

**Confidentiality:** Confidential & Proprietary. Not for reproduction or distribution without written authorization.

*Internal control page — delete before external distribution. Page 2 onward is self-contained.*

**LUXURY LIFESTYLE VAULT**

*Your Lifestyle, Wherever Life Takes You.*

Technology & Platform

**IMPLEMENTATION NOTE:** This document is the documentation source of truth for the architecture and stack. The git repository (local Mac, deployed to Vercel) is the implementation source of truth for the actual code. Where this document and the codebase diverge, the codebase wins and this document should be corrected. A Cowork gap-review against the repo is the mechanism for keeping the two aligned.

*New to the platform or non-technical? Start with **Appendix A — Services at a Glance**, a plain-English map of every outside service the app uses and how they work together, then return here for the detail.*

## **1. Architecture Overview**

The platform is a lean, AI-assisted concierge logistics system designed for an elegant customer experience, efficient provider coordination, and operational scalability without a large engineering team. It is built around four core layers, each developed and improved independently while maintaining a cohesive experience:

  - **Customer Experience** — client-facing portal and communication: web app, mobile-responsive UI, client dashboard, notifications.
  - **Operations Engine** — workflow coordination and task management: intake processing, scheduling, provider dispatch, quality tracking.
  - **Provider Network** — partner coordination and service delivery: provider portal, SLA tracking, status updates, capacity management.
  - **Data & Intelligence** — the system of record plus analytics and AI-assisted operations: the asset catalog (ownership, condition, and location over time), photo inventory, reporting, and predictive scheduling. This layer is LLV's moat — the documented ownership record behind each client's wardrobe.

## **2. Customer Experience Layer**

The interface communicates luxury, trust, and effortlessness — modeled on best-in-class hospitality apps, not logistics software. It should feel like a private concierge, not a shipping dashboard.

Client portal features: personal wardrobe inventory with high-resolution photography and item details — the client's live documented wardrobe view; seasonal schedule management with calendar-based delivery planning; real-time status tracking for items in storage, transit, or service; direct concierge messaging with response-time guarantees; delivery address management for multiple residences; service history and billing transparency; item condition documentation with intake and return photography.

Onboarding flow: founding-member application and approval, initial concierge consultation to capture seasonal patterns and preferences, white-glove wardrobe intake with on-site photography and cataloging, digital inventory review and confirmation by the client, seasonal schedule and delivery setup, and secure payment and service-agreement execution.

Design principles: minimal, clean interface with generous whitespace and elegant typography; photography-forward design; maximum three taps for any core task; dark and light modes in the luxury palette; proactive notifications rather than requiring the client to check status.

## **3. Operations Engine**

The operations engine is the competitive-advantage layer — where technology creates leverage so a small team can manage a growing client and provider base without proportional headcount.

Workflow management: automated intake processing with photo capture, item tagging, and condition documentation; a seasonal scheduling engine that triggers preparation workflows from client calendars; a provider-dispatch system that routes items by garment type, service needed, and capacity; quality-checkpoint tracking at each stage; exception-handling workflows for damage, delays, or special requests; and automated client communication on status changes.

AI-assisted operations (pragmatic, not marketing): intelligent item categorization from photos; predictive seasonal scheduling from client history and weather; automated quality assessment from condition photography; natural-language concierge support; and anomaly detection for potential damage or service issues.

Inventory management (the system of record / chain of custody): unique item identifiers with QR or RFID tagging; high-resolution multi-angle intake photography; condition documentation at intake and each service touchpoint; location tracking across storage, transit, and provider facilities; insurance coverage records; and a full audit trail for every item movement and service event.

## **4. Provider Network Layer**

The provider network is what makes the asset-light service model work: rather than building garment-care infrastructure, LLV coordinates a vetted network of premium providers. (Custody and the system of record remain owned by LLV — see Vision & Strategy, folder 01.)

Provider portal features: incoming order queue with item details, service requirements, and priority; status-update interface across service stages; photo upload for post-service quality documentation; capacity and availability management; SLA performance dashboard; and billing and payment reconciliation.

Provider qualification standards: demonstrated experience with luxury and couture garments; adequate insurance for high-value items; willingness to follow LLV handling protocols; capacity for guaranteed turnaround; and photo-documentation capability at each stage. Initial AZ pilot targets: RAVE FabriCARE, European Couture Cleaners, Mastel Dry Cleaning (Scottsdale). Wisconsin providers shortlisted — see Operations & Logistics (folder 04).

## **5. Current Technology Stack (Ratified)**

Decisions of record. These supersede the May 24 blueprint's draft stack. The guiding principle is to consolidate around Supabase to minimize the number of vendors a solo technical founder manages, and to use AI-assisted development (Claude Code, Cowork).

  - **Frontend** — Next.js 16 (App Router) + React + Tailwind CSS + Shadcn/UI. Shadcn provides accessible, owned components that can be styled to feel premium rather than generic.
  - **Backend / API** — Next.js API routes + Server Actions (unified codebase; the blueprint's "or Express" option was dropped for solo development).
  - **Database** — PostgreSQL via Supabase (chosen over PlanetScale — true Postgres, stronger ecosystem).
  - **Authentication** — Supabase Auth with multi-role access (client, provider, admin) enforced via Row-Level Security at the database layer — the right place for a custody-of-assets platform. (Auth0 dropped as redundant.)
  - **File storage** — Supabase Storage for active inventory photos (RLS-controlled). Cloudflare R2 for cold archival is deferred to Phase 4+; storage is accessed through an abstraction layer so the archival tier can be added without rework.
  - **Background jobs** — Inngest — for async work that should not live in synchronous API routes: photo processing, AI photo categorization at intake, seasonal scheduling triggers, provider dispatch, and automated notifications. Native to Next.js/Vercel with built-in retries, observability, and scheduling. *(Operational note: production syncs are performed manually by design — see the Inngest Manual Sync Runbook in the repo. Resync after any deploy that adds/removes a function or changes a trigger/cron/config.)*
  - **Email** — Resend (transactional; chosen over SendGrid for simpler developer experience).
  - **SMS** — Twilio — scaffolded (package installed, preference UI built, opt-in consent + STOP/HELP webhook shipped); sending switches on pre-launch for high-signal notification events; US A2P 10DLC registration required (gated on the EIN).
  - **Payments** — Stripe — subscription billing, per-request billing, invoicing, PCI-compliant processing. Currently in sandbox (Lion Gate Technology account); moves to live mode for launch.
  - **Hosting** — Vercel — purpose-built for Next.js with preview deployments (Amplify dropped).
  - **AI** — Anthropic Claude API — Haiku 4.5 handles photo categorization and concierge search today; Sonnet 4.6 not currently active, available for higher-tier features when wired.
  - **Error monitoring** — Sentry — captures unhandled errors and exceptions across the app (client, server, and Inngest background jobs) with readable stack traces (source maps uploaded), tagged by environment, with alerting on new issues. **Activated in production June 6, 2026.**
  - **Photo sourcing (development/seed only)** — Pexels (migrated from Unsplash June 1, 2026; attribution stored per Pexels API requirements), integrated into the seed pipeline. Not used for real member data.
  - **Design system** — Obsidian & Ivory palette with elegant typography; an in-app style guide under the admin area.

Deferred (architecturally anticipated, not built for MVP): native iOS/Android app (the mobile-responsive web app, optionally wrapped as a PWA, covers MVP); Cloudflare R2 archival tier; partner integration APIs (e.g., The RealReal, FASHIONPHILE).

## **6. Platform & Environments**

Two platforms, two distinct roles — not competing sources of truth:

  - **Local Mac + git repository** — the development environment and the canonical home for all code. Claude Code works here. This is where the schema, migrations, and features are authored.
  - **Vercel** — the production runtime. Code is deployed here from the repository; Vercel is a deploy target, not a source of truth.

Environment separation: maintain distinct development and production Supabase projects, Stripe modes (sandbox vs live), and environment variables/secrets per environment. Production data and test/seed data must never mix.

Relationship to the document base: business and strategy documents are canonical in Google Drive (folders 01-06); this technology document (folder 07) is canonical for the architecture and stack description; the code is canonical in the repository. Recommend Google Drive for Desktop to keep the local document folder and Drive in sync so Cowork can read the same documents.

## **7. Current Build State**

Ahead of the blueprint's original timeline. Phase A (Foundation) and Phase B (Core Operations) are complete (as of late May 2026). The platform includes roughly 31 features across 54 routes, with 27+ database migrations and a clean build. Implemented capabilities include the wardrobe catalog with AI-powered natural-language search, the seasonal rotation wizard, on-demand item requests with live cost preview, the order-management dashboard, the provider order queue with multi-stage processing, Stripe subscription and per-request billing (sandbox), six-step onboarding with Stripe Elements, Resend email templates, an in-app notification center, the return flow, reporting/analytics with CSV export, an audit trail, an outfit builder, provider messaging, and seasonal reminders via Inngest. An admin Seed Data Manager (with hard reset) supports development with 431 seed records across 17 tables and three fully onboarded client personas.

As of June 6, 2026, the remaining Phase 1–2 engineering items are shipped and verified in production: full Resend email coverage (sending end-to-end), Sentry error monitoring with source maps, the SMS consent flow and STOP/HELP webhook, the Twilio send code (dormant until A2P), and public Terms/Privacy pages.

The project is currently closing out a testing phase (corresponding to the blueprint's Phase C), working through a test plan of 13 sections, 30 scenarios, and roughly 150 steps; all in-app scenarios and surfaced bugs are resolved, with the remaining gate being founder-run external-dashboard verifications. Founding-member soft launch targets October 2026 (blueprint Phase D).

*(Counts confirmed against the repository by Cowork, June 2026.)*

## **8. Security & Data Protection**

Security is non-negotiable given high-value assets under custody and an affluent client profile. Requirements across every layer: encryption of data in transit and at rest; role-based access control with least privilege (enforced via Supabase RLS); comprehensive audit logging for all item movements and data access; PCI-compliant payment processing via Stripe (keeping card data out of LLV's own systems); regular security assessments; GDPR/CCPA-aligned data handling; access-controlled photo storage and delivery; and multi-factor authentication for privileged (admin) roles.

## **9. MVP Success Metrics (Scottsdale pilot, Oct 2026 – Apr 2027)**

  - Client retention: 80%+ renewal for Season 2 (subscription renewal rate).
  - Item accuracy: 99.9% zero-loss inventory (items returned vs. received).
  - Service quality: zero damage incidents (condition-documentation comparison).
  - On-time delivery: 98%+ on schedule (delivery vs. scheduled date).
  - Client satisfaction: NPS 70+ (post-season survey).
  - Referral rate: 3+ referrals per client (new-client source tracking).
  - Unit economics: positive gross margin per client (revenue minus direct service costs).

## **10. Launch / Go-Live Readiness Checklist**

Items required to move from the current testing build to a live production launch. Engineering items should be verified and checked off by Cowork against the repo; legal/business items gate go-live but are tracked in the business-strategy queue (folders 01 and 04).

**Engineering & production infrastructure:**

  - Complete the test plan — all 30 scenarios passing (Critical and High priority green).
  - Stand up a production Supabase project, separate from development; apply the migrations; verify RLS policies; enable automated backups / point-in-time recovery.
  - Move Stripe from sandbox (Lion Gate Technology) to live mode: live API keys, live webhook endpoints, and live products/prices for all service tiers (protection memberships deferred to post-pilot — see RealReal Partnership, folder 05).
  - Deploy to Vercel production; attach the custom domain with SSL; configure production environment variables and secrets. *(Brand domain luxurylifestylevault.com is live with SSL.)*
  - Authenticate the Resend sending domain (SPF/DKIM/DMARC) and verify the sender. *(Apex sending domain configured; deliverability hardening tracked pre-launch.)*
  - Configure Twilio for production — SMS is in scope for launch (high-signal events): provision the production number and complete US A2P 10DLC registration. *(Consent flow + STOP/HELP shipped; A2P gated on the EIN.)*
  - Configure the Inngest production environment and keys. *(Production app registered; synced manually at the apex by design — see the Inngest Manual Sync Runbook.)*
  - Fix the seed/reset production guard: destructive seed actions are now gated server-side by a server-only `SEED_TOOLS_ENABLED` flag (default-deny) plus an admin role check, with a notFound() gate on the /admin/seed-data page when the flag is unset. *(Shipped — verify the flag is unset on the production project.)*
  - **Error monitoring — Sentry — is live in production** (DSN configured, source maps uploading, default alerting on; June 6 2026). Still to add: centralized log review and uptime/availability alerting.
  - Conduct a security and RLS audit; confirm secrets management and admin MFA; confirm PCI scope (Stripe-hosted).
  - Load real provider records and the real tier/pricing configuration (configuration-driven, no code change needed).
  - Run an end-to-end production smoke test of the full client journey: onboarding, catalog, on-demand order, provider processing, return, and billing.

**Legal & business (gating, tracked in 01/04):**

  - Entity formation: Wisconsin LLC (primary) plus Arizona foreign registration.
  - Trademark filing for "Luxury Lifestyle Vault" and the tagline (Your Lifestyle, Wherever Life Takes You.).
  - Insurance: bailee / warehouse-legal-liability coverage plus general liability; defined claims process and reserve.
  - Terms of Service and Privacy Policy (GDPR/CCPA aligned), published and linked in onboarding and checkout. *(Pages live with placeholders; finalize on LLC formation + attorney review.)*
  - Executed provider agreements/SLAs and a finalized client service agreement in the onboarding flow.

## **11. Future Technology Expansion**

Deferred beyond MVP but architecturally anticipated: native iOS/Android app; digital wardrobe visualization and outfit-planning tools; integration APIs for strategic partners (The RealReal, FASHIONPHILE); luxury resale marketplace enablement; estate inventory and transition-management tools; multi-market provider-network expansion tooling; and advanced AI-powered personal styling.

---

## **Appendix A — Services at a Glance (Plain English)**

*A non-technical map of the outside services the platform uses and what each one does. Think of the app as a concierge front desk, with a handful of specialized partners working behind it. (The technical version is Section 5.)*

| Service | What it does, in plain English |
| --- | --- |
| **Vercel** | The ground the app is built on — it hosts our website and keeps it online, fast, and secure for everyone who visits. |
| **Supabase** | The filing cabinet and the front door. It stores all our data (members, wardrobes, orders), handles secure member logins, and holds the wardrobe photos. |
| **Stripe** | Handles all the money — membership subscriptions and per-request charges — securely. We never see or store raw card numbers; Stripe does that part. |
| **Resend** | Sends our emails — order updates, payment receipts, reminders — all with Luxury Lifestyle Vault branding. |
| **Twilio** | Sends text-message (SMS) updates to members who opt in. Switches on once carrier approval clears. |
| **Anthropic (Claude AI)** | The brains for the wardrobe. It looks at each uploaded photo to automatically describe and categorize the item, and it powers plain-language closet search like "something for a black-tie event." |
| **Inngest** | The behind-the-scenes task runner. After someone takes an action, it reliably carries out the follow-up work — sending emails, processing billing, analyzing photos, sending seasonal reminders — without making anyone wait, and it retries automatically if something hiccups. |
| **Sentry** | The alarm system. The moment something breaks for a real member, it flags it with enough detail to fix fast — often before anyone even notices. |

**What the app itself is built with:** the website and member portal are built on **Next.js** (a modern web framework) and run on **Vercel**. That's the foundation the services above plug into. *(One more service, **Pexels**, supplies sample photos for demos and testing only — it never touches real member data.)*

### How it all fits together

A typical journey shows how these partners hand off to each other. A new member signs up and logs in (**Supabase**), and their payment method is captured securely (**Stripe**). Behind the scenes, **Inngest** quietly sets up their billing profile and tells **Resend** to send a branded welcome email — all without the member waiting on a loading screen. When they photograph a garment, the picture is stored (**Supabase**) and **Inngest** passes it to **Claude AI**, which identifies and catalogs it so it shows up, neatly sorted, in their digital closet.

From there, every order moves the same way: the member's actions are saved in **Supabase**, money flows through **Stripe**, and **Inngest** fires off the right email (**Resend**) or text (**Twilio**) at each step — confirmed, shipped, delivered. The whole experience is served to members through **Vercel**, while **Sentry** keeps watch the entire time, ready to alert us if anything goes wrong. The result is a service that feels effortless and white-glove on the surface, with reliable, specialized infrastructure doing the heavy lifting underneath.

---

*Confidential & Proprietary — Intended solely for evaluation and discussion. Not for reproduction or distribution without written authorization. Last consolidated: 2026-06-07.*
