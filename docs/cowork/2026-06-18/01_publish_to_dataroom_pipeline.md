# Publish to Data Room — Pipeline Spec (Prompts 1–5)

**For:** Claude Code · **Branch:** `feat/publish-to-dataroom`
Read `00_README_publish_to_dataroom.md` first. Build §A→§E in order. `npm run verify` clean after each.

---

## §A — Migration `041`: provenance + reconcile log (Prompt 1)

Create `supabase/migrations/041_data_room_provenance.sql`.

### A1. Provenance columns on `investor_documents`

Add (all nullable except `content_status`, so existing rows are valid):

```sql
alter table public.investor_documents
  add column if not exists source_system      text,           -- 'drive' | 'repo' | 'external'
  add column if not exists source_ref         text,           -- Drive file id, repo path, or 'external'
  add column if not exists source_name        text,           -- e.g. 'R01_LLV_Vision_and_Strategy.docx'
  add column if not exists source_version     text,           -- from the control page, e.g. 'v6'
  add column if not exists source_revised_at  date,           -- control-page revision date
  add column if not exists content_sha256     text,           -- fingerprint of normalized source text at publish time
  add column if not exists published_at       timestamptz,
  add column if not exists published_by       text,           -- 'cowork-pipeline' | admin email | 'admin-ui'
  add column if not exists last_reconciled_at timestamptz,
  add column if not exists content_status     text not null default 'unverified';

alter table public.investor_documents
  drop constraint if exists investor_documents_content_status_check;
alter table public.investor_documents
  add constraint investor_documents_content_status_check
    check (content_status in ('current', 'stale', 'source_missing', 'unverified'));

create index if not exists investor_documents_content_status_idx
  on public.investor_documents (content_status);
```

`content_status` semantics:
- `current` — last reconcile found the source fingerprint == published fingerprint.
- `stale` — source changed since publish (drift). **Action needed.**
- `source_missing` — the canonical source could not be located at reconcile time.
- `unverified` — never reconciled (all existing rows backfill to this until the first `--reconcile`).

### A2. Reconcile log

```sql
create table public.data_room_reconcile_log (
  id            uuid primary key default gen_random_uuid(),
  run_at        timestamptz not null default now(),
  document_id   uuid references public.investor_documents(id) on delete set null,
  storage_path  text,
  prev_status   text,
  new_status    text,
  drift         boolean not null default false,
  detail        text,
  Relationships text  -- placeholder note: in src/types/database.ts this table's Relationships must be []
);
```
> Do **not** add the `Relationships` column literally — that note is a reminder that in `src/types/database.ts` the generated type for this table must include `Relationships: []`. Create the table with `id, run_at, document_id, storage_path, prev_status, new_status, drift, detail` only.

RLS: admin-only (mirror the `investor_documents_all_admin` policy). Investors never read this table.

### A3. Backfill + types
- Existing rows already default to `content_status='unverified'`; no data backfill needed beyond that.
- Regenerate `src/types/database.ts`; confirm `data_room_reconcile_log` has `Relationships: []` and the new columns appear on `investor_documents`.

---

## §B — Unified publisher (Prompt 2)

Refactor `scripts/seed-investor-docs.ts` into the single source-of-truth publisher. Keep it CLI, keep the `SEED_TOOLS_ENABLED` gate and service-role client.

### B1. One manifest, richer entries

`supabase/seed/investor-room/manifest.json` becomes authoritative. Extend each entry:

```jsonc
{
  "file": "vision_and_strategy.pdf",
  "section": "concept",
  "title": "Vision & Strategy",
  "description": "The strategic spine - vision, model, and identity.",
  "sort_order": 40,
  "audience": "board",                 // prospect | investor | board  ← board uses the SAME pipeline
  "doc_type": "document",              // document | presentation
  "source": {
    "system": "drive",                 // drive | repo | external
    "ref": "1uGwXIU6TYsMrdCDOiHvdUSveYSzm7Kjh",  // Drive file id (or repo path, or "external")
    "name": "R01_LLV_Vision_and_Strategy.docx",
    "version": "v6",                   // from the document control page
    "revised_at": "2026-06-17",
    "text_sha256": "<filled by the publish step at export time>"
  }
}
```

Retire the duplicate `src/lib/seed/investor-docs-manifest.ts`: either (a) generate it from `manifest.json` at build, or (b) have `backfillPresentationTiers` read the JSON. **One list, not two.** Update `seed-investor.ts` accordingly.

### B2. Fingerprint
- The fingerprint is the **SHA-256 of the normalized source text** (lower-cased, whitespace-collapsed, control-page section excluded). For `external` sources (e.g. the RealReal 10-K) where there is no editable source, hash the PDF bytes and mark `source_system='external'` — these are reference filings and not expected to drift.
- For Drive-sourced docs, the text + version + revised_at come from the **export step** (the Cowork builder knows them when it produces the PDF) and are written into the manifest's `source.text_sha256` / `version` / `revised_at`. The publisher does not parse the stripped investor PDF for this.

