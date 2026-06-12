# Code Prompt 6 — Investor doc inline viewer + button loading states

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set. Follow-up fix to Prompt 3 (documents library). Depends on Prompts 0–3.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

On `/investor/documents`:

1. **"View" downloads the PDF instead of displaying it.** The View link 302-redirects the new tab straight to the raw signed PDF URL, so whether it renders inline or downloads depends on each browser's "download PDFs instead of opening them" setting — unreliable. We want View to *always display* the document.
2. **No loading feedback.** Both View and Download trigger a ~2s server round-trip (auth + audit insert + signed-URL mint) with no spinner, so the buttons feel unresponsive/broken.

(Note: the stored objects are already `application/pdf` with the seed using `upsert: true`, so this is not a content-type bug — it's the direct-PDF-navigation approach plus missing UI feedback.)

## Goal

### 1. In-app PDF viewer route (reliable inline display)

Create `src/app/(investor)/investor/documents/[id]/view/page.tsx` — a server component (gated by the existing `(investor)` layout). It should:

- Re-verify session; confirm `role === 'investor' || role === 'admin'` (mirror the API route).
- Fetch the document by `id` from `investor_documents` (RLS enforces published + investor visibility); graceful not-found if missing.
- **Log the view** (investors only, not admin previews): insert `{ profile_id, document_id, view_type: 'view' }` into `investor_document_views` via the admin client. (This MOVES view logging here — see step 3.)
- Mint a signed URL with `getInvestorDocSignedUrl(doc.storage_path)`.
- Render a full-height viewer: a slim header bar with the document **title**, a **Download** button (`buttonVariants`, links to `/api/investor/documents/${id}?download=1`), and a **← Back to documents** link (`/investor/documents`); below it an `<iframe src={signedUrl} title={doc.title} className="w-full" style={{height:'calc(100vh - 8rem)'}} />` (or `<object>`). The iframe renders the PDF inline regardless of browser PDF settings.

Then update the Documents page (`src/app/(investor)/investor/documents/page.tsx`): point the **View** action at `/investor/documents/${doc.id}/view` (open in new tab: `target="_blank" rel="noopener noreferrer"`).

### 2. Download forces save with a friendly filename

- In `src/lib/storage/investor-docs.ts`, add an optional param: `getInvestorDocSignedUrl(storagePath, expiresIn?, downloadName?)`. When `downloadName` is provided, pass it to Supabase: `createSignedUrl(storagePath, expiresIn, { download: downloadName })` (forces `Content-Disposition: attachment`).
- In `src/app/api/investor/documents/[id]/route.ts`: this route now serves **download only**. When `download=1`, sign with a slugified name like `${slug(doc.title)}.pdf`. Keep logging `view_type: 'download'`. (Optional: if the route is hit without `download=1`, you may redirect to the new viewer page, but the UI no longer links there for View.)

### 3. Audit logging — log each action once

- View is now logged in the **viewer page** (step 1).
- Download is logged in the **API route** (step 2).
- Remove the `view_type: 'view'` insert path from the API route so a view isn't double-counted. Net: exactly one row per View (from the viewer page) and one per Download (from the route).

### 4. Button loading states

Replace the two `<Link>` buttons in the documents list with a small **client component** `src/components/investor/doc-actions.tsx` (`{ docId, title }`), styled exactly like the current buttons (`buttonVariants({ variant: 'outline', size: 'sm' })`, `gap-1.5`, Lucide icons, no emoji):

- **View:** an `<a target="_blank" rel="noopener noreferrer" href={`/investor/documents/${docId}/view`}>`. On click, set a transient `loading` state that swaps the `Eye` icon for a spinning `Loader2` (`className="h-3.5 w-3.5 animate-spin"`) and disables the control, auto-clearing after ~1.5s or on the window regaining focus (the new tab handles the real load).
- **Download:** a `<button>`. On click → `setLoading(true)` → trigger the download (create a temporary `<a href={`/api/investor/documents/${docId}?download=1`}>`, click it) → clear loading after ~2.5s. Swap `Download` icon for `Loader2 animate-spin` and disable while loading.

Keep both controls visually identical to today when idle.

### 5. (Optional, consistency) Deck page

If quick: have the Deck page's "Open in new tab" use the same iframe-viewer approach (or confirm its existing iframe already displays inline). Don't expand scope otherwise.

## Acceptance criteria

- Clicking **View** opens a **new tab that displays the PDF inline** (in-app viewer with title + Download + Back), regardless of the browser's PDF-handling setting. Exactly one `view` row is logged.
- Clicking **Download** saves the file with a sensible filename (e.g. `executive-one-pager.pdf`). Exactly one `download` row is logged.
- Both buttons show a spinner + disabled state during the action; no frozen/unresponsive feel.
- Non-investor/non-owner access still blocked; signed URLs remain short-lived.
- `npm run verify` clean.

## Conventions (from CLAUDE.md)
- Shadcn on Base UI (no `asChild`; `buttonVariants`); **Lucide icons only — `Loader2` for the spinner, no emoji**; Obsidian & Ivory; server components/handlers re-verify session and derive ids from `user.id`; service-role storage client stays server-only.

## Report back
Files added/changed, confirmation that View now displays inline in a new tab and Download saves (with filename), that both animate, that each action logs exactly one audit row, and the `npm run verify` result.
