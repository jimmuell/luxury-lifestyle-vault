# LLV Session Handoff — 2026-06-10

**Author:** Cowork
**Session focus:** Built the Investor Dashboard (data room) end-to-end, QA'd it in the browser, and relocated the repo off iCloud.

---

## START HERE TOMORROW

1. **Merge PR #1** (`feat/investor-dashboard` → `main`) — first thing. Vercel auto-deploys production from `main`; shared Supabase already has the migrations + seed, so no separate DB step. Confirm the Vercel build succeeds.
2. Then the backlog: **Master Document Standard → v7** (codify "conformed-by-exception") and **00 CoWork triage** (Dashboard QA Checklist, Inngest Sync Runbook, Legal Finalization Worksheet).

---

## Critical environment change (read first)

- **The repo moved out of iCloud.** New path: **`~/dev/luxury-lifestyle-vault`** (was `~/Documents/Claude/Projects/...`, which is iCloud-managed and was causing `next dev` to crash with `ECANCELED: read` errno -89). Open VS Code / Claude Code / Cowork at the new path. Remove the old `~/Documents/...` from Recent Folders.
- **`localhost` vs `127.0.0.1`:** `localhost` doesn't resolve on this Mac (IPv4/IPv6), so the app is browsed at `http://127.0.0.1:3000`. We added `allowedDevOrigins: ['127.0.0.1','localhost']` to `next.config.ts` so Next trusts it. Open follow-up (optional): make `localhost` work via `next dev -H ::`, or set `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000`, to end the split (it was the root of the deck-embed bug).

## What shipped (all on `feat/investor-dashboard`, PR #1 open, verify clean)

Investor Dashboard, built via Code Prompts 0–9 in `docs/cowork/2026-06-10/`:
- **Schema/auth:** `investor` role; `nda_acknowledged` flag on profiles; `investor_documents` / `investor_nda_acknowledgments` / `investor_document_views` tables; RLS; private `investor-room` storage bucket. Migrations 030 (enum), 031 (schema/RLS/storage), 032 (unique constraint on `storage_path`).
- **Routing/gate:** `(investor)` route group + gated layout + nav; proxy investor prefix + NDA gate; `/investor/acknowledge`.
- **Pages:** Overview (personalized "Welcome, {first name}" + KPIs + recently-added), Documents (sections, **View opens inline viewer in a new tab**, Download, view/download audit), Financials (hand-rolled charts from `src/lib/investor/financials.ts` — real model numbers), Deck (embeds signed PDF directly), plus placeholder The Ask + Contact.
- **Admin:** invite/manage investors, NDA status + view audit; `scripts/seed-investor-docs.ts` + manifest.
- **Content:** 23 documents seeded into the `investor-room` bucket across 8 sections + the deck.

QA fixes shipped this session: Prompt 6 (inline doc viewer), 7 (demo-login buttons were silently failing), 8 (personalization), 9 (deck embed was showing login/erroring due to cross-host redirect).

## Verified in browser QA (demo investor) ✅
Overview + personalization + sidebar identity chip; Documents render by section, View opens inline in a new tab, Download present; Financials numbers tie to the model ($55,700 rev / $63,251 cost; billing-mode table, Split 6/12 recommended); Deck embeds inline (15 slides).

## Decisions / state
- **Demo/auto-logins stay ON** for now (parity local + Vercel; pre-launch demo environment). The "disable demo login + delete demo investor" hardening is parked on the Notion tracker for **real launch**, not now.
- Demo investor account: `demo.investor@llv.dev` / `demo1234`, seeded with `nda_acknowledged = true`.
- Notion "LLV Launch — Project Tracker" updated: dashboard build + seed + doc set + deck = Done; QA = Done; merge PR #1 (Critical) + launch-hardening (Launch gate) + confirm raise amount = open.

## Open follow-ups (non-blocking)
- **Pitch deck "The Ask"** still shows a TBD — needs the raise amount + instrument (founder) to finalize, then re-export `pitch_deck.pdf` + re-seed.
- **Executive One-Pager** still contains "…insurance, estate planning, lending, and resale" — the same guardrail language we softened in the deck; needs a content pass on that doc.
- The Ask + Contact investor pages are placeholders pending content.
- Optional local-env fix for the `localhost`/`127.0.0.1` split (above).

## Where things live
- Code + Code-prompts: `~/dev/luxury-lifestyle-vault` (repo), prompts in `docs/cowork/2026-06-10/`.
- Go-live procedure: `docs/cowork/llv_investor_dashboard_golive_2026-06-10.md`.
- Rebuilt deck + revision notes: Google Drive `02 Investor Materials`.
- Launch status: Notion "LLV Launch — Project Tracker".
