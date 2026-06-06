# Code Prompt — Help System: Spec Revisions + Build

**Date:** 2026-06-03
**Author:** Cowork
**For:** Claude Code
**Spec:** `docs/superpowers/specs/2026-06-03-help-system-design.md`
**Status:** Spec approved with three revisions — apply them, then implement.

---

Help-system spec is **approved with three revisions**. Update `docs/superpowers/specs/2026-06-03-help-system-design.md` to reflect these, then proceed to the implementation plan and build.

## 1. Provider escalation channel (required)

`HelpEscalate` currently hardcodes `href="/client/concierge"`, but it's also placed at the bottom of `/provider/help`. Providers can't reach `/client/*` (role routing blocks it) and the client concierge thread is the wrong channel for them.

- Give `HelpEscalate` an `href` (or audience) prop.
- On client pages, keep `/client/concierge`.
- On `/provider/help`, point it at the provider's real contact path — the existing provider→admin messaging channel — or **omit** `HelpEscalate` there if no provider support route exists.
- Do **not** route providers to `/client/concierge`.

## 2. Fix a stale note (minor)

The "returns flow not yet built" parenthetical on the `client.returns` placement is inaccurate — the return flow shipped in Sprint B3 (B2-06). Remove the parenthetical; keep the "Starting a return" tip on `/client/orders`.

## 3. Confirm dynamic reads

Acceptance #2 (a newly added row appears with no redeploy) requires the tooltip/article reads **not** to be statically cached. Confirm the help reads are dynamic — they should already be, since these pages use the cookie-based authenticated Supabase server client — and if any help read sits on a `force-static`/cached path, make it dynamic.

---

Then write the implementation plan and implement per the spec.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do **NOT** run `npm run dev` / `next dev` or `pkill`/`kill` Next processes. Verify your work with `npm run verify` (ESLint + tsc); the founder will exercise the running app for manual UI checks.
- Run under **Node 20.19.5** (`.nvmrc`). **Never hand-edit `node_modules`.**
- Conventions: migrations use `gen_random_uuid()` + DB-layer RLS + admin-only server actions (`requireAdmin`); add both tables to `src/types/database.ts` with `Relationships: []`; Base UI (no `asChild` — use `buttonVariants` on `<Link>`); Lucide icons only (no emoji); `useConfirm()` for destructive actions; `sonner` toasts; Obsidian & Ivory design system.

## Report back when done

- Files changed.
- The `npm run verify` result (must be clean — don't mark complete until it is).
- The manual-check steps for the founder to walk in the running app.
