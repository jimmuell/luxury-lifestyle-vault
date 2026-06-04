# Code Prompt — 3-state theme toggle (Light / Dark / System) + visibility fix

**Date:** 2026-05-31
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**Polish todo:** `docs/cowork/llv_engineering_polish_todos.md` → "Theme toggle: 3-state + visibility fix"
**Bug Fix Cycle:** add entry after shipping (template at end).

## Context

`src/components/shared/theme-toggle.tsx` is a 2-state Sun/Moon button (`light ↔ dark` only) even though the `ThemeProvider` in `src/app/layout.tsx` is configured `defaultTheme="system"` + `enableSystem` — so the System option is plumbed but not exposed. Two problems:

1. No way to return to "follow OS" once toggled.
2. The toggle lives bottom-left in both the client nav (`src/components/client/client-nav.tsx:80`) and the admin layout sidebar (`src/app/(admin)/layout.tsx:64`), directly under where Next.js renders its dev-mode floating indicator. The dev "N" badge visually covers the toggle in local dev — Jim couldn't find it during May 30 testing.

## Goal

Expose a 3-option control (Light / Dark / System) that's clearly visible in both layouts and both themes.

## Implementation

`src/components/shared/theme-toggle.tsx`:
- Replace the 2-state button with a 3-option control. A small **segmented group** of three icon buttons (`Sun` = light, `Moon` = dark, `Monitor` = system) reads cleanest and shows the active state at a glance; a dropdown is acceptable if you prefer. Use Lucide `Sun`, `Moon`, `Monitor` (per `CLAUDE.md` — Lucide only, no emoji).
- Use `next-themes` `useTheme()`: `setTheme('light' | 'dark' | 'system')`. Highlight the active option by comparing against `theme` (the stored choice, which can be `'system'`), not `resolvedTheme`.
- Guard against hydration mismatch: `next-themes` needs a mounted check (`useState`+`useEffect`) before rendering theme-dependent UI, or render a stable placeholder until mounted.
- Increase visibility: the current ghost `h-4 w-4` is too subtle, especially the dark-mode moon on a dark background. Use clearer affordance — a bordered segmented control with an accent (gold `--accent`) active state — and size icons `h-4 w-4` inside ≥`h-8` hit targets.

Placement (both call sites): move the control out of the dev-badge collision. Options, pick one:
- Relocate from bottom-left to the top of the sidebar/nav header, OR
- Give it `right`-side positioning room, OR
- Put it behind a small "Preferences" affordance.
Whichever you choose, verify in **local dev** (where the Next.js dev badge renders) that the toggle is fully visible and clickable in both client and admin shells.

Keep `aria-label`s on each option for accessibility.

## Verification

1. `npm run verify` clean.
2. Client portal + admin: the control is visible (not under the dev badge) in light and dark.
3. Clicking Light/Dark/System each works; System follows the OS appearance (flip OS dark mode and confirm it tracks). Active option is visually indicated and persists across reloads.

## Bug Fix Cycle entry

> | NN | 2026-05-31 | Low | UI / Theming | Replaced the 2-state theme toggle with a 3-option Light/Dark/System segmented control (Lucide Sun/Moon/Monitor), exposing the already-plumbed `system` mode; added mounted-guard against hydration mismatch; relocated the control out from under the Next.js dev-badge collision in both the client nav and admin sidebar, with a clearer accent active state. | ✅ FIXED |
