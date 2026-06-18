Technology & Platform

This document is the documentation source of truth for the architecture and stack. The git repository (local Mac, deployed to Vercel) is the implementation source of truth for the actual code. Where this document and the codebase diverge, the codebase wins. New to the platform or non-technical? Start with Appendix A — Services at a Glance, then return here for the detail.

## 1. Architecture Overview

The platform is a lean, AI-assisted concierge logistics system designed for an elegant customer experience, efficient provider coordination, and operational scalability without a large engineering team. It is built around four core layers: Customer Experience (the client-facing portal and communication); the Operations Engine (workflow coordination, intake, scheduling, provider dispatch, quality tracking); the Provider Network (partner coordination, SLA tracking, capacity management); and Data & Intelligence — the system of record plus analytics and AI-assisted operations, including the asset catalog of ownership, condition, and location over time. This last layer is LLV's moat — the documented ownership record behind each client's wardrobe.

## 2. Customer Experience Layer

The interface communicates luxury, trust, and effortlessness — modeled on best-in-class hospitality apps, not logistics software. Client portal features: a personal wardrobe inventory with high-resolution photography; seasonal schedule management; real-time status tracking for items in storage, transit, or service; direct concierge messaging with response-time guarantees; multi-residence delivery-address management; service history and billing transparency; and item condition documentation with intake and return photography. Onboarding runs from founding-member application and approval, through an initial concierge consultation, white-glove wardrobe intake with on-site photography and cataloging, digital inventory review and confirmation, seasonal schedule setup, and secure payment and service-agreement execution. Design principles: a minimal, photography-forward interface; a maximum of three taps for any core task; dark and light modes in the luxury palette; and proactive notifications rather than status-checking.

## 3. Operations Engine

The operations engine is the competitive-advantage layer — where technology creates leverage so a small team can manage a growing client and provider base without proportional headcount. Workflow management covers automated intake processing, a seasonal scheduling engine triggered from client calendars, a provider-dispatch system that routes items by garment type and capacity, quality-checkpoint tracking, exception handling, and automated client communication. AI-assisted operations (pragmatic, not marketing) include intelligent item categorization from photos, predictive seasonal scheduling, automated quality assessment, natural-language concierge support, and anomaly detection. Inventory management — the system of record and chain of custody — provides unique item identifiers with QR/RFID tagging, high-resolution multi-angle intake photography, condition documentation at each touchpoint, location tracking across storage/transit/provider facilities, insurance-coverage records, and a full audit trail for every movement and service event.

## 4. Provider Network Layer

The provider network is what makes the asset-light model work: rather than building garment-care infrastructure, LLV coordinates a vetted network of premium providers, while custody and the system of record remain owned by LLV. The provider portal offers an order queue, a status-update interface, photo upload for post-service quality documentation, capacity management, an SLA dashboard, and billing reconciliation. Provider qualification standards: demonstrated luxury/couture experience, adequate insurance for high-value items, willingness to follow LLV handling protocols, guaranteed turnaround capacity, and photo-documentation capability. Initial AZ pilot targets: RAVE FabriCARE, European Couture Cleaners, and Mastel Dry Cleaning (Scottsdale); Wisconsin providers are shortlisted.

## 5. Current Technology Stack (Ratified)

**Decisions of record.** The guiding principle is to consolidate around Supabase to minimize the vendors a solo technical founder manages, and to use AI-assisted development. Frontend — Next.js 16 (App Router) + React + Tailwind CSS + Shadcn/UI. Backend/API — Next.js API routes + Server Actions. Database — PostgreSQL via Supabase. Authentication — Supabase Auth with multi-role access (client, provider, admin) enforced via Row-Level Security. File storage — Supabase Storage for active inventory photos; Cloudflare R2 cold archival deferred to Phase 4+ behind an abstraction layer. Background jobs — Inngest, for async work (photo processing, AI categorization, scheduling triggers, dispatch, notifications). Email — Resend. SMS — Twilio (scaffolded; opt-in consent and STOP/HELP webhook shipped; sending switches on pre-launch; US A2P 10DLC registration gated on the EIN). Payments — Stripe (sandbox today; live mode for launch). Hosting — Vercel. AI — Anthropic Claude API (Haiku 4.5 for photo categorization and concierge search; Sonnet 4.6 available for higher-tier features). Error monitoring — Sentry (live in production since June 6, 2026). Photo sourcing for development/seed only — Pexels (never real member data). Design system — Obsidian & Ivory palette. Deferred but architecturally anticipated: a native mobile app, the R2 archival tier, and partner integration APIs.

## 6. Platform & Environments

