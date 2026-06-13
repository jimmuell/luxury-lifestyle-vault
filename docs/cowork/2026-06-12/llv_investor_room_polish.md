# LLV Investor Room Polish — Code Prompts (Phased)

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-12
**Branch:** `feat/investor-board` (already created off `main`)
**Companions:** *LLV Investor Room Polish — Build Plan* and *LLV Data Room Gap Analysis* (Data Board Room). Board portal is a **later phase** — not in scope here.

## Context for every prompt

The investor portal already ships: three-tier access (`prospect ⊂ investor ⊂ board`) via RLS (`src/lib/investor/tiers.ts`, migrations 033/034); a private Storage bucket with signed URLs; a server-enforced NDA gate; a per-document view/download **audit log**; the react-pdf presentations viewer; Financials and "The Ask"; and an admin area. This work rounds out the **investor-facing** experience in two waves.

**Conventions:** confirm exact table/column names against the live schema before writing migrations. Reuse the existing `audience` / `tier_rank()` pattern for anything tier-gated. Keep all copy within the Trust & Liability Guardrails (no "portfolio value" / investment framing). Run the CI gate (`verify` + `build`) and QA on the Vercel preview after each prompt.

---

## PHASE 1 — Core five (ship first)

### Prompt 1 — Investor FAQ page
Migration `investor_faq` (question, answer, sort_order, audience, published, timestamps; RLS by tier + published; admin-writable). Route `src/app/(investor)/investor/faq/page.tsx`; add "FAQ" to the investor nav; admin `/admin/faq` (create/edit/reorder/publish). **Done:** FAQ in nav, renders per tier, admin can manage entries.

### Prompt 2 — Welcome / orientation on the Overview
Top welcome panel: one-paragraph LLV summary + tier-aware "start here" (prospect→deck, investor→data room, board→Financials/The Ask), above the KPI cards. Copy editable without a deploy (config or a row). **Done:** Overview leads with a tier-correct welcome; KPI cards remain.

### Prompt 3 — Document search / filter
Search box + section/type filter chips on the data room (and Presentations if cheap), client-side over the already RLS-scoped list. **Done:** typing filters live; never reveals out-of-tier docs; clear resets.

### Prompt 4 — New-document notifications
Profile opt-in column + unsubscribe path; emit `document/published` / `presentation/published`; Inngest function → query eligible (`tier_rank >= audience`) opted-in investors → branded Resend email; admin "Notify investors" toggle (default off, per item); log sends. **Done:** publish-with-notify emails only eligible opted-in investors; tier respected; unsubscribe honored; logged.

### Prompt 5 — Dynamic watermarking
Per-viewer overlay (email + timestamp + "Confidential — LLV") on every react-pdf page incl. fullscreen, not blocking nav. Optional stretch: server-side stamped downloads via `pdf-lib`. **Done:** every viewer page shows the per-viewer watermark; nav unaffected.

**Order:** 1 → verify → 2 → verify → 3 → verify → 4 → verify → 5 → verify.

---

## PHASE 1b — UX wave (right after Phase 1)

### Prompt 6 — Investor Updates module
Migration `investor_update` (title, body/rich text, audience, published, sent_at, timestamps; RLS by tier). Route `src/app/(investor)/investor/updates/` (list + detail) + nav; admin composer at `/admin/updates`. On publish, optionally email eligible opted-in investors (reuse Prompt 4's pipeline). **Done:** founder posts an update; it appears in the portal for the right tiers, is emailed when chosen, and is archived/listed.

### Prompt 7 — In-room CTA buttons
Configurable CTA buttons in the investor room ("Book a call" → scheduling link, "Express interest", "Request board materials" → emails/logs the request to admin). Admin-editable label + action. **Done:** CTAs render, fire their action, and log the interaction.

### Prompt 8 — Mobile nav  *(this already has a tracker row; fold it into this branch)*
Responsive/mobile navigation for the investor sidebar so the portal is usable on a phone. **Done:** nav works on mobile widths; all sections reachable.

### Prompt 9 — Admin engagement dashboard
Surface the existing audit log as an admin report: per-investor engagement (who viewed/downloaded/logged in, time-on-document where available, return visits); "most/least engaged"; last-seen. Read-only over existing data — no new capture required first. **Done:** admin sees a per-investor engagement view built from the audit log.

**Order:** 6 → verify → 7 → verify → 8 → verify → 9 → verify.

---

## Parallel (not Claude Code) — content workstream

Cowork is drafting the missing investor documents (leadership/team page, market sizing, IP/brand + compliance one-pagers, FAQ content). The founder supplies real numbers for the cap table, use-of-funds, and financials. These get uploaded to the data room via the existing admin once ready — no code dependency, except Prompt 1's FAQ will use the drafted FAQ content.

## Commit / PR

Small PRs per prompt (or one per phase) into `feat/investor-board`; CI gate on each; open the PR to `main` when a phase is QA'd on preview. Do **not** auto-merge.
