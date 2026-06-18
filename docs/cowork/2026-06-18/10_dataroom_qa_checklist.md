# Data Room UI — QA Checklist (2026-06-18)

Run on the app started from branch `feat/publish-to-dataroom`. The room data is live in Supabase. Run the FAQ seed (`09_seed_investor_faq.md`) first if you want to test the FAQ page.

## 0. Setup
- [ ] `npm run dev` on `feat/publish-to-dataroom`; app loads at localhost:3000.
- [ ] You have an **admin** login and can reach the **demo investor** entry on the sign-in form.

## 1. Investor view (demo investor / investor-tier)
- [ ] Sign in as the demo investor → you're routed through the **NDA acknowledge** gate before the room.
- [ ] After acknowledging, `/investor` overview loads (welcome panel).
- [ ] `/investor/documents` shows **16 documents** grouped under: The Concept, Strategy, Market & Competitive, Product & Technology, Legal & Risk, **Leadership & Team**, **Intellectual Property & Brand**. (The two new section labels render with proper names, not "team"/"ip".)
- [ ] Each card shows an **"As of 2026-06-18 · v…"** stamp.
- [ ] **Open** Vision & Strategy → the viewer shows the rebuilt 7-page doc (opens at Executive Summary, no internal control page).
- [ ] **Open** Trust & Liability Guardrails or Client Item Protection → the tables render cleanly (gold header rows).
- [ ] **Download** any doc → a file downloads (signed URL works).
- [ ] **Not present:** Cap Table, Assumptions Register, Integrated Analysis, Operations & Logistics, Launch Plan (these are board-tier) — and none of the 6 trimmed docs (Concept Packet, TRR Research Notes, Client Onboarding SOP, Inventory Intake, Concierge Blueprint, Launch Gates).
- [ ] `/investor/faq` → the **13 Q&A** render in order (after the seed runs).
- [ ] Spot-check the other tabs load: Financials, Pitch Deck, The Ask, Contact, Updates.

## 2. Tier check (board)
- [ ] If you can view as a **board-tier** account: `/investor/documents` now **also** shows the 5 board docs (Cap Table under Financials, Assumptions under Strategy, Integrated Analysis under Financials, Operations, Launch Plan). Prospect-only view should show the pitch deck but fewer docs.

## 3. Admin view
- [ ] `/admin/data-room` → **22 documents**, each **`current`** (after the pitch-deck re-publish; if you haven't re-run `--publish`, the pitch deck may still read `unverified`).
- [ ] Each row shows source name + version (e.g., `R01_…docx · v6`), published-at, and an audience badge (investor / board / prospect).
- [ ] `/admin/faq` → 13 entries, all published, prospect audience, in sort order.
- [ ] `/admin/presentations` → the pitch deck is listed and uploadable.

## 4. Things to note / report back
- [ ] Any doc that fails to open or download.
- [ ] Any section that renders with a raw key (`team`/`ip`) instead of a label → the section-label edit didn't land.
- [ ] Any board doc visible to an investor-tier viewer (would be an RLS/tier bug).
- [ ] Pitch deck status in `/admin/data-room` (current vs unverified).
- [ ] Font/layout: the regenerated PDFs use Times (Cormorant not in the build env) — fine for testing; flag if you want the exact brand font before go-live.

Jot anything off and send it over — I'll turn each into a Code fix prompt.
