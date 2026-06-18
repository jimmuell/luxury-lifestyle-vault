# Fix — Markdown file import in the document editor

**For:** Claude Code · **Branch:** `feat/doc-management`
**Context:** Phase 2's upload control only accepts a finished `.pdf` (the `upload`-kind escape hatch). For a `markdown`-kind doc there's no way to load a `.md` file — only type/paste. Add file import.

## Add to `DocumentEditor` (markdown-kind, Edit tab)
- An **"Import Markdown"** affordance: a file picker (`accept=".md,.markdown,.txt"`) **and** a drag-and-drop zone over the editor.
- On file select/drop: read the file as text client-side (`FileReader` / `file.text()`) and set it as the editor body value.
- **Guard:** if the body textarea is already non-empty, confirm before replacing (`useConfirm()`), so an import can't silently clobber edits.
- Client-side only — the markdown body is just text in `body_markdown`; nothing is uploaded to storage. (Save/version snapshot happens through the normal Save action afterward.)
- Show the imported filename as a small confirmation, and re-render the Preview tab from the new content.

## Leave unchanged
- The **PDF upload** escape hatch for `upload`-kind docs (`uploadDocumentPdf`) stays exactly as is — that path is for finished PDFs, not markdown.

## Optional polish
- Accept a paste of a large markdown blob as today (already works).
- If a user drops a `.pdf` onto a markdown doc, show a hint: "PDFs are for upload-type documents — switch source to Upload" rather than failing silently.

`npm run verify` clean; report back. This is a small Phase 2 follow-up; it doesn't affect Phase 3.