**Two platforms, two distinct roles.** Local Mac + git repository is the development environment and canonical home for all code. Vercel is the production runtime — a deploy target, not a source of truth. Environment separation maintains distinct development and production Supabase projects, Stripe modes, and secrets; production and seed data never mix. Relationship to the document base: business and strategy documents are canonical in Google Drive; this document is canonical for architecture and stack; the code is canonical in the repository.

## 7. Current Build State

**Ahead of the original timeline.** Phase A (Foundation) and Phase B (Core Operations) are complete. The platform includes roughly 31 features across 54 routes, with 27+ database migrations and a clean build — the wardrobe catalog with AI-powered natural-language search, the seasonal rotation wizard, on-demand item requests with live cost preview, the order-management dashboard, the provider order queue, Stripe subscription and per-request billing (sandbox), six-step onboarding with Stripe Elements, Resend email templates, an in-app notification center, the return flow, reporting/analytics with CSV export, an audit trail, an outfit builder, provider messaging, and seasonal reminders via Inngest. As of June 6, 2026, the remaining Phase 1–2 engineering items are shipped and verified in production (full Resend coverage, Sentry monitoring, the SMS consent flow and STOP/HELP webhook, dormant Twilio send code, and public Terms/Privacy pages). The project is closing out a testing phase; the remaining gate is founder-run external-dashboard verifications. Founding-member soft launch targets October 2026.

## 8. Security & Data Protection

Security is non-negotiable given high-value assets under custody and an affluent client profile: encryption in transit and at rest; role-based access control with least privilege via Supabase RLS; comprehensive audit logging for all item movements and data access; PCI-compliant payment processing via Stripe; regular security assessments and GDPR/CCPA-aligned data handling; access-controlled photo storage; and multi-factor authentication for privileged admin roles.

## 9. MVP Success Metrics (Scottsdale pilot, Oct 2026 – Apr 2027)

Client retention 80%+ Season-2 renewal; item accuracy 99.9% zero-loss inventory; service quality zero damage incidents; on-time delivery 98%+; client satisfaction NPS 70+; referral rate 3+ per client; and positive gross margin per client.

## 10. Launch / Go-Live Readiness

Engineering and production infrastructure: complete the test plan; stand up a production Supabase project with RLS verified and automated backups; move Stripe to live mode; deploy to Vercel production with the custom domain and SSL (luxurylifestylevault.com is live); authenticate the Resend sending domain; configure Twilio for production and complete A2P 10DLC; configure the Inngest production environment; confirm the server-only seed guard is unset on production; keep Sentry live with added log review and uptime alerting; conduct a security and RLS audit with admin MFA; load real provider and pricing configuration; and run an end-to-end production smoke test. Legal and business gates (tracked in folders 01/04): Wisconsin LLC plus Arizona foreign registration; trademark filing; bailee and general-liability insurance; published Terms and Privacy; and executed provider and client agreements.

## 11. Future Technology Expansion

Deferred beyond MVP but architecturally anticipated: a native iOS/Android app; digital wardrobe visualization and outfit-planning tools; integration APIs for strategic partners (The RealReal, FASHIONPHILE); luxury resale marketplace enablement; estate inventory and transition-management tools; multi-market provider-network expansion tooling; and advanced AI-assisted personal styling.

Appendix A — Services at a Glance (Plain English)

A non-technical map of the outside services the platform uses. Think of the app as a concierge front desk, with a handful of specialized partners working behind it.

| Service | What it does, in plain English |
| --- | --- |
| Vercel | The ground the app is built on — it hosts our website and keeps it online, fast, and secure. |
| Supabase | The filing cabinet and the front door — stores all our data, handles secure member logins, and holds the wardrobe photos. |
| Stripe | Handles all the money — membership subscriptions and per-request charges — securely. We never store raw card numbers. |
| Resend | Sends our emails — order updates, receipts, reminders — with Luxury Lifestyle Vault branding. |
| Twilio | Sends text-message updates to members who opt in. Switches on once carrier approval clears. |
| Anthropic (Claude AI) | The brains for the wardrobe — describes and categorizes each uploaded photo, and powers plain-language closet search. |
| Inngest | The behind-the-scenes task runner — reliably carries out follow-up work (emails, billing, photo analysis, reminders) and retries automatically. |
| Sentry | The alarm system — the moment something breaks for a real member, it flags it with enough detail to fix fast. |

How it all fits together: a new member signs up and logs in (Supabase) and their payment method is captured securely (Stripe). Behind the scenes, Inngest sets up billing and tells Resend to send a branded welcome email. When they photograph a garment, the picture is stored (Supabase) and Inngest passes it to Claude AI, which catalogs it into their digital closet. Every order moves the same way — actions saved in Supabase, money through Stripe, and Inngest firing the right email (Resend) or text (Twilio) at each step — all served through Vercel, with Sentry keeping watch.
