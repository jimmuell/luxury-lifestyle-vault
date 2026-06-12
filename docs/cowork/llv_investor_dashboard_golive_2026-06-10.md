> **⚠️ SUPERSEDED (2026-06-12) — do not use as the live task list.**
>
> Single source of truth for task status: **"LLV Launch — Project Tracker"** in Notion → https://app.notion.com/p/375225a113658189b7efe81a8b0e2390
> The procedure steps (Sections A–E) remain valid operational reference; the task-status table below is out of date.

# Investor Dashboard — Go-Live Procedure & Task List

**Date:** 2026-06-10
**Author:** Cowork
**Scope:** Taking the Investor Data Room (the `feat/investor-dashboard` branch / PR #1) from the local/preview build to the live Vercel app.
**Companion:** `docs/cowork/llv_environment_production_cutover.md` (the project-wide cutover runbook). This doc is the dashboard-specific slice.

---

## Current state (what shipped)

- Built on branch `feat/investor-dashboard` (PR #1 open) via Code Prompts 0–5 (`docs/cowork/2026-06-10/`).
- DB: migrations `030` (investor enum), `031` (data-room tables, RLS, private `investor-room` bucket), `032` (unique constraint on `storage_path`). **Already applied to the shared Supabase that Vercel Production reads.**
- Content: 23 documents (8 sections + deck) seeded into the `investor-room` bucket and `investor_documents`.
- Access model: Supabase Auth + `investor` role + server-enforced NDA gate + RLS + per-document view/download audit. Investors are **invite-only** via the admin panel.

## Key facts that shape the cutover

1. **Vercel deploys on merge to `main`.** Merging PR #1 is the deploy — Vercel auto-builds Production from `main`. There is no separate "push to Vercel" step.
2. **Vercel and dev share one Supabase (pre-launch).** So the migrations and the seeded documents are already live in the database Production uses — **no separate prod DB migration or seed is required.**
3. **Demo login is intentionally ON in both local and Vercel for now.** `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` in both scopes → full parity, no environment-specific behavior. This is fine while it's just the founder + demos, but it is a **security boundary that must be turned off before real investors get access** (see Launch Hardening).

---

## Procedure

### A. Pre-merge — QA locally (Phase 0)
Run the local dev server (founder) against the shared Supabase and walk the room as the **demo investor**:

- [ ] Sign in via **Enter Investor Dashboard (demo)** → lands on `/investor`.
- [ ] **Documents** — all 8 sections render; open a file (new tab) and download a file; both succeed.
- [ ] **Audit** — confirm each open/download wrote an `investor_document_views` row.
- [ ] **Deck** — `/investor/deck` iframe loads the revised `pitch_deck.pdf`.
- [ ] **Financials / Overview** — charts read $55.7K / $612K / $10M; overview "recently added" lists documents.
- [ ] **NDA gate** — set the demo investor's `nda_acknowledged = false`, confirm forced redirect to `/investor/acknowledge`, submit, land back in the room (and the flag flips true).
- [ ] **Admin** — `/admin/investors` lists the investor with NDA status + view activity; invite flow creates an investor.
- [ ] **Isolation** — a `client` (and `provider`) cannot reach `/investor/*`.
- [ ] `npm run verify` clean.

### B. Merge & deploy (Phase 3)
- [ ] Merge **PR #1** (`feat/investor-dashboard` → `main`) on GitHub.
- [ ] Vercel auto-builds Production; confirm the build succeeds in the Vercel dashboard.
- [ ] (Nothing to do for DB/seed — shared Supabase already has them.)

### C. Post-deploy smoke test (Phase 4)
- [ ] On `luxurylifestylevault.com`, sign in (demo button is present while parity is on) → `/investor` loads.
- [ ] Open + download one document; confirm it works over the live domain (signed URLs resolve).
- [ ] Deck loads; financials render.
- [ ] Check Sentry for any new errors from `/investor/*` routes.

### D. Launch hardening (before REAL investors get access — do NOT skip at real launch)
- [ ] **Disable demo login in Vercel Production:** set `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` to unset/false in the Production scope (redeploy). The demo button disappears; entry is invite-only.
- [ ] **Delete the demo investor account** (`demo.investor@llv.dev`) from the production database.
- [ ] **Confirm `SEED_TOOLS_ENABLED` is unset** in Production (it should already be).
- [ ] **Fill the deck's "The Ask"** — confirm raise amount + instrument, update the deck, re-export `pitch_deck.pdf`, re-run the seed.
- [ ] Invite the first **real** investor via the admin panel; confirm NDA gate + access; confirm the audit log records their views.
- [ ] Confirm the confidential PDFs in the `investor-room` bucket are reachable only via signed URLs (not public).

### E. Rollback
- If a problem surfaces post-merge: **Vercel → Deployments → promote the previous Production deployment** (instant rollback of the app). The DB changes are additive (new tables/role) and do not affect existing client/provider/admin flows, so a code rollback is sufficient; no migration rollback needed.

---

## Task list (also mirrored to the Notion Launch Tracker)

| Task | Owner | Phase/Track | Status |
|---|---|---|---|
| Investor Dashboard — build (role, NDA gate, documents, financials, deck, admin) | Claude Code | Phase 1 — Engineering | Done |
| Investor data room — seed 23 documents + deck into bucket | Founder/Code | Phase 1 — Engineering | Done |
| Investor data room — conformed PDF document set (control-page stripped) | Cowork | Phase 1 — Engineering | Done |
| Investor pitch deck — guardrail review + rebuilt deck (15 slides) | Cowork | Track B — Business | Done |
| Investor Dashboard — local QA walkthrough | Founder | Phase 0 — Testing | Not started |
| Investor Dashboard — merge PR #1 → main (Vercel deploy) | Founder | Phase 3 — Production | Not started |
| Investor Dashboard — launch hardening (disable demo login + delete demo investor) | Founder | Phase 3 — Production | Not started |
| Pitch deck — confirm raise amount + instrument (The Ask) | Founder | Track B — Business | Not started |
