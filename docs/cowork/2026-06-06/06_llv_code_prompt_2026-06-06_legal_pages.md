# Code Prompt — Public /terms and /privacy pages

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Relates to:** A2P 10DLC (carriers require publicly reachable Terms + Privacy URLs) and launch.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Goal

Publish **publicly accessible** Terms of Service and Privacy Policy at `/terms` and `/privacy`. They must be reachable **without authentication** (carriers and the public must load them), styled to the Obsidian & Ivory brand, and linked from the footer and the SMS consent disclosure.

## Source content
Use the exact approved copy from this delivery:
- `docs/legal/llv_terms_of_service_2026-06-06.md`
- `docs/legal/llv_privacy_policy_2026-06-06.md`

These are **drafts with `[PLACEHOLDERS]` and an attorney-review banner**. Render whatever is approved at build time. Do not invent legal text. If the founder hasn't finalized placeholders yet, render the copy as-is (placeholders visible) behind the existing approach — but flag in your report that the live pages still contain placeholders and an attorney note, so they aren't launched publicly until finalized.

## Scope

**1. Routes** — add to the public/marketing route group (mirroring how `/auth/*` public pages are structured):
- `src/app/.../terms/page.tsx`
- `src/app/.../privacy/page.tsx`
Both are server components, statically rendered.

**2. Public access** — update `src/proxy.ts` to allow `/terms` and `/privacy` as public routes (the proxy currently redirects unauthenticated users to `/auth/login`; these two paths must be exempt, like `/auth/*` and `/api/webhooks/*`).

**3. Rendering** — render the markdown content cleanly. Either:
- convert the markdown to styled HTML at build (a lightweight, already-available markdown renderer, or hand-author the JSX from the source), or
- store the text as structured content.
Use the project's typography (Cormorant Garamond headings, Inter body) and a readable max-width container. **Do not pull in a heavy new dependency** if a simple approach works; if you add one, justify it briefly.

**4. Metadata & SEO** — set `<title>` and meta description for each; ensure they're indexable (no `noindex`).

**5. Footer + cross-links** — add "Terms" and "Privacy" links to the site footer (and the auth/login footer if present). Ensure the SMS consent disclosure's `/terms` and `/privacy` links (from the SMS consent prompt) resolve.

**6. Last-updated** — display the effective date from the source docs at the top of each page.

## Acceptance criteria
- `/terms` and `/privacy` load for a **logged-out** visitor (verify the proxy exemption — this is the key A2P requirement).
- Pages render the approved copy with brand typography and are responsive.
- Footer links to both pages work from public and authenticated areas.
- `npm run verify` is clean.

## Conventions (from CLAUDE.md)
- Shadcn on Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); Obsidian & Ivory design system.
- Public routes declared in `src/proxy.ts` alongside the existing allowlist.

## Report back
Files changed, confirmation that both pages load while logged out (and the exact proxy change), `npm run verify` result, and a reminder of whether any `[PLACEHOLDERS]` are still visible on the live pages.
