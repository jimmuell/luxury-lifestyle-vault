# Publish the new data-room docs + add two section labels

**For:** Claude Code · **Branch:** `feat/publish-to-dataroom`
**Context:** Cowork finalized and provisioned five investor data-room documents (Cap Table, Market Sizing, Compliance, Leadership & Team, IP & Brand). Their PDFs are in `supabase/seed/investor-room/` and their entries (with source IDs, fingerprints, modified-time baselines, sections, audience) are in `manifest.json`. Two use new sections that need display labels.

> Writes to the live Supabase room. Run when the founder is ready.

## 1. Add the two new section labels

In `src/components/investor/filterable-doc-list.tsx`:
- Add `'team'` and `'ip'` to `SECTION_ORDER` (suggest after `'concept'` / before `'legal'` — your call on placement).
- Add to `SECTION_LABELS`:
  - `team: 'Leadership & Team'`
  - `ip: 'Intellectual Property & Brand'`

Check `src/app/(admin)/admin/data-room/page.tsx` — if it has its own section-label map, add the same two there so the admin panel groups them with proper names. (Unknown sections already render by raw key, so this is polish, not a blocker.)

Run `npm run verify` clean.

## 2. Publish the provisioned docs

1. `npx tsx scripts/seed-investor-docs.ts --check`
   - Expect 5 **ADD** (the new data-room docs), no unexpected PRUNE/DRIFT, exit 0.
2. `npx tsx scripts/seed-investor-docs.ts --publish`
3. Verify:
   - `/admin/data-room` shows the five `current` with provenance (source name, v1, published-at) and audience badges (Cap Table = board; the rest = investor).
   - `/investor/documents` (as an investor) shows Leadership & Team, Market Sizing, Compliance, IP & Brand with the "As of 2026-06-18 · v1" stamp. Cap Table appears only to board-tier viewers.

## 3. Report back
The `--check` counts, the `--publish` summary, and the `/admin/data-room` status for the five.

## Notes
- The manifest and PDFs are git-ignored, so the only committable change here is the section-label edit. Commit that on the branch.
- These five sources are the **copies** in `02 Investor Materials / Data Board Room / Investor` (and `/ Board Meeting` for Cap Table). The founder is keeping duplicate originals at the folder root for now — the daily audit will flag those as duplicates until removed; not a publish blocker.
