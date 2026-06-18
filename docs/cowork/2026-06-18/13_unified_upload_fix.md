# Fix — one upload/drag-drop that accepts .md OR .pdf (route by file type)

**For:** Claude Code · **Branch:** `feat/doc-management`
**Problem:** the document "Upload" source type only accepts `.pdf`, so a founder who wants to bring in a `.md` file is forced into a PDF picker. The `.md` import added earlier lives only inside the markdown editor and isn't discoverable. Founder expectation: "I have a file — let me drop it in and you sort it out."

## Fix: infer source from the dropped/picked file

Make the document **create form (`/admin/documents/new`)** and the editor accept a single file intake — **a file picker + drag-and-drop zone** with `accept=".md,.markdown,.txt,.pdf"` — that routes by extension:

- **`.md` / `.markdown` / `.txt`** → set `source_kind = 'markdown'`, read the file as text (`file.text()`) into `body_markdown`, show it in the editor, render the Preview. (This is the existing import path — reuse it.)
- **`.pdf`** → set `source_kind = 'upload'` and attach it via the existing `uploadDocumentPdf` flow.

So the user no longer has to pre-pick "Upload" (PDF-only) vs "Markdown" to get a file picker — **the file they drop determines the kind.** Keep an explicit Source toggle if helpful, but it should default sensibly and never block a `.md` drop.

## Details
- Prominent drop zone on the **new-document** form: "Drop a `.md` or `.pdf` here, or type/paste below." Same drag overlay you already built.
- Keep the **confirm-before-replace** guard when importing a `.md` into a non-empty body.
- A `.pdf` dropped where markdown is expected should now **just work** (switch the doc to upload-kind) rather than showing the "switch Source to Upload" hint — the hint is obsolete once routing is automatic.
- Title: if blank on import, default it from the filename (strip extension), editable.

## Leave intact
- `uploadDocumentPdf` behavior for `.pdf` (publishes/attaches the finished PDF), `publishDocument` PDF-generation trigger for markdown docs.

`npm run verify` clean; report back. Small follow-up — independent of Phase 4.
