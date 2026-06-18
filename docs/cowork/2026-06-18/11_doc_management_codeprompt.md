# Dashboard-Native Document Management — Implementation Spec

**For:** Claude Code · **New branch:** `feat/doc-management` (off `main`)
**Decision record:** `docs/adr/ADR-0002-dashboard-native-document-management.md` — read it first for the why.
**Goal:** make the **database the source of truth** for data-room docs. Authors write Markdown in `/admin`; the system generates the branded PDF on publish. Blog-style create / edit / update / archive, managed categories, version history + restore, and layered backups. Retire the Drive→export→manifest chain.

Build in phases; each ends `npm run verify` clean with a report-back. Latest migration in repo is `042` → start at `043`. Regenerate `src/types/database.ts` after each schema change and confirm `Relationships: []` on every new table.

---

## Phase 1 — Schema (migration `043`)

Three tables; RLS mirrors `investor_documents` (admin full CRUD; investors read published rows at/below their tier via `tier_rank(get_my_tier()) >= tier_rank(audience)`).

- **`categories`**: `id uuid pk`, `key text unique`, `label text`, `sort_order int`, `is_active bool default true`, timestamps. Seed from today's sections: concept→"The Concept", strategy→"Strategy", market→"Market & Competitive", financials→"Financials", product→"Product & Technology", operations→"Operations", launch→"Launch Plan", legal→"Legal & Risk", team→"Leadership & Team", ip→"Intellectual Property & Brand", deck→"Pitch Deck".
- **`documents`**: `id uuid pk`, `title text`, `category_id uuid fk→categories`, `audience text check (prospect|investor|board) default 'investor'`, `doc_type text default 'document'`, `body_markdown text`, `source_kind text check (markdown|upload) default 'markdown'`, `status text check (draft|published|archived) default 'draft'`, `sort_order int default 0`, `current_version int default 1`, `pdf_path text`, `pdf_generated_at timestamptz`, `published_at timestamptz`, timestamps. `updated_at` trigger.
- **`document_versions`**: `id uuid pk`, `document_id uuid fk→documents on delete cascade`, `version_no int`, `body_markdown text`, `title text`, `category_id uuid`, `audience text`, `created_by uuid`, `created_at timestamptz default now()`. Unique `(document_id, version_no)`.

RLS: `documents` — investor select where `status='published'` and tier check; admin all. `document_versions` + `categories` — admin all; `categories` also readable by investors (needed to render section labels). Reuse the private `investor-room` bucket for generated PDFs (admin-only direct access; investors get signed URLs).

---

## Phase 2 — Admin "Documents" screen (`/admin/documents`)

A blog-style manager (reuse `assertAdmin`, Server Action return convention, Lucide icons, Obsidian & Ivory).

- **List** grouped by category, showing status badge (draft/published/archived), audience, version, last-updated. Filter by category/status.
- **Create / Edit** a document: title, category (select from `categories`), audience tier, and a **Markdown editor with live preview** (the preview uses the *same* stylesheet as the PDF — see Phase 3 — so WYSIWYG). On **Save**: write `documents` + append a `document_versions` snapshot, increment `current_version`, status stays draft unless publishing.
- **Publish / Unpublish / Archive**: Publish triggers PDF generation (Phase 3), sets `status='published'`, `published_at`. Unpublish → `draft`. "Remove from room" → `status='archived'` (soft; reversible). Hard delete is a separate, `useConfirm()`-gated action, rarely used.
- **Version history**: list versions; "Restore" copies a prior version's body/title/category/audience into the current doc as a new version (then the admin can re-publish). This is the dashboard restore path.
- **Optional upload escape hatch**: `source_kind='upload'` lets an admin upload a finished PDF directly (for docs needing exact Word layout); generation is skipped for those.
- **Category manager** (`/admin/categories` or a panel): CRUD categories — add (new room section appears automatically), rename, reorder, deactivate. Guard: can't deactivate/delete a category with published docs (reassign first).

---

## Phase 3 — PDF generation (the core)

