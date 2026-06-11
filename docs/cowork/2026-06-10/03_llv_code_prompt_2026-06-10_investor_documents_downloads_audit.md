# Code Prompt 3 — Documents library, downloads, view audit

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set. **Depends on Prompts 1 & 2.**

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

Investors need to browse the document library (grouped by section), open/download each document, and have those opens/downloads recorded for the founder's view-audit. Files live in the private `investor-room` bucket (Prompt 1); investors must never get raw bucket access — downloads are served via short-lived signed URLs minted server-side with the service-role client, exactly like `src/lib/storage/server.ts` does for photos.

## Goal

### 1. Investor-docs storage helper

Create `src/lib/storage/investor-docs.ts` (server-only; mirror `server.ts`'s use of the admin/service-role client). Export:

```ts
// uses createAdminClient(); never import from a Client Component
export async function getInvestorDocSignedUrl(storagePath: string, expiresIn = SIGNED_URL_TTL): Promise<string>
```
Sign against `INVESTOR_BUCKET` (added in Prompt 1). Reuse `SIGNED_URL_TTL` from `constants.ts`.

### 2. Query helper

In `src/lib/queries/` add `investor.ts`:

```ts
export async function getInvestorDocuments(): Promise<InvestorDocument[]>
// select published docs ordered by (section, sort_order, title); RLS already
// restricts to investors. Group in the page, not here.
```

### 3. `/investor/documents` page

`src/app/(investor)/investor/documents/page.tsx` (server component). Re-verify session/role per the layout pattern. Fetch docs, group by `section`, and render section blocks in a fixed, meaningful order:

```
concept → strategy → market → financials → product → operations → launch → legal
```
Use a `SECTION_LABELS` map (e.g. `concept: 'The Concept'`, `market: 'Market & Competitive'`, `legal: 'Legal & Risk'`, …) and skip sections with no docs. Each document renders as a card (border, `bg-card`, rounded — match the report panels in `src/app/(admin)/admin/reports/page.tsx`): title (`font-serif`), description (`text-muted-foreground`), file type + size, and an action row with **View** and **Download** buttons (Lucide `Eye` / `Download`, no emoji). Add a page-level **Print** affordance (Lucide `Printer`) that triggers `window.print()` via a tiny client component, plus a `@media print` cleanup (hide the sidebar/nav) — follow any existing print styles; otherwise add minimal print CSS in `globals.css`.

### 4. Signed-URL + audit endpoint

Investors should never receive a permanent file URL, and every open/download must be logged. Implement a route handler:

`src/app/(investor)/investor/documents/[id]/route.ts` (GET) — or `src/app/api/investor/documents/[id]/route.ts` if you prefer the API tree (match the project's convention for `src/app/api/admin/reports`):

1. Re-verify session; confirm `role === 'investor'` (admins may also fetch for preview, but **do not** log admin previews as investor views).
2. Look up the `investor_documents` row by `id` (RLS enforces published + investor visibility).
3. Insert an `investor_document_views` row `{ profile_id: user.id, document_id: id, view_type }` where `view_type` is `'download'` when `?download=1`, else `'view'`.
4. Mint a signed URL via `getInvestorDocSignedUrl(doc.storage_path)` and `redirect()` (302) to it (for download, you may append the storage `download` option / `Content-Disposition` so the browser saves rather than previews).

The **View** button links to `…/[id]` (opens in a new tab: `target="_blank" rel="noopener noreferrer"`); **Download** links to `…/[id]?download=1`. Because the signed URL is generated per request and short-lived, logging is guaranteed on every access.

## Acceptance criteria

- `/investor/documents` lists published documents grouped by section in the order above; empty sections are omitted.
- **View** opens the file (new tab) via a fresh signed URL; **Download** saves the file; both insert an `investor_document_views` row with the correct `view_type` and `profile_id`.
- A direct request to `…/documents/[id]` by a non-investor/non-owner is denied (RLS + role check); signed URLs expire per `SIGNED_URL_TTL`.
- Print produces a clean, sidebar-free document list.
- `npm run verify` is clean.

## Conventions (from CLAUDE.md)
- Shadcn on Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); Obsidian & Ivory; service-role storage client is server-only; Server Actions/handlers re-verify session and derive ids from `user.id`.

## Report back
Files added/changed, the chosen route location for the signed-URL endpoint, confirmation that views and downloads are logged distinctly and that non-investors are denied, and the `npm run verify` result.
