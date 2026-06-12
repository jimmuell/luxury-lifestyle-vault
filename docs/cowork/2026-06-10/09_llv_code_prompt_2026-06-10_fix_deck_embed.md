# Code Prompt 9 — Fix the Deck page inline embed (shows login / errors)

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Bug found in browser QA. Regression from Prompt 6's change to the `/api/investor/documents/[id]` route.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem (observed in the browser)

On `/investor/deck`, the embedded viewer shows the **login page** and "Open in new tab" lands on an **error page**.

Root cause: `src/app/(investor)/investor/deck/page.tsx` points both its `<iframe>` and the "Open in new tab" link at `/api/investor/documents/{id}` (no `?download=1`). Since Prompt 6, that route **302-redirects to the viewer page** `/investor/documents/{id}/view`. Two problems result:
- The redirect resolves to a different host in local dev (`localhost` vs the `127.0.0.1` the session cookie is on), so the iframe loses auth → bounces to `/auth/login`, and the new tab hits unresolvable `localhost` → error.
- Even when same-host, the iframe now embeds a **full app page** (with the sidebar) instead of the PDF — a regression.

The document viewer page (`/investor/documents/[id]/view`) renders the deck PDF correctly (confirmed: 15-slide "LLV Investor Overview"), because it embeds the **signed Supabase URL directly**. The deck page should do the same.

## Goal

Rework `src/app/(investor)/investor/deck/page.tsx` to embed the signed PDF URL directly and stop routing inline viewing through `/api`:

1. Extend the deck query to also select `storage_path`:
   ```ts
   .select('id, title, file_type, file_size_bytes, storage_path')
   ```
2. Mint the signed URL server-side (the page is a server component):
   ```ts
   import { getInvestorDocSignedUrl } from '@/lib/storage/investor-docs'
   const signedUrl = await getInvestorDocSignedUrl(deckDoc.storage_path)
   ```
3. **Inline iframe:** `src={signedUrl}` (renders the PDF directly — no app route, no redirect, works regardless of host or browser PDF settings inside the frame).
4. **"Open in new tab":** point at the relative viewer route `/investor/documents/${deckDoc.id}/view` (proven to work), `target="_blank" rel="noopener noreferrer"`. (Do NOT use an absolute URL or the `/api` route here.)
5. **Download:** keep `/api/investor/documents/${deckDoc.id}?download=1` (that path redirects to a Supabase signed URL and works).
6. **Audit:** log one `view` row for the deck on page render (investors only, not admin), mirroring the viewer page's logging, so deck views are tracked. Use the admin client server-side.
7. Keep the existing empty-state (no deck doc) and the "Having trouble viewing? Use Open in new tab" helper.

> Keep all in-app links **relative**; never build them from `NEXT_PUBLIC_APP_URL` (which is `localhost` in dev and causes the host split).

## Acceptance criteria

- `/investor/deck` shows the **pitch deck PDF inline** (not the login page, not the sidebar-in-iframe).
- "Open in new tab" opens the working viewer (`/investor/documents/{deckId}/view`) on the same host; "Download" saves `pitch-deck.pdf` (or the slugified title).
- A `view` row is logged once when the deck renders for an investor.
- Works whether the app is opened via `127.0.0.1` or `localhost`.
- `npm run verify` clean.

## Conventions (from CLAUDE.md)
- Shadcn Base UI (`buttonVariants`); Lucide icons only (no emoji); Obsidian & Ivory; service-role storage client server-only; in-app links relative.

## Report back
Files changed, confirmation the deck renders inline + Open-in-new-tab/Download work + one view logged, and the `npm run verify` result.

---

## Separate (founder, optional but recommended) — end the 127.0.0.1 / localhost split

The underlying nuisance is that you browse `127.0.0.1` (because `localhost` doesn't resolve on this Mac) while `NEXT_PUBLIC_APP_URL` and some server redirects use `localhost`. Pick ONE to make the local env consistent:
- **Make `localhost` work** (preferred): set the dev script to `next dev -H ::` (binds IPv6 + IPv4) so `localhost` resolves, then use `http://localhost:3000` everywhere (matches `NEXT_PUBLIC_APP_URL`). **or**
- Set `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000` in `.env` and keep using `127.0.0.1`.

This prevents other localhost-vs-127.0.0.1 issues (auth email redirects, magic links, absolute URLs). Not required for the deck fix above, but recommended.
