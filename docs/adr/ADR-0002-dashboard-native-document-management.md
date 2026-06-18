# ADR-0002: Dashboard-Native Document Management (database as source of truth)

- **Status:** Proposed
- **Date:** 2026-06-18
- **Deciders:** Founder (Jim), Cowork (architecture), Claude Code (implementation)
- **Related:** the `feat/publish-to-dataroom` pipeline (manifest + Drive sources + drift detection), the investor/board data room (`investor_documents`, `investor-room` bucket), ADR-0001 (enum vs reference table — pending).

## Context

The investor/board data room currently sources documents from editable `.docx` files in Google Drive. Each publish is a manual chain: edit the docx in Drive → export a PDF → strip the control page → compute a fingerprint → drop the PDF in `supabase/seed/investor-room/` → hand-edit `manifest.json` → run `--check` / `--publish`. A daily audit watches Drive `modifiedTime` to flag drift.

This works but has three structural problems:

1. **Not bulletproof — the source of truth is outside the app.** The editable original lives in Google Drive. If it is edited out-of-band, moved, or accidentally deleted, the app cannot detect, prevent, or recover it, because the app never owned it. "Restore from the dashboard" is impossible when the dashboard does not hold the source.
2. **The publish process is cumbersome.** Five of the six steps (export, strip, hash, file-drop, manifest-edit) are pure mechanics a human performs by hand.
3. **Categories and lifecycle are not first-class.** Sections are hardcoded in a React component; "remove from the room," "restore a prior version," and "add a category" are not supported operations.

The founder's stated goal: manage documents "like a blog" — create, edit, update, and remove (un-publish) from the dashboard, with managed categories, no third-party editor, and a **bulletproof, restorable** process.

## Decision

**Make the application database the single source of truth for data-room documents.** Authors write content as Markdown in the admin dashboard; the system generates the branded PDF automatically on publish. Google Drive is no longer a dependency.

Specifically:

1. **Content lives in Postgres**, not Drive. A `documents` row holds the editable Markdown body plus metadata. The generated PDF is an *output* stored in Supabase Storage, never a hand-managed file.
2. **Full version history.** Every save snapshots the body into `document_versions`. Restore = promote a prior version. Removal is a soft `archived` status, never a hard delete.
3. **Categories are data**, managed in the admin (`categories` table), replacing the hardcoded section list. Adding a category is a row insert; it becomes a room section automatically.
4. **PDFs are generated**, not exported. On publish, Markdown → house-styled HTML → branded PDF (control page never exists, so nothing to strip) → Supabase Storage → served by the existing viewer and signed-URL download.
5. **Layered durability.** In-app version history + Supabase point-in-time recovery + an optional external archive copy (Markdown + PDF) written on each publish. Three independent recovery layers.

Drive becomes optional: either authors work entirely in the dashboard, or a one-time "Import from Drive/paste" snapshots content into the DB, after which the DB is canonical and Drive changes are irrelevant.

## Architecture

### Data model

- **`categories`** — `id, key, label, sort_order, is_active`. Drives room section grouping/order.
- **`documents`** — `id, title, category_id, audience` (prospect/investor/board), `doc_type`, `body_markdown`, `status` (draft/published/archived), `current_version`, `pdf_path`, `pdf_generated_at`, `published_at`, `created_at`, `updated_at`. Replaces the manifest as the registry; tier RLS mirrors the existing `investor_documents` model.
- **`document_versions`** — `id, document_id, version_no, body_markdown, title, category_id, audience, created_by, created_at`. Append-only snapshot on every save.

### PDF generation

Markdown → HTML (house stylesheet derived from `globals.css`: Cormorant/serif headings, Inter body, ivory/obsidian/gold, table styling) → PDF via headless Chromium. Default: `puppeteer-core` + `@sparticuz/chromium` (Vercel-serverless-compatible) invoked from an Inngest job on publish; alternative: a Gotenberg container or the ONLYOFFICE/Collabora doc-server if one is stood up for other reasons. The on-screen HTML preview and the PDF share the same stylesheet, so what you see is what downloads.

### Room wiring

The investor room reads from `documents` (published rows, RLS-tiered) instead of the seeded `investor_documents` manifest. The existing `/investor/documents` viewer and signed-URL download are reused against the generated `pdf_path`. The `manifest.json` + `scripts/seed-investor-docs.ts` + Drive drift-check are retired once migration completes.

## Consequences

**Positive**
- Bulletproof source ownership: nothing in the room depends on an external file; Drive edits/deletes are non-events.
- Restore from the dashboard at any time (version history) plus infra-level recovery (PITR) and external archive copies.
- The cumbersome publish chain collapses to "edit → publish"; no export/strip/hash/manifest steps; drift detection becomes unnecessary (no external source to drift from).
- Categories, removal, and restore become first-class admin operations.
- One stylesheet drives both the preview and the PDF.

**Negative / trade-offs**
- Markdown + house template reproduces document *structure* (headings, paragraphs, tables, Q&A) faithfully, but not arbitrary Word-layout fidelity. Mitigation: keep an optional `docx`/PDF *upload* escape hatch for the rare doc that needs exact Word layout (it bypasses generation and stores an uploaded PDF).
- A PDF-generation dependency (headless Chromium or a doc-server) must be operated. Mitigation: `@sparticuz/chromium` runs within Vercel for documents of this size; Gotenberg is the fallback if limits bite.
- A migration is required to move the existing 22 docs into the model.

## Alternatives considered

- **Keep Drive as the source (status quo).** Rejected: cannot be bulletproof or restorable — the failure mode the founder explicitly wants eliminated.
- **Embed a docx editor (ONLYOFFICE CE / Collabora CODE / Syncfusion).** Real `.docx` editing in-app, but still treats a binary file as the source, requires operating a document server (or a community-license dependency), and keeps the export/conform step. Heavier, and doesn't deliver the blog-simple lifecycle. Reconsider only if true Word fidelity becomes a hard requirement.
- **HTML-only room (no PDF).** Rejected: investors expect a downloadable, self-contained, brandable PDF artifact; the existing viewer is PDF-based.

## Migration

1. Ship the schema and admin UI behind the existing admin gating.
2. Seed `categories` from the current section list; seed `documents` from the 22 current room docs — their Markdown bodies already exist as the `dr_*.txt` sources Cowork produced this session.
3. Generate PDFs for all; verify against the live room.
4. Cut `/investor/documents` over to read from `documents`; retire `manifest.json`, the seed script, and the Drive drift-check.
5. Keep the external-archive-on-publish layer writing to a Drive "Archive" folder as the off-platform backup.
