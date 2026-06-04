# Code Prompt — HelpTip: open on hover (keep click + focus)

**Date:** 2026-06-03
**Author:** Cowork
**For:** Claude Code
**Context:** The help system is verified working — clicking the `?` (HelpCircle) opens the tooltip popover with title, body, and the "Talk to your concierge" / "Learn more" actions. Founder feedback: it should also open on **hover**, not click-only.

---

## Change

Make `HelpTipPopover` (`src/components/help/help-tip-popover.tsx`) open on **hover** of the `?` trigger, **in addition to** the existing click and keyboard-focus behavior. Do **not** make it hover-only.

- Use Base UI Popover's hover support (e.g. `openOnHover` with `delay` / `closeDelay`), or equivalent, so:
  - Hovering the `?` icon opens the popover after a short delay (~100–150ms).
  - There's a close **grace delay** so the user can move the cursor from the trigger **into** the popover to click "Talk to your concierge" or "Learn more" without it closing.
  - The popover stays open while hovering **either** the trigger or the popover content.
- **Keep** the existing ways to open it:
  - **Click/tap** still toggles it (required for touch devices — they have no hover).
  - **Keyboard focus** + Enter/Space still opens it (accessibility).
- Closes on: mouse-leave (after the grace delay), Escape, or outside click.
- Accessibility: the trigger stays a focusable `<button>` with an accessible label (e.g. `aria-label="Help"`). Hover is an enhancement, not the only path in.

Apply this in the shared `HelpTipPopover` so every placement (on-demand, returns, and any future area) gets the behavior automatically.

## Acceptance criteria

- Hovering the `?` opens the tip after a brief delay; moving the cursor into the popover keeps it open and lets you click "Talk to your concierge" and "Learn more".
- Clicking/tapping still opens/closes it; keyboard focus + Enter/Space still opens it; Escape closes it.
- Works on a touch device (tap opens — no hover required).
- No layout shift or flicker on rapid hover in/out.
- `npm run verify` (ESLint + tsc) clean.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do **NOT** run `npm run dev` / `next dev` or `pkill`/`kill` Next processes. Verify with `npm run verify`; the founder will exercise the running app.
- Run under **Node 20.19.5** (`.nvmrc`). **Never hand-edit `node_modules`.**

## Report back

- File(s) changed, the `npm run verify` result, and a one-line note on how hover + click + keyboard each behave so the founder can re-test.
