# Final Data-Room Publish — full 22-document room

**For:** Claude Code · **Branch:** `feat/publish-to-dataroom`
**Supersedes** the partial publish in `06_dataroom_publish_new_docs.md`. The whole room is now provisioned in `manifest.json`: 22 docs (16 investor, 5 board, 1 prospect), all sourced from the **Investor** folder, all conformed (control-page-stripped, house style), every text doc fingerprinted; the 2 RealReal filings + brochure are `external` (byte-hashed at publish), the pitch deck is a presentation.

> Writes to the live Supabase room. Run when the founder is ready.

## 1. Section labels

In `src/components/investor/filterable-doc-list.tsx`:
- Add `'team'` and `'ip'` to `SECTION_ORDER`.
- Add to `SECTION_LABELS`: `team: 'Leadership & Team'`, `ip: 'Intellectual Property & Brand'`.

Mirror the same two labels into `src/app/(admin)/admin/data-room/page.tsx` if it has its own section-label map. `npm run verify` clean.

## 2. Publish

1. `npx tsx scripts/seed-investor-docs.ts --check`
   - Expect the 16 investor + 5 board + 1 prospect docs as **ADD/UPDATE**, and **6 PRUNE** (the trimmed docs: concept_packet, trr_research_notes, client_onboarding_sop, inventory_intake_strategy, wardrobe_concierge_blueprint, launch_gates_action_plan — these soft-unpublish). Exit 0, no unexpected DRIFT.
2. `npx tsx scripts/seed-investor-docs.ts --publish`
3. `npx tsx scripts/seed-investor-docs.ts --reconcile`

## 3. Verify

- `/admin/data-room`: 22 published docs, each `current`, with provenance (source name, version, published-at). Audience badges: Cap Table / Assumptions / Integrated Analysis / Operations / Launch Plan = **board**; the rest = **investor**; pitch deck = **prospect**.
- `/investor/documents` as an **investor**: 16 docs across The Concept, Strategy, Market & Competitive, Product & Technology, Legal & Risk, Leadership & Team, Intellectual Property & Brand — each with an "As of 2026-06-18 · v…" stamp. The 5 board docs do **not** appear.
- As a **board** viewer: the 5 board docs additionally appear under Financials / Strategy / Operations / Launch Plan.

## 4. Report back
The `--check` counts, the `--publish` summary, and the `/admin/data-room` status grid.

## Notes
- The only committable repo change is the section-label edit (manifest + PDFs are git-ignored). Commit it on the branch.
- The 6 trimmed PDFs still sit in `supabase/seed/investor-room/` as orphans (not in the manifest, so never published). You may `rm` them for tidiness; the publisher's prune handles their DB rows.
- All 22 sources now live in `02 Investor Materials / Data Board Room / Investor` (Cap Table too). The founder is keeping duplicate originals elsewhere for now — the daily audit will flag those as duplicates until removed; not a publish blocker.
