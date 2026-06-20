# ADR-0004: Google-Drive-Sourced PDFs (retire the in-app editor)

- **Status:** Accepted
- **Date:** 2026-06-19
- **Supersedes:** ADR-0003 (constrained rich-text editor — **retired**) and the in-app *authoring/generation* of ADR-0002. **Retained from ADR-0002:** the `documents` table, categories, audience/tier RLS, the investor-room storage bucket, the PDF viewer, signed-URL downloads, and the view/download audit.
- **Context:** Markdown→HTML→PDF generation (and the rich editor on top of it) could never perfectly reproduce the house document styling — every translation loses fidelity. After building both, the founder chose the approach that has **zero translation loss**: author in Google Docs, render the **Google-Docs-exported PDF** directly. The only processing is removing the internal control page so it doesn't render in the room.

## Decision

The investor room renders **PDFs exported from Google Docs sources**. The app stores the canonical PDF in Supabase Storage and serves it via the existing viewer; **Google Drive is an optional upstream source, not a runtime dependency** (once imported, the room serves its stored PDF even if Drive is down). The in-app editor and all Markdown/HTML→PDF generation are retired.

Source format: **native Google Docs** (not `.docx`) — the Drive API exports them straight to PDF with no external converter and perfect fidelity.

Delivered in two phases:
- **Phase 1 (manual):** admin exports the PDF from Drive, uploads it to the dashboard, sets the **category + tier**, optionally **marks the Google Drive source** (link/file id) on the record, and optionally **strips the control page** on upload. The room renders it. *(This reuses the existing `source_kind='upload'` path.)*
- **Phase 2 (automated):** a Supabase Cron job invokes a Supabase Edge Function that, for docs marked with a Drive source, detects changes (Drive `modifiedTime`/checksum), re-exports the Doc → PDF, strips the control page, uploads, and updates metadata. A manual "Sync" button calls the same function. *(Per the founder's technical spec, adapted to our existing tables.)*

## Architecture (extends, doesn't duplicate)
- **`documents` table** gains: `source_type` (`manual_upload` | `google_drive`), `google_file_id`, `google_web_view_link`, `google_modified_time`, `google_md5_checksum`, `sync_status`, `last_synced_at`, `last_checked_at`, `last_sync_error`. Room docs are `source_kind='upload'` (a stored PDF).
- **Control-page strip:** `pdf-lib` removes page 1 on ingest (toggle in Phase 1; automatic in Phase 2).
- **Reused as-is:** investor-room bucket, signed-URL viewer + download, categories, tier RLS, the admin data-room panel, the audit log.
- **Retired:** the TipTap editor, `body_html`/`body_markdown` generation, `generate-document-pdf` Inngest function, embedded fonts (`font-data.ts`), `mammoth`, `marked` for body. (Remove from the flow; delete code where clean.)

## Consequences
- **+** Perfect fidelity (Google's own rendering); author in the tool the founder prefers; no translation loss; the room/viewer/storage/audit foundation is reused.
- **−** Google Drive is the editable source again (ADR-0002 had moved off it). Mitigated: rendering stays bulletproof because LLV serves its own stored PDF; Drive provides version history for editing. The rich-editor build is shelved.

## Alternatives (already evaluated)
- In-app Markdown / rich-text editor (ADR-0002/0003): fidelity ceiling + translation loss — the problem this solves.
- ONLYOFFICE embedded editor (spike 16): full Word editing but a service to operate; unnecessary once we just render Drive exports.

---

## Addendum — Phase 2 corrections (2026-06-20)

The Phase 2 section above contains two assumptions that were invalidated before implementation:

### Source format

ADR-0004 stated *"native Google Docs (not `.docx`)"* as the canonical source format. This is **incorrect and superseded**. The **LLV Master Document Standard v9 §10** and **Source-of-Truth Architecture v3 §10** mandate that house documents remain **`.docx`** and are never converted to native Google Docs (`.docx` round-trips with full serif/gold house-format fidelity; a Google Doc round-trip loses that formatting). The repo defers to that Drive-vault standard.

### PDF production mechanism

ADR-0004 stated that Phase 2 would call `files.export` directly on native Docs. Because the sources are `.docx` (not native Docs), `files.export` cannot be used directly. The implemented approach:

- **`.docx` (house docs):** `files.copy` to `"98 Document Conversion"` folder as a Google Doc → `files.export` PDF → `files.delete` temp copy (in `finally`). Fidelity validated 2026-06-20 on Vision & Strategy and Master Document Standard: typography, serif headings, gold running header, footer, and pagination all preserved.
- **`.pdf` (external filings — 10-K, Press Releases):** `files.get` with `alt=media` → direct download. No conversion; `strip_first_page` is `false` for these.
- **`.pptx` (deck):** same copy→export→delete dance via Google Slides.
- **Native Google Doc** (should not occur per MDS): `files.export` directly with a logged warning that the source violates the `.docx` standard.

### Control-page strip

`strip_first_page` is now stored per document (migration 050, `boolean not null default true`). House `.docx` docs default to `true`; external PDFs and the deck should be set to `false` in the admin UI.

### Table border fidelity

Google's `.docx`→Doc conversion drops table borders defined via `w:tblStyle`, but preserves *direct* borders (`w:tblBorders`, `w:tcBorders`). House docs with tables lose their gold grid until the docx template is updated to emit direct borders (gold `#C9A86A`, ~1.5pt). This is a separate follow-up (Part E of the Phase 2 code-prompt). Prose-only docs are unaffected.

### Google auth — OAuth as founder (not service account)

The initial Phase 2 implementation used a **service-account JWT** (`GOOGLE_SERVICE_ACCOUNT_KEY`). This was replaced immediately after first deploy because a service account on a personal Gmail organisation has **no Drive storage quota** — `files.copy` (creating the temp Google Doc) fails with `storageQuotaExceeded`.

The fix (2026-06-20, `fix/drive-oauth`): authenticate as the **founder's Google account** via OAuth 2.0 with a long-lived refresh token (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`). `googleapis` auto-refreshes the access token; no manual token handling in app code. The refresh token is minted once via `scripts/mint-drive-token.mjs` (loopback flow). `GOOGLE_SERVICE_ACCOUNT_KEY` is deprecated.

### Runtime

Phase 2 is implemented as an **Inngest function** (`sync-documents`), not a Supabase Edge Function + pg\_cron. Inngest crons fire correctly in prod; the original motivation for an Edge Function (Vercel deployment-protection gating) only affected function registration, not execution.
