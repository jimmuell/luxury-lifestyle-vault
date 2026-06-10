# Code Prompt — Back navigation for /terms and /privacy (+ open from onboarding in new tab)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Relates to:** `06` legal pages. Small UX follow-up.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

The public `/terms` and `/privacy` pages have no way back. A user who clicks the **Terms of Service / Privacy Policy** links in the onboarding SMS-consent disclosure leaves the onboarding flow with no return path — and even a back action would **remount onboarding and lose their entered form data** (name, phone, consent).

## Goal

Two complementary fixes:

**1. (Primary) Open the legal links from onboarding in a NEW TAB.** In `src/components/client/onboarding-flow.tsx`, the SMS-consent disclosure's "Terms of Service" and "Privacy Policy" links should open in a new tab so onboarding state is preserved:
```tsx
<a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
<a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
```
(Match the existing link styling; just add `target`/`rel`.)

**2. Add a "← Back" control to the legal pages.** For visitors who arrive from the footer or a direct link, add a back affordance at the top of both `/terms` and `/privacy`. Best placed once in the **`(legal)` layout** so both pages get it.
- Since the pages are server components, add a small **client component** (e.g. `LegalBackButton`) that calls `useRouter().back()`, with a **fallback to `/`** when there's no in-app history (e.g. the user opened the page directly or in a fresh tab — check `window.history.length` or use a sensible default).
- Style per the design system: Lucide `ArrowLeft` icon (no emoji), `buttonVariants({ variant: 'ghost' | 'outline' })` styling, "Back" label. Place it above the page title.

## Acceptance criteria
- From onboarding, clicking **Terms of Service** or **Privacy Policy** opens the page in a **new tab**; returning to the onboarding tab preserves the name/phone/consent the user had entered.
- `/terms` and `/privacy` show a **"← Back"** control that returns to the previous page, or to `/` if opened directly/in a new tab (so it never dead-ends).
- Logged-out access to both pages still works (don't regress the `06` proxy exemption).
- `npm run verify` (ESLint + tsc) is clean.

## Conventions (from CLAUDE.md)
- Shadcn on Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); Obsidian & Ivory.

## Report back
Files changed, confirmation that onboarding links open in a new tab (state preserved) and the back control works from both a normal visit and a fresh/direct visit, and the `npm run verify` result.
