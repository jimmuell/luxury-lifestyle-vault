# Code Prompt — Branded 404 (not-found) + error pages

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Context:** The app has **no** custom `not-found.tsx` / `error.tsx`, so Next.js falls back to its bare default 404/500 — which render outside the role layouts (no nav, no Sign out, no way back). This is reachable in normal use: ~10 detail pages call `notFound()` for missing records (a stale link to a deleted order, etc.). Add branded, on-brand pages that always give the user a way back.

**Prerequisite (founder did this first):** the founding-member card image is in the repo at **`public/brand/llv-card.png`**. If it's missing, stop and tell the founder — don't substitute another image.

## Design — branded dark scene (both pages)

A deliberately **dark, fixed** branded scene (do NOT theme-switch — the card is a dark photoreal object and the brand's hero treatments are dark). Use the brand palette: **Obsidian background, Ivory text, Gold accent.** Use the existing dark-mode token values / brand hexes — Obsidian `#0A0A0A` (the app's `--background` dark), Ivory `#F8F4EE`, Gold `#C9A96E`. Fonts already loaded: Cormorant Garamond (display) + Inter (body).

Layout (full viewport, centered, `min-h-screen`):
- The **card image** via `next/image` (`src="/brand/llv-card.png"`), centered, max width ~380–420px, `height: auto` (preserve aspect ratio — read the PNG's natural dimensions and pass matching `width`/`height`, or use a fixed-ratio wrapper with `fill` + `sizes`). Add a meaningful `alt` (e.g. "Luxury Lifestyle Vault membership card"). Mark it `priority` is unnecessary; keep default lazy.
- A small **`LUXURY LIFESTYLE VAULT`** wordmark (Cormorant or the uppercase letter-spaced caption style used on the login page).
- A **Cormorant heading** in ivory + short muted-ivory subtext (see per-page copy below).
- A **gold "Return home" button** linking to `/`. Use the existing `buttonVariants` link pattern (this project's Button has no `asChild` — use `buttonVariants` on a `<Link>`). `/` is correct for every role: the proxy routes `/` to the signed-in user's dashboard, or to `/auth/login` if signed out — so one link works for client, provider, admin, and logged-out visitors.

Keep both pages self-contained (they render outside the role layouts). Inline the brand colors via style/Tailwind arbitrary values if the tokens aren't available in that render context; don't rely on a parent layout.

## `src/app/not-found.tsx` (server component)

- Heading: "Page not found" (Cormorant, ivory).
- Subtext: something on-brand, e.g. "The page you're looking for isn't in the vault." (muted ivory).
- Gold "Return home" → `/`.

## `src/app/error.tsx` (client component — `'use client'`)

- Must accept `{ error, reset }: { error: Error & { digest?: string }; reset: () => void }`.
- Heading: "Something went wrong".
- Subtext: brief, reassuring; do NOT print raw error details/stack to the user.
- Two actions: a **gold "Try again"** button calling `reset()`, and a secondary **"Return home"** → `/` (use `window.location.href = '/'` or a Link).
- (Optional) `useEffect(() => { console.error(error) }, [error])` so it still logs to the console/Vercel for debugging.

## Acceptance criteria

- Visiting a non-existent URL (or any page that calls `notFound()`, e.g. `/client/orders/<bad-id>`) shows the branded 404 with the card image and a working "Return home" that lands the user on their correct dashboard (or login if signed out).
- Throwing inside a route renders the branded error page with working "Try again" + "Return home".
- The card image loads (served optimized via `next/image`, not the raw 2.6 MB file).
- Pages look correct as a fixed dark scene regardless of the app's light/dark setting.
- `public/brand/llv-card.png` is committed alongside the new pages.
- `npm run verify` (ESLint + tsc) clean.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder will exercise the running app.
- Node **20.19.5** (`.nvmrc`). Never hand-edit `node_modules`. Lucide icons only (no emoji). Use `buttonVariants` for link-buttons (no `asChild`).

## Report back

- Files changed/added (incl. the committed image), `npm run verify` result, and confirmation that a bad URL shows the branded 404 with a working Return home, and an error renders the branded error page.
