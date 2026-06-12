# Code Prompt 8 — Personalize the investor room with the investor's name

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set. Small UX enhancement. Depends on Prompts 0–2.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Goal

Make the data room feel personally prepared for each investor by surfacing their name in two places, sourced from `profiles.full_name`.

### 1. Personalized greeting on the Overview

In `src/app/(investor)/investor/page.tsx`, fetch the signed-in investor's `full_name` (the page/layout already loads the profile — extend the select to include `full_name` if needed) and show a warm greeting above or as part of the headline. Greet by **first name** for warmth:

- Derive `firstName = full_name?.trim().split(/\s+/)[0]`.
- Render a serif greeting, e.g. **"Welcome, {firstName}."** (or "Welcome to the Vault, {firstName}.").
- **Fallbacks:** if `full_name` is empty, fall back to the part of the email before `@`; if that's unavailable, just "Welcome." Never render "Welcome, undefined" or a blank name.
- Keep the existing brand line ("Your Lifestyle, Wherever Life Takes You.") and the jump-in cards; the greeting sits at the top as the personal touch. Match the page's existing serif/Obsidian-&-Ivory styling.

### 2. Identity chip in the sidebar

In `src/app/(investor)/layout.tsx` (and/or `src/components/investor/investor-nav.tsx`), show the signed-in investor's identity near the bottom of the sidebar, just above or beside the theme toggle / sign-out:

- Display `full_name` (fallback to email) on one line, and the email in smaller muted text on a second line (skip the second line if name and email are the same).
- Subtle, on-brand: small text, `text-muted-foreground` for the email, no avatar needed (optional: a small Lucide `User`/`UserCircle` icon, no emoji).
- The layout already calls `getUser()` + a `profiles` select — extend that select to include `full_name` and pass it down.

## Acceptance criteria

- An investor sees **"Welcome, {their first name}."** on `/investor`, and their name + email in the sidebar.
- Graceful fallbacks when `full_name` is missing (email local-part, then a generic greeting) — never "undefined" or blank.
- Demo investor (`full_name = 'Demo Investor'`) shows "Welcome, Demo." and "Demo Investor / demo.investor@llv.dev" in the sidebar.
- No layout shift/overflow in the sidebar; styling consistent with the rest of the room.
- `npm run verify` clean.

## Conventions (from CLAUDE.md)
- Shadcn Base UI; Lucide icons only (no emoji); Obsidian & Ivory; `font-serif` for the greeting; server components re-verify session and derive identity from `user.id` (never from client input).

## Report back
Files changed, confirmation the greeting + sidebar identity render with correct fallbacks, and the `npm run verify` result.
