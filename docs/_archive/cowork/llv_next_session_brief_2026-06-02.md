# LLV — Next Session Brief

**Prepared:** June 1, 2026 (end of session, Cowork)
**For:** The next Cowork/Claude session. This is the short "start here." Full context lives in `llv_session_handoff.md` (read its top "June 1 Closeout" block) and `DIVISION_OF_LABOR.md` (your role).

---

## Where things stand

The Sections 2–13 QA test run is **complete and all bugs are cleared.** Every issue found — 4 High (#25 save-pricing, #26 concierge queue, #27 provider auth, #34 provider RLS), the AI-search config item (#28), and 5 Low polish bugs (#29–#33, #35) — is **fixed by Claude Code and re-verified by Cowork on the live Vercel deployment.** The platform is in strong shape against the test plan.

Two-tool model still in effect: **Cowork** owns strategy, research, documents, Code prompts, and browser-driven QA. **Claude Code** owns implementation, DevOps, migrations, and git. Cowork does **not** write app code or run `supabase db push`.

---

## What's left (in priority order)

1. **Founder dashboard verifications** — the only QA items remaining; they can't be done from the app UI:
   - **Stripe dashboard:** subscription + customer creation, proration on tier change, refund processing, per-request invoice line items.
   - **Resend** (or dev inbox): email notifications fire correctly.
   - **Inngest dashboard:** per-request billing function + seasonal reminder schedules.
   - *Next session: ask Jim to walk these, or connect the relevant connector and verify together.*

2. **Provider outreach — the soft-launch blocker.** The reusable kits are ready:
   - WI: `docs/cowork/llv_wisconsin_provider_outreach_kit.md` (targets: Martinizing lead, Klinke, The London Cleaners)
   - AZ: `docs/cowork/llv_arizona_provider_outreach_kit.md` (targets: RAVE FabriCARE top, European Couture, Mastel)
   - To do: fill the `[brackets]`, decide whether intros come from Jim or the daughter (AZ Corridor Manager), then send. **Cowork drafts but does not send** — connect an email connector for approve-each-send drafts, or Jim sends from his own inbox.

3. **Business strategy** — remaining items in `docs/strategy/llv_business_strategy_assumptions_register.docx`.

4. **Founding-member recruitment** — platform is ready to support it; this is the natural next growth workstream.

---

## Quick-reference: deployment + test accounts

- **App:** `luxury-lifestyle-vault.vercel.app` (Vercel + hosted Supabase + Stripe sandbox/test mode).
- **Login:** `/auth/login` has DEV quick-login + "Demo client" / "Demo admin" shortcuts. **To switch accounts you must click "Sign out" first** — clicking a demo shortcut while already signed in does not switch the session.
- **Key docs:** `llv_session_handoff.md` (full state + Bug Fix Cycle table in Section 13) · `docs/testing/llv_test_run_results_2026-06-01.md` (QA run + closeout) · `docs/testing/llv_platform_test_plan.docx` · `docs/strategy/llv_launch_readiness.md`.

---

## First steps for the next session
1. Read `DIVISION_OF_LABOR.md` (your role) and the **June 1 Closeout** block atop `llv_session_handoff.md`.
2. Ask Jim what he wants to focus on — likely the founder dashboard verifications or kicking off provider outreach.
3. Pick up from the priority list above.
