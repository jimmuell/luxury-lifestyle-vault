# Restore view/download audit, then retire the old pipeline

**For:** Claude Code · **Branch:** `feat/doc-management`
**Context:** Phases 4–5 are live; `/investor/*` reads from `documents`. Two cleanup tasks: (A) re-point the view/download audit to the new table so logging works again, then (B) retire the old manifest pipeline. Do A before B. Do **not** start until the founder confirms the new room verified in the UI.

## Part A — Re-point the audit trail to `documents`

`investor_document_views.document_id` currently FKs `investor_documents(id)`. The new routes don't log because they serve `documents` rows.

- **Migration `044`:** drop the FK `investor_document_views.document_id → investor_documents`, and add `document_id uuid references public.documents(id) on delete cascade`. The room is pre-launch, so existing view rows (if any) are test data — clear them in the same migration (`truncate investor_document_views`) rather than attempting an id remap. Keep the table, its RLS (admin-select, investor-insert-own), and indexes.
- **Re-enable logging on the new routes:** in `/investor/documents/[id]/view` (view event) and `/api/investor/documents/[id]` (download event), insert an `investor_document_views` row with the **`documents`** id, `view_type` view/download, `profile_id = auth.uid()` — mirroring the prior behavior.
- Regenerate types; `npm run verify`.

## Part B — Retire the old pipeline (after A verifies)

Nothing investor-facing reads these anymore:
- `scripts/seed-investor-docs.ts`
- `scripts/dataroom_fingerprint.py`
- `supabase/seed/investor-room/manifest.json`
- the dead exports in `src/lib/queries/investor.ts` (`getInvestorDocuments` / `InvestorDocument`) and any now-unused `investor-docs-manifest.ts`.

**Keep for now:** the `investor_documents` table itself (historical data + rollback). It can be dropped in a later migration once you're confident — only possible after Part A removes the FK to it. Don't drop it in this pass.

**Also (Cowork will handle):** update the `llv-daily-doc-audit` scheduled task to drop the Drive data-room drift step (no external source to drift from now), and update ADR-0002 status to Accepted/Implemented.

## Report back
- Part A: migration applied, a test view + download each logged a row against a `documents` id.
- Part B: the four items removed, `npm run verify` clean, branch pushed.
