# Runbook — Publish to Data Room (Investor & Board)

**Owner:** Founder + Cowork · **Applies to:** the gated data room at `/investor/*` (audiences: prospect / investor / board)
**Companion to:** the `feat/publish-to-dataroom` code-prompt set. This is the repeatable human procedure; the pipeline is the code that enforces it.

> **One rule above all:** investor- and board-facing content reaches the room **only** through this procedure. No ad-hoc uploads that bypass provenance. The board room is not a separate system — it is the same room filtered to `audience='board'`; board docs are published the same way, tagged `board`.

---

## Roles & why the steps are where they are

- The **canonical source** for a house doc is the `.docx` in the Drive vault (governed by the Master Document Standard). It is the only thing you *edit*.
- The **room copy** is a published, control-page-stripped PDF snapshot. It changes only when you deliberately re-publish.
- **Drift detection runs on the Cowork side** because comparing a room doc to its Drive source requires Drive access, which the app does not have. The daily audit is the automatic backstop; this runbook is the deliberate publish action.

---

## A. Publish or update a document

1. **Edit the source** in the Drive vault as usual (e.g. `R01_LLV_Vision_and_Strategy.docx`). Bump its **control-page version** (e.g. v6) and revision date when content materially changes — that version is what the room records and what drift detection keys on.
2. **Export the room PDF** from the source: house style, **control page stripped** for the investor-facing copy; keep the of-record copy (with control page) in the vault. Capture the version, revision date, and the normalized-text SHA-256 at export time.
3. **Drop the PDF** into `supabase/seed/investor-room/` (git-ignored).
4. **Update `manifest.json`** — the single source of truth. For the entry, set: `file`, `section`, `title`, `description`, `sort_order`, `audience` (`prospect` | `investor` | `board`), `doc_type`, and the `source` block (`system`, `ref` = Drive file id, `name`, `version`, `revised_at`, `text_sha256`).
5. **Pre-flight:** run the publisher in check mode — `npx tsx scripts/seed-investor-docs.ts --check`. Review the `ADD / UPDATE / PRUNE / UNCHANGED / DRIFT` report. **Do not proceed if anything unexpected shows as DRIFT or PRUNE.**
6. **Publish:** `npx tsx scripts/seed-investor-docs.ts --publish`. This uploads the PDF, stamps provenance, and sets `content_status='current'`.
7. **Verify:** the doc appears at `/investor/documents` for the right audience, with the "As of … · v…" stamp; `content_status` shows `current` in `/admin/data-room`.

## B. Add a brand-new document

Same as A, starting at step 2 (export). Pick the correct `section` and `audience`. For **board-only** material, set `audience: "board"` — it will be visible only to board-tier viewers via RLS, with no separate code path.

## C. Remove a document

1. Delete its entry from `manifest.json`.
2. Run `--check` (confirm it reports the doc as `PRUNE`), then `--publish`.
3. The publisher **soft-unpublishes** it (`is_published=false`); the row, file, and view-audit history are retained. It disappears from the room but stays recoverable. (Hard deletion, if ever needed, is a manual admin action — deliberately not automated.)

## D. External / reference filings (e.g. RealReal 10-K, press release)

These have no editable source, so they cannot "drift." Tag `source.system: "external"`; the publisher fingerprints the PDF bytes and marks them `external`. They are excluded from source-drift alerts; review them manually each cycle.

---

## E. Automatic drift detection (what runs without you)

- The **`llv-daily-doc-audit`** scheduled task runs `--reconcile` every morning. For each Drive-sourced room doc it recomputes the source fingerprint and compares it to what was published:
  - unchanged → `content_status='current'`, `last_reconciled_at` refreshed.
  - changed → `content_status='stale'` and a **drift email to the founder**, plus a flag in the Notion "LLV Document Catalog — Source-of-Truth Map" and in the daily audit summary.
  - source not found → `content_status='source_missing'` (same alerting).
- **Your response to a drift alert:** open `/admin/data-room`, confirm which docs are `stale`, then re-run procedure **A** (export the updated source → manifest → `--check` → `--publish`) for each. Status returns to `current`.
- **Freshness SLA:** any published doc not reconciled in 7 days shows `reconcile_overdue` in the `data_room_currency` view / admin panel, even if no change was detected — a prompt to confirm the source is still where it should be.

---

## F. Quick reference

| Task | Command |
|---|---|
| See what would change (safe) | `npx tsx scripts/seed-investor-docs.ts --check` |
| Publish / update the room | `npx tsx scripts/seed-investor-docs.ts --publish` |
| Reconcile against sources now | `npx tsx scripts/seed-investor-docs.ts --reconcile` |

Prereqs: `SEED_TOOLS_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in env; PDFs present in `supabase/seed/investor-room/`; `manifest.json` updated.

> **Do not** run `npm run dev` as part of publishing — the pipeline talks to Supabase directly and needs no dev server. Server/manual UI checks are the founder's.

---

## G. Current known drift (as of 2026-06-18)

The live room PDFs date to 2026-06-10 and predate the 2026-06-15→17 vault rebuild/rename. At minimum the rebuilt **Vision & Strategy (v6)** should be re-exported and re-published; a first full `--reconcile` after the pipeline ships will enumerate every stale doc. Until then, treat the room as **unverified**.
