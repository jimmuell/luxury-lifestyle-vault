# Code Prompt — Provider portal: add a persistent top-nav bar (with working Sign out)

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Context:** The provider portal has **no persistent navigation and no Sign out** anywhere. Its layout (`src/app/(provider)/layout.tsx`) renders only a tiny top-right "Reference guide" link plus the page content; individual pages rely on a browser-history "Back" link. Founder feedback after testing as a provider: landing on `/provider/help` left him stuck with no way to reach his order queue or to sign out. Fix it by adding a slim, persistent top-nav bar shown on every provider page.

The provider portal has only three destinations — the order queue (`/provider`), an order detail (`/provider/orders/[id]`), and the reference guide (`/provider/help`) — so a horizontal top bar fits better than a full sidebar.

## What to build

Replace the current lone top-right "Reference guide" link in `src/app/(provider)/layout.tsx` with a persistent header bar containing:

1. **LLV wordmark** on the left — `LUXURY LIFESTYLE VAULT` in the brand caption style (uppercase, letter-spaced, muted), wrapped in a `<Link href="/provider">` so clicking it returns to the order queue.
2. **Nav links:** `Orders` (→ `/provider`) and `Reference guide` (→ `/provider/help`), with the current page's link highlighted (active state).
3. **Sign out** on the right — a submit button wired to the existing `signOut` server action (`@/actions/auth`). **`signOut` already calls `redirect('/auth/login')`, so signing out must land the provider on the auth/login page** — verify this end-to-end.

Keep the existing `AuthWatcher` in the layout.

## Implementation notes

- The layout is a server component (it does the Supabase auth + role guard) — keep it that way. For the active-link highlighting, add a small **client** component `src/components/provider/provider-nav.tsx` (`'use client'`, uses `usePathname`) that renders the two nav links and marks the active one. Active rules: `Orders` active when `pathname === '/provider'` or `pathname.startsWith('/provider/orders')`; `Reference guide` active when `pathname.startsWith('/provider/help')`.
- Render Sign out as a `<form action={signOut}>` with a submit button in the server layout (same pattern the admin layout already uses: `import { signOut } from '@/actions/auth'`, `<form action={signOut}><Button variant="ghost" size="sm" type="submit">…Sign out</Button></form>`). Use the `LogOut` Lucide icon.
- Structure: a full-width `<header className="border-b border-border">` with an inner `max-w-screen-xl mx-auto px-6 md:px-12` flex row (`items-center justify-between`, comfortable vertical padding), then the existing content container (`max-w-screen-xl mx-auto px-6 md:px-12 py-8`) below it for `{children}`.
- Styling: use existing design-system tokens — `text-muted-foreground` with `hover:text-foreground transition-colors` for inactive links, `text-foreground` (and/or a subtle font-weight/underline) for the active link. Wordmark in the small uppercase caption style used elsewhere (e.g. `text-[10px] tracking-[0.3em] uppercase` like the admin "LLV Admin" mark, or the login page's `LUXURY LIFESTYLE VAULT` treatment — match the brand). Lucide icons only, no emoji.
- Mobile: the bar should remain usable on small screens (links can stay inline given there are only two; let it wrap or shrink gracefully — no hamburger needed for two links + sign out).

## Reconcile existing pages

- Remove the now-redundant top-right "Reference guide" link currently in the layout (the new bar replaces it).
- Check `src/app/(provider)/provider/page.tsx`, `src/app/(provider)/provider/orders/[id]/page.tsx`, and `src/app/(provider)/provider/help/page.tsx` for any **duplicate** Sign out or "Back"/"Reference guide" affordances that become redundant with the persistent bar. The order-detail "Back to queue"-style link may stay if useful, but remove anything that now duplicates the top bar. Don't leave two Sign out controls.

## Acceptance criteria

- Every provider page (`/provider`, `/provider/orders/[id]`, `/provider/help`) shows the persistent top bar with the LLV wordmark, `Orders`, `Reference guide`, and `Sign out`.
- Wordmark and `Orders` navigate to the order queue; `Reference guide` navigates to the help page; the active link is visually distinct.
- Clicking **Sign out** ends the session and lands on `/auth/login` (verify the redirect actually happens).
- No page is a dead end anymore — from `/provider/help` you can reach the queue and sign out without the browser Back button.
- Light and dark mode both correct; `npm run verify` (ESLint + tsc) clean.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do NOT run `npm run dev` / `next dev` or `pkill`/`kill` Next. Verify with `npm run verify`; the founder will exercise the running app.
- Run under **Node 20.19.5** (`.nvmrc`). Never hand-edit `node_modules`. Lucide icons only.

## Report back

- Files changed, `npm run verify` result, and a one-line confirmation that the bar appears on all three provider pages and Sign out lands on `/auth/login`.