On publish, render `body_markdown` → **house-styled HTML → branded PDF** → upload to the `investor-room` bucket (`documents/<id>.pdf`), set `pdf_path` + `pdf_generated_at`.

- **One shared stylesheet** (`src/lib/docs/house-style.css` or a template module) derived from `globals.css`: serif (Cormorant) headings + Inter body, ivory page / obsidian text / gold rules and table headers, masthead ("LUXURY LIFESTYLE VAULT" + tagline + title), running footer ("Luxury Lifestyle Vault · Confidential & Proprietary" + page number). The admin live-preview renders the same HTML+CSS so preview == output. **No control page is ever generated** (it only existed to be stripped).
- **Engine:** `puppeteer-core` + `@sparticuz/chromium` (Vercel-serverless-compatible) run inside an **Inngest job** (`generate-document-pdf`) triggered on publish — keeps the heavy work off the request path and lets it retry. Markdown→HTML via a vetted renderer (e.g. `marked` or `markdown-it`) with table support; sanitize. If Chromium-on-Vercel proves too heavy, fall back to a Gotenberg container (HTTP `convert/html`) — keep the renderer behind a small interface so the engine is swappable.
- **Fingerprint (optional, for parity with the room's provenance UI):** store a content hash of the normalized Markdown on the row; it's now trivially authoritative since the source is local.

Register the Inngest function in `src/app/api/inngest/route.ts`.

---

## Phase 4 — Wire the investor room to `documents`

- `/investor/documents` reads **published `documents`** (RLS-tiered), grouped by `categories` (ordered by `categories.sort_order`, then `documents.sort_order`). Section labels come from `categories.label` — retire the hardcoded `SECTION_ORDER`/`SECTION_LABELS` in `filterable-doc-list.tsx`.
- Reuse the existing PDF **viewer** and the signed-URL **download** helper against `documents.pdf_path`.
- `/admin/data-room` (currency panel) reads from `documents` too (status, version, published-at, audience).
- Keep the tier split working (prospect/investor/board) exactly as today.

---

## Phase 5 — Migrate the existing 22 docs

- Seed `categories` (Phase 1).
- Seed `documents` from the 22 current room docs. **Their Markdown bodies already exist** as the `dr_*.txt` sources Cowork produced this session (Cowork will supply them as a clean Markdown set / JSON: title, category, audience, body). Insert as `status='published'`, `source_kind='markdown'`, correct tier; the 2 RealReal filings + the pitch deck come in as `source_kind='upload'` (they're external/binary — attach the existing PDFs).
- Run Phase 3 generation for all; verify the room renders identically (spot-check Vision & Strategy, a table doc, and a board-tier doc).
- Then retire: `manifest.json`, `scripts/seed-investor-docs.ts`, `scripts/dataroom_fingerprint.py`, and the Drive data-room step in `llv-daily-doc-audit` (Cowork updates the scheduled task). The investor-docs-manifest TS, presentation uploader, etc. fold into the new model or are removed.

---

## Phase 6 — Durability (bulletproof layers)

1. **Version history** (Phase 1/2) — in-app restore.
2. **Supabase PITR / automated backups** — confirm enabled on the production project (founder/DevOps).
3. **External archive on publish** — an Inngest step writes a copy of `{body_markdown, generated pdf}` to an off-platform store (a Drive "Data Room / Archive" folder via the Drive connector/service account, or a second storage bucket) keyed by doc id + version. Belt-and-suspenders so a catastrophic DB loss still leaves recoverable files.

---

## Decisions to confirm before Phase 3
- **Authoring model:** Markdown-in-dashboard as the default, with the `upload` escape hatch for Word-fidelity docs — confirm this split (the alternative is embedding a docx editor per ADR-0002's rejected option).
- **PDF engine:** `@sparticuz/chromium` on Vercel (no new infra) vs. a Gotenberg container (more robust, one small service). Default to the former; spec keeps it swappable.

## Out of scope (later)
- Rich-text WYSIWYG instead of Markdown (can layer on once the model is in).
- Per-document watermarking of downloads with viewer identity (the view-audit table already records who downloaded what).
- Board-meeting packet assembly (multi-doc bundles).
