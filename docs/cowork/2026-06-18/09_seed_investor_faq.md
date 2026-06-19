# Seed the Investor FAQ page

**For:** Claude Code · **Branch:** `feat/publish-to-dataroom` (or a small follow-up branch)
**Goal:** load the 13 finalized investor FAQ entries into the `investor_faq` table so they appear on `/investor/faq`. Content is ready in `supabase/seed/investor-faq.json` (all prospect-tier, published).

## Build a small seed script

Create `scripts/seed-investor-faq.ts` (mirror `scripts/seed-investor-docs.ts`):
- Gate on `SEED_TOOLS_ENABLED === 'true'`; use the service-role client (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`).
- Read `supabase/seed/investor-faq.json` → `faq[]`.
- **Idempotent upsert by `question`**: for each entry, update the existing row with that exact `question` if present, else insert. (No unique constraint exists on `question`, so do a select-by-question then update-or-insert; don't create duplicates on re-run.) Set `question`, `answer`, `audience`, `sort_order`, `is_published`.
- Print a summary: inserted / updated / unchanged.

Run it: `npx tsx scripts/seed-investor-faq.ts`

## Verify
- `/admin/faq`: 13 entries listed, all published, prospect audience, in sort order.
- `/investor/faq` (as an investor or the demo investor): the 13 Q&A render in order.

## Notes
- `investor-faq.json` is FAQ content behind the NDA gate; it is not the confidential binder. Commit it (and the script) on the branch, or add it to `.gitignore` if you'd rather keep seed content out of git — your call, but the script needs the file present at run time.
- `npm run verify` clean; report the seed summary back.
