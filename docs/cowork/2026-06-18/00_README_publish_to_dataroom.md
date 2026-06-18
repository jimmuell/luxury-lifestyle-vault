# Publish to Data Room — Code-Prompt Set (2026-06-18)

**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/publish-to-dataroom` (off `main`)
**Feature:** A single, audience-generic **publish + automatic drift-detection** pipeline for the investor/board data room — so every document in the room has known provenance (which canonical source it came from, at what version) and the system tells the admin when a room document has fallen out of sync with its source.

---

## Why this exists (the problem)

The data room (`/investor/*`, the `investor_documents` table + `investor-room` storage bucket) is fed today by **`scripts/seed-investor-docs.ts`**, which reads `supabase/seed/investor-room/manifest.json` + local PDFs and **upserts** rows by `storage_path`. That pipeline has three gaps that are a financial/reputational risk for an investor-facing room:

1. **No provenance.** A room PDF does not record which canonical source doc it came from, or at what version. You cannot tell whether a room doc is current.
2. **No drift detection.** If a source doc changes and the room PDF is not re-published, nothing flags it. Investors can read superseded content silently. (This is live today: the binder PDFs are dated 2026-06-10 and predate the 2026-06-15→17 vault rebuild — e.g. the room's `vision_and_strategy.pdf` is the pre-rebuild content.)
3. **No prune.** The script only upserts; removing an entry from the manifest does **not** remove the doc from the room.

There are also **two** copies of the manifest — `manifest.json` (CLI) and `src/lib/seed/investor-docs-manifest.ts` (`INVESTOR_DOCS_MANIFEST`, used by `backfillPresentationTiers`) — and a separate in-app uploader for presentations only (`src/actions/admin-presentations.ts`). A new feature must **converge** these, not add a fourth path.

## Design principles

- **One publisher, audience-generic.** `prospect | investor | board` are tiers on the *same* documents (`investor_documents.audience`, RLS via `tier_rank`). The board "dashboard" is the same room filtered to `audience='board'`. Board content therefore flows through the **same** publish pipeline — tag it `board` in the manifest. **No separate board ingestion code.**
- **Provenance is mandatory.** Every published doc records source system/ref/name, source version (from the document control page), a content fingerprint, and published-at. Nothing reaches the room untracked.
- **The publisher lives where the source lives.** Drift detection requires comparing the room doc against its **canonical source in Google Drive**. The app cannot read Drive. So the authoritative reconcile is run by the Cowork side (which has Drive access) on a schedule; the app stores fingerprints and surfaces status + notifies the admin.
- **Fail safe, not silent.** Publish is blocked when a pre-flight check shows unexpected drift. Removal is a soft-unpublish (audit preserved), never a silent hard delete.

---

## Decisions baked in (defaults — founder may override)

| Decision | Default chosen | Alternative |
|---|---|---|
| Drift fingerprint basis | **Normalized source text** SHA-256 (ignores cosmetic re-exports → fewer false alarms) | Exported-PDF bytes hash |
| Removal behavior | **Soft-unpublish** (`is_published=false`, row + file retained for audit) | Hard delete row + storage object |
| Publisher system of record | **Cowork/CLI pipeline** (extends the seed script) | In-app admin upload (cannot see Drive → cannot detect drift) |

The founder deferred the first two; these are the recommended defaults and are reversible. Confirm before Prompt 2 if you disagree.

---

## Prompt sequence (build in order)

| # | File | Builds | Depends on |
|---|---|---|---|
| 1 | `01_publish_to_dataroom_pipeline.md` §A | Migration `041`: provenance columns on `investor_documents`; `data_room_reconcile_log` table; backfill existing rows to `content_status='unverified'`; type regen | — |
| 2 | `01_..._pipeline.md` §B | Unified **publisher** (extend `scripts/seed-investor-docs.ts`): single manifest as source of truth; source fingerprint + provenance stamping; audience-aware upsert; **prune** (soft-unpublish); modes `--publish` / `--check` (dry-run) / `--reconcile` | 1 |
| 3 | `01_..._pipeline.md` §C | **Automatic drift detection + admin notify**: `--reconcile` compares live source vs stored fingerprint, writes `content_status` + reconcile log, emits `dataroom/drift.detected` → Resend admin email; wired into the daily Cowork audit | 1, 2 |
| 4 | `01_..._pipeline.md` §D | **Admin "Data Room Currency" panel**: read-only provenance + drift status per doc, republish trigger; fold the existing presentation uploader's writes into the same provenance fields | 1, 2 |
| 5 | `01_..._pipeline.md` §E *(optional)* | Investor-facing **"As of \<date\> · v\<n\>"** currency stamp on doc cards | 1 |

Prompts 4 and 5 can follow 3 in any order. Each prompt ends with `npm run verify` clean and a report-back.

## Operating procedure

The repeatable human workflow (export → manifest → `--check` → publish → verify) is documented separately in **`llv_publish_to_dataroom_runbook.md`** — that is the SOP the founder/Cowork follows; this set is the code that makes it work.

---

## Workflow & guardrails (read first)

- **Branch:** all work on `feat/publish-to-dataroom` off `main`. Commit incrementally per prompt; open a PR for the founder to review/merge. **Do not build on `main`.**
- **Local environment:** the founder runs the dev server — do **NOT** run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Node 20.19.5; never hand-edit `node_modules`.
- **Migrations:** new migration is `041` (latest in-repo is `040`). After schema changes: `npx supabase gen types typescript --linked > src/types/database.ts`; confirm every new table has `Relationships: []`; apply with `npx supabase db push`.
- **Conventions (CLAUDE.md):** Shadcn on Base UI — no `asChild`, use `buttonVariants` on `<Link>`. **Lucide icons only, no emoji** in UI. Obsidian & Ivory palette via `globals.css`. Server Actions re-verify the session (`supabase.auth.getUser()`), derive ids from `user.id`, return `{ error }` / `{ success }` / `{ data }`. Reuse existing helpers: `assertAdmin` pattern, `createAdminClient`, `INVESTOR_BUCKET`, the `investor/document.published` Inngest pattern, `getInvestorDocSignedUrl`.
- **Secrets:** the seed/publish path is gated by `SEED_TOOLS_ENABLED=true` and uses `SUPABASE_SERVICE_ROLE_KEY`; keep it server/CLI-only. Confidential PDFs stay git-ignored (`supabase/seed/investor-room/*.pdf`).

## Out of scope (note for later)

- Per-investor document visibility (the tier ladder already covers prospect/investor/board groups).
- Download watermarking with viewer identity (the `investor_document_views` audit table already records who viewed/downloaded what).
- Auto-republish on drift — intentionally **not** included; drift **flags**, a human republishes. Auto-pushing source changes into an investor room is the failure mode we are preventing.