### B3. Modes
Add an arg parser:
- `--publish` (default) — current behaviour **plus**: stamp all provenance fields, set `published_at=now()`, `published_by`, `content_status='current'`, `last_reconciled_at=now()`. Upsert by `storage_path` (idempotent).
- `--check` — **dry run, writes nothing.** Prints a reconciliation report: `ADD / UPDATE / PRUNE / UNCHANGED / DRIFT` per doc, plus a summary. Non-zero exit if any unexpected `DRIFT` so it can gate CI/pre-publish.
- `--reconcile` — see §C.
- `--prune` behaviour is **always applied within `--publish`/`--check`**: any `investor_documents` row whose `storage_path` is not in the manifest → mark for soft-unpublish (`is_published=false`), never delete the row or storage object. Report as `PRUNE`.

Output a clear summary: `N published, N updated, N pruned, N unchanged, N drift, N errors`.

---

## §C — Automatic drift detection + admin notify (Prompt 3)

This is the safety net the founder asked for: a job that reconciles documents for changes and **notifies the admin automatically**.

### C1. `--reconcile` (authoritative, Cowork-run — has Drive access)
For each published `investor_documents` row with `source_system='drive'`:
1. Re-read the canonical source from Drive (by `source_ref`), recompute the normalized-text SHA-256.
2. Compare to stored `content_sha256`:
   - match → `content_status='current'`, update `last_reconciled_at`.
   - differ → `content_status='stale'`, `drift=true`.
   - source not found → `content_status='source_missing'`.
3. Write a `data_room_reconcile_log` row per change (prev/new status, drift, detail).
4. If any `drift=true` or `source_missing` in the run, emit one Inngest event `dataroom/drift.detected` with the list of affected docs.

> **Why Cowork-run:** the app/database cannot read Google Drive, so it cannot by itself detect that a *source* changed. The `--reconcile` engine runs on the Cowork side and is invoked by the existing **`llv-daily-doc-audit`** scheduled task (which already reads Drive + Supabase every morning). Add a step to that audit: run `--reconcile`, then include any drift in the audit summary and flag the matching rows in the Notion "LLV Document Catalog — Source-of-Truth Map."

### C2. Admin notification
- New Inngest function `notify-dataroom-drift.ts` (mirror `notify-investor-document.ts`): on `dataroom/drift.detected`, send the founder a Resend email — "N data-room documents are out of sync with their source" — listing title, section, audience, source name/version, and detected-at. Add a matching Resend template under `src/lib/resend/emails/`.
- Register the function in `src/app/api/inngest/route.ts`.

### C3. Pure-SQL freshness view (the "or SQL query" the founder asked about)
A SQL check **cannot** see Drive, so it cannot detect source content changes on its own — but it can surface what the reconcile recorded and catch freshness-SLA violations. Add a view:

```sql
create or replace view public.data_room_currency as
select id, section, title, audience, is_published,
       content_status, source_name, source_version,
       published_at, last_reconciled_at,
       (last_reconciled_at is null
         or last_reconciled_at < now() - interval '7 days') as reconcile_overdue
from public.investor_documents
where is_published = true;
```
Admin-only via RLS/security barrier. The admin panel (§D) and any ad-hoc query read this. `content_status='stale'` or `reconcile_overdue=true` are the two "look at me" signals.

---

## §D — Admin "Data Room Currency" panel (Prompt 4)

A read-only admin route `(admin)/admin/data-room` (Lucide icons, Obsidian & Ivory). Reuse `assertAdmin`, `createAdminClient`.
- Table grouped by section: title, audience badge (prospect/investor/board), `content_status` badge (current=green, stale=amber, source_missing=red, unverified=gray), source name + version, published-at, last-reconciled-at.
- A **"Re-publish"** affordance per row that points the founder to the runbook step (it cannot run the Cowork pipeline from the browser — be explicit; do not fake it). Optionally a "Mark reviewed" that updates `last_reconciled_at` for `external` rows.
- **Converge the existing uploader:** update `src/actions/admin-presentations.ts` (`uploadInvestorPresentation`) to also set the new provenance fields (`source_system='external'` or `'repo'`, `published_by=<admin email>`, `content_status='unverified'`, `published_at=now()`) so in-app uploads are tracked by the same model — no untracked write path remains.

---

## §E — Investor-facing currency stamp (Prompt 5, optional)

On the `/investor/documents` cards (`filterable-doc-list.tsx`), render a small "As of \<source_revised_at or published_at\> · \<source_version\>" line when present. Quiet, serif, muted — it signals currency to both the investor and the founder. No control page is ever shown to investors.

---

## Acceptance checklist
- [ ] `041` applied; types regenerated; `data_room_reconcile_log` has `Relationships: []`.
- [ ] Single manifest; `investor-docs-manifest.ts` no longer a hand-kept second copy.
- [ ] `--check` reports ADD/UPDATE/PRUNE/UNCHANGED/DRIFT and exits non-zero on unexpected drift; writes nothing.
- [ ] `--publish` stamps provenance and soft-unpublishes pruned docs (no hard delete).
- [ ] `--reconcile` sets `content_status`, logs to `data_room_reconcile_log`, emits `dataroom/drift.detected`.
- [ ] `llv-daily-doc-audit` runs `--reconcile` and reports drift to the founder + Notion catalog.
- [ ] Drift email sends via Resend/Inngest to the founder.
- [ ] Admin `/admin/data-room` shows status; presentation uploader writes provenance fields.
- [ ] Board content verified: a `audience='board'` manifest entry publishes through the same path and is visible only to board-tier viewers (RLS `tier_rank`).
- [ ] `npm run verify` clean.
