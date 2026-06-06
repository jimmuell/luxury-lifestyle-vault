# Code Prompt — Help System: Finalize & Verify (step-by-step, with owners)

**Date:** 2026-06-03
**Author:** Cowork
**For:** Claude Code (Part A) + Founder/Jim (Part B)
**Context:** Help-system implementation is complete and committed to `main`. Code asked whether to push. **Decision: do NOT push yet (Code's option 3).** Below is the exact sequence and who owns each step.

> **Why not push yet:** pushing `main` triggers a Vercel deploy, and the new migration `028_help_system.sql` (`help_tooltips` / `help_articles`) must be applied and the feature verified first — otherwise the deployed app queries tables that don't exist. Push happens later, in Part C.

---

## Sequence at a glance

- **Part A — Claude Code, now:** steps 1–5.
- **Part B — Founder (Jim), after Code reports:** steps 6–11.
- **Part C — Push:** step 12, later, only after Jim confirms verified.

---

## Part A — Claude Code does these now, in order

**1. [CODE] Report what's on `main`.** List the commits you made for the help system, and state clearly whether those commits **also include** the earlier middleware→proxy refactor and the `docs/_archive/` reorganization. Flag anything unrelated that got swept in. (So we know exactly what a push would publish.)

**2. [CODE] Apply the migration** to the linked Supabase (additive only — two new tables): run `npx supabase db push`. Confirm `028` applied and that `src/types/database.ts` was regenerated with both tables (each including `Relationships: []`).

**3. [CODE] Run `npm run verify`** and paste the full result. It must be clean (no ESLint/TS errors).

**4. [CODE] Document how to load the help seed.** Give the founder the exact steps to load the 2 tooltips + 2 articles — name the screen/button (e.g. the admin Seed Data Manager) or the command. Confirm it's idempotent (safe to run more than once).

**5. [CODE] STOP — do not push, do not run the dev server.** Post a short report using this template, then wait for the founder:
- Commits on `main` (and whether proxy refactor / doc-archive moves are included)
- Migration 028 applied? (yes/no)
- Exact steps to load the help seed
- `npm run verify` result

---

## Part B — Founder (Jim) does these after Code's report, step by step

**6. [YOU] Check Node version.** In your terminal: `node -v` → must be **20.19.5**. If not, run `nvm use`.

**7. [YOU] Start your dev server.** Make sure no other `next dev` is running, then run `npm run dev`. Wait for `✓ Ready`, then open **http://localhost:3000**.

**8. [YOU] Load the help seed** using the exact method Code gave you in step 4 (log in as admin first if it's via the Seed Data Manager).

**9. [YOU] Walk the manual checks** — tick each one:
- [ ] A help icon (HelpTip) shows on **on-demand** (`/client/orders/new`) and **returns** (`/client/orders`); it shows **nothing** on wardrobe, rotation, and billing (no seed there yet).
- [ ] `/admin/help` → add a tooltip for an unseeded area key (e.g. `client.billing`) → it appears on that page with **no redeploy**.
- [ ] `/client/help` lists the seeded client article, the search box filters, and **"Talk to your concierge"** opens your concierge thread.
- [ ] `/provider/help` shows the provider article, and its escalation does **not** send you to `/client/concierge`.
- [ ] A **"Learn more"** link inside a tooltip jumps to the right article on `/client/help`.
- [ ] (If easy) Logged in as a non-admin, you cannot edit help content and unpublished items don't show.

**10. [YOU] If anything fails:** copy the exact error or wrong behavior and send it to me (Cowork). I'll write the fix prompt for Code.

**11. [YOU] If all checks pass:** tell me **"help system verified."** I'll log Phase 1.5 and prepare the push step.

---

## Part C — Push (later, separate step — do NOT do this yet)

**12.** Only after Jim confirms verified: Cowork will hand Code a push prompt (option 2). Code pushes `main` to origin, which deploys via Vercel — and because the migration is already applied (step 2), the deploy is safe.

---

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Claude Code must **NOT** run `npm run dev` / `next dev` or `pkill`/`kill` Next processes. Code verifies with `npm run verify` only.
- Run under **Node 20.19.5** (`.nvmrc`). **Never hand-edit `node_modules`.**
