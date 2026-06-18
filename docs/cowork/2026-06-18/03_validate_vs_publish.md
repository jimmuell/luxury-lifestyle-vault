# Validation Run — First Publish (Vision & Strategy)

**For:** Claude Code (or founder) · **Branch:** `feat/publish-to-dataroom`
**Goal:** prove the publish → provenance → status round-trip end to end using the one fully-provisioned doc, **Vision & Strategy**.

> ⚠️ This writes to the live Supabase project (storage bucket + `investor_documents`). Run only when the founder is ready to refresh the live room.

## Preconditions
1. Migrations **041** and **042** are applied: `npx supabase db push`; then regenerate types
   `npx supabase gen types typescript --linked > src/types/database.ts` and confirm `npm run verify` is clean.
2. `SEED_TOOLS_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` present in env.
3. Cowork has already: replaced `supabase/seed/investor-room/vision_and_strategy.pdf` with the rebuilt 7-page
   control-page-stripped copy, and filled the V&S manifest `source` block (ref, version, revised_at, text_sha256).

## What is and isn't provisioned (expected)
- **Vision & Strategy** is fully provisioned (Drive ref + fingerprint) → should land `content_status='current'`.
- The other **22** docs are plumbed but **not yet provisioned** (no Drive ref, no fingerprint; the two RealReal
  filings are `external`). They are expected to publish as `unverified`. That is fine — provisioning the full
  room↔vault mapping is a separate Cowork data task. This run validates the machine, not the whole library.

## Steps
1. **Dry run:** `npx tsx scripts/seed-investor-docs.ts --check`
   - Expect **Vision & Strategy → UPDATE** (new PDF + fingerprint replacing the 2026-06-10 copy).
   - Expect no unexpected `PRUNE`. Admin-uploaded docs (if any) must be exempt from prune.
   - Confirm exit code is 0 (no unexpected DRIFT).
2. **Publish:** `npx tsx scripts/seed-investor-docs.ts --publish`
3. **Reconcile (local modes):** `npx tsx scripts/seed-investor-docs.ts --reconcile`
   - Note: the authoritative Drive-vs-published check for `vision_and_strategy` runs **Cowork-side** in the daily
     audit (the Node script cannot read Drive). Node `--reconcile` covers external byte-hash + DB state only.
4. **Verify in the app:**
   - `/admin/data-room` → Vision & Strategy shows `current`, audience badge, source `R01_LLV_Vision_and_Strategy.docx · v6`,
     published-at set.
   - `/investor/documents` → Vision & Strategy serves the new 7-page PDF with the "As of 2026-06-17 · v6" stamp.

## Report back
- The `--check` report (counts), the `--publish` summary, and the `/admin/data-room` status for Vision & Strategy.
- Any doc that errored or pruned unexpectedly.
