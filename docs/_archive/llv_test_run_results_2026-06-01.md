# LLV Platform Test Run — Results

**Date:** June 1, 2026
**Run by:** Cowork (browser-driven QA against the live deployment)
**Environment:** Vercel deployment (`luxury-lifestyle-vault.vercel.app`) + hosted Supabase + Stripe sandbox (test mode)
**Scope:** Test plan Sections 2–13 (Section 1 passed May 26). Sections executed in order; orders/data created during the run were reused across later sections.

---

## Headline

The platform's core pipelines are solid. Onboarding → Stripe payment → active subscription, the full 9-status admin order lifecycle, client ordering (rotations + on-demand with live cost preview), real-time notifications, reporting, audit trail, RBAC, and RLS all work end-to-end. Four higher-severity issues need attention before launch (one is a 2-minute config fix), plus a handful of low-severity polish bugs.

**Bug tally:** 4 High (1 is config) · 4 Low · several design deviations + items needing Stripe/Inngest dashboard verification.

---

## ✅ Closeout update (June 1, 2026 — end of session)

**All bugs in this run are now fixed and re-verified on the live deployment.** The section-by-section results below record the *original* run; every FAIL has since been fixed by Claude Code and re-verified by Cowork in a connected Chrome session. Final per-bug status (full detail in `llv_session_handoff.md` Bug Fix Cycle, Section 13):

- **High #25** Save-pricing freeze → ✅ fixed (native `confirm()` → custom dialog) & verified.
- **High #26** Concierge queue empty → ✅ fixed (FK hint) & verified.
- **High #27** Provider portal unreachable → ✅ fixed (seed creates auth user + links profile_id) & verified.
- **High #34** Provider order 404 → ✅ fixed (migration 026, 5 RLS policies) & verified (incl. cross-provider negative check).
- **High/config #28** AI search unavailable → ✅ resolved (`ANTHROPIC_API_KEY` set on Vercel) & verified (two NL queries returned context-correct ranked results).
- **Low #29** corridor defaults · **#30** outfit-delete toast · **#31** date off-by-one · **#32** bell badge · **#35** duplicate-corridor error → all ✅ fixed & verified.

**Remaining (not app bugs):** founder dashboard verifications — Stripe (subscription/proration/refund/invoice lines), Resend (emails), Inngest (per-request billing + seasonal reminders). Test residue cleaned (deactivated the WI↔TX "Defaults Fixed Check" corridor).

---

## Section-by-section results

### Section 2 — Admin Configuration
- **T2.1 Service Tiers — FAIL (High).** List + edit form load with all fields, change log, Stripe grandfathering note. **"Save pricing" never persists the change and the page appears frozen** (3 attempts). **Root cause found post-run:** `tier-edit-form.tsx` gates the price save on a **native `window.confirm()`** ("This will create a new Stripe price… Continue?") which blocks the page; when the dialog was dismissed the handler returned early → no save. NOT a Stripe hang. The no-confirm "Save configuration" saved instantly, which fits. This is a subset of the native-dialog issue (see below). Blocks T2.1 steps 3–9 until fixed.
- **T2.2 Corridors — PASS** (1 Low bug). List, detail, provider assignment (RAVE→AZ, Milwaukee→WI, auto-saved), create + deactivate of a test WI↔FL corridor all worked. Low bug: New Corridor modal's prefilled "WI"/"AZ" code defaults aren't in form state → misleading "All fields are required" unless retyped. (Corridors are deactivate-only, no hard delete — matches plan.)
- **T2.3 Providers — PASS.** 5 providers listed; edit/save (turnaround), deactivate, reactivate, add-new, deactivate-test all worked. UI note: providers are inline cards with Edit, not separate detail pages.

### Section 3 — Onboarding & Subscription
- **T3.1 — PASS.** Full 6-step onboarding (profile → WI primary → AZ seasonal → tier → Stripe payment → review → activate) walked end-to-end as Victoria Simmons; **auto-redirected to dashboard with an active Seasonal Premier subscription.** Confirms the May 30 off_session subscription fix and redirect fix are holding. (Stripe dashboard confirmation of the customer/subscription = founder verify.)
- **T3.2 — PASS.** Un-onboarded Robert Whitmore redirected from `/client/wardrobe`, `/client/orders`, `/client` to `/client/onboarding`.
- Notes: test plan tier labels are stale ("Tier 2 = Total Wardrobe Management $449"); live tiers are **Seasonal Essentials $299 / Seasonal Premier $599**, with On-Demand as an add-on. Review screen shows tier + billing but not a full profile/address/payment summary.

### Section 4 — Digital Wardrobe
- **T4.1 Browse/Filter — PASS.** Grid/list toggle, category filter, combined category+location intersection, clear-all (URL-driven, with chips + counts). Filtering is scroll-based, not paginated. Seed photos load slowly (~5s) — briefly looks like blank cards.
- **T4.2 AI Search — FAIL (High, config).** Natural-language query returned 0 results + toast **"AI search unavailable — showing best-effort matches."** Keyword fallback works ("tuxedo" → 4). The Haiku semantic layer (flagship Tier 3 feature) is down — almost certainly a **missing `ANTHROPIC_API_KEY` env var on Vercel.** Graceful degradation (no crash) is correct.
- **T4.3 Item Detail — PASS.** Detail page, photo, AI-insights block, natural-sentence location, Request CTA, and disabled Request for an in-transit item all work. Single-photo items (no multi-photo carousel to exercise); "condition history" surfaces as Order History.
- **T4.4 Outfit Builder — PASS** (1 Low bug). Create, name, multi-select with live count, save, edit (item swap), and "Request this outfit" (opens rotation wizard with items pre-selected) all work. **Delete works but throws a spurious "Failed to delete outfit" error toast** (Low).

### Section 5 — Orders & Requests
- **T5.1 Seasonal Rotation — PASS.** 4-step wizard → `requested` order (#F77DE6B0) with status timeline.
- **T5.2 On-Demand — PASS.** 3-step with live cost preview ($84 for 3 items); Rush toggle updated total to $126 (+50%) and back in real time. Submitted #C9892E85. Pricing model differs from plan ("$75 base + $15/item") — actual is effectively **$28/item, total-only (no itemized base/surcharge/discount breakdown).**
- **T5.3 Tracking — PASS.** Status timeline; cancel of a requested order works (→ Cancelled, drops from default list); in-preparation order correctly shows no cancel option.
- **Low bug:** requested-delivery date shows **one day early on the mid-flow review/details screens** (06/06 → "June 5"); final saved order is correct. Timezone/UTC parsing.

### Section 6 — Admin Order Management
- **T6.1 Dashboard — PASS.** All orders, "2 pending actions," status filter tabs (Requested filter matched the count).
- **T6.2 Full Lifecycle — PASS (standout).** Walked on-demand #C9892E85 through the **entire 9-status pipeline** — Requested → Confirmed → Dispatched (European Couture Cleaners via dispatch modal) → In Preparation → Shipped (UPS shipment + tracking) → Delivered — with full timestamped status history. Minor: no external "Track package" link on the admin view (it IS present on the client order view); dispatch deadline default is fed by the date off-by-one.
- **T6.3 Client Management — PASS.** Subscription card (Premier $599, founding discount, MRR, renewal, Change-tier/Cancel actions), both addresses, editable internal notes (saved a QA note), full 42-item wardrobe.
- **T6.4 Concierge Queue — FAIL (High).** Queue shows **no messages under any filter** while the dashboard counts "3 open" and client threads exist. Founder cannot read/respond to concierge messages. Data layer is fine — it's a list-query/display bug (and provider messages have null author; see Section 7).

### Section 7 — Provider Journey — BLOCKED (High)
The provider portal exists in code (`/provider`, order queue, stage updates) but **`seedProviders()` only inserts `providers` rows — no provider auth user/profile, and `providers.profile_id` is null.** So there is no provider login, no provider entry in quick-login, and `/provider` redirects all non-providers away. T7.1–T7.4 (queue, accept/decline, service-stage updates, damage flagging, provider messaging) are untestable. This also explains part of the concierge-queue bug: seeded provider messages resolve their author to the null `profile_id`. **Action:** Code should seed a provider auth account (role `provider`, linked via `providers.profile_id`) and add it to quick-login.

### Section 8 — Payments & Billing — in-app verified; Stripe/Inngest dashboards = founder verify
- **T8.1 Subscription:** client billing shows Plan/active/$599 founding rate/renewal; admin controls (Change tier, Cancel at period end, Cancel immediately) present. Cancels/tier-changes **not executed** (mutate Stripe + need dashboard verify).
- **T8.2 Per-request:** seeded delivered on-demand orders show **"Charged"** in the admin Billing panel; freshly delivered #C9892E85 shows "Billing pending — Inngest will charge automatically." Inngest/Stripe verification = founder.
- **T8.3 Refunds:** "Issue refund" link present on a paid delivered order, absent on an unpaid one (correct gating). Refund **not executed** (financial transfer + Stripe verify).
- **T8.4 Billing history:** page loads with subscription + invoice history; payment method concierge-managed by design. Gaps: seed invoice row not clickable/downloadable; no date-range filter.

### Section 9 — Notifications & Communication
- **T9.1 In-app — PASS** (1 Low bug). Bell dropdown, **real-time delivery** (my admin status-changes appeared as the client's notifications with no refresh), click → read + navigate, full page, mark-all-read persists. **Low bug: bell badge not reactive after "Mark all read"** (stuck until reload; single reads do update it).
- **T9.3 Admin triggers — PASS.** Full Email/In-app/SMS per-template toggle matrix that saves ("Configuration saved"); broadcast composer present. Broadcast **not sent** (would notify all test clients).
- **T9.2 Email (Resend)** and **T9.4 Seasonal reminders (Inngest)** = founder dashboard verify. Templates are configured (email enabled; seasonal reminder template present).

### Section 10 — Reporting & Audit — PASS
- **T10.1 Reports:** KPI tiles (14 clients, 11 active subs, 9 orders, $4116 total, $599 this month), Active Clients by Tier (Essentials 9 / Premier 2), revenue trend chart, fulfillment metrics (50% delivery rate), provider performance. CSV export buttons (Revenue/Tiers/Providers) present (not triggered — download).
- **T10.2 Audit:** chronological BEFORE/AFTER diffs including my exact T6.2 status transitions + provider.assigned; Pricing filter (correctly labeled "Pricing") isolates pricing entries with old/new values. My failed Save-pricing attempt is absent from the audit — corroborating it never persisted.

### Section 11 — Client Settings — PASS (design deviations)
Tabs: Billing / Notifications / Addresses / Account. Notification per-type Email/In-app toggles and Communication Preference radios are self-service. **Profile and payment method are concierge-managed ("contact your concierge"), not client-editable** — a design choice that differs from the test plan's assumption of editable profile/card. "Sign out everywhere" present.

### Section 12 — Return Flow — client initiation PASS; admin processing deferred
- **T12.1 steps 1–3 — PASS.** Delivered order → "Return items" modal (items pre-selected) → submit → status "Return Initiated" + concierge-pickup toast. (No return-notes field in the modal.)
- **Steps 4–6 — PASS (verified June 1, re-test).** As admin on #C9892E85: "Mark return received" → custom confirm dialog ("Item locations will be reset to intake") → status → **Return Received**, toast "items reset to intake". Verified item re-entered storage: LLV-000540 (Black Cashmere Blazer) now shows status **Stored** in admin inventory. Notes: no separate return-shipping form (return shipment is optional via "+ Add return"); toast says "intake" while the item shows "Stored" (harmless wording mismatch). Inventory search is Enter-to-submit (not live-filter) — works as designed.

### Section 13 — Cross-Cutting — PASS
- **T13.1 RBAC:** client → `/admin/orders` redirects to `/client`; `/provider` redirects non-providers; unauthenticated → login. (Provider→X cases untestable — no provider account.)
- **T13.2 RLS:** as Margaret, James Thornton's order URL returns **404** — no cross-client access by ID guessing. Each client only ever saw their own items/orders/notifications.
- **T13.3 Responsive:** at ~390px the dashboard reflows — sidebar → hamburger, 2-column cards, no horizontal scroll.
- **T13.4 Error handling:** missing-field validation (corridor), in-transit-not-requestable, and zero-item prevention all verified. Invalid-card decline + offline handling not exercised.
- **T13.5 Design system:** Obsidian & Ivory + Cormorant headings + Inter body + Shadcn components consistent across every page browsed.

---

## Bugs (consolidated)

| # | Sev | Area | Summary |
|---|-----|------|---------|
| 1 | High | Pricing | "Save pricing" never persists + page appears frozen. **Root cause: native `window.confirm()` in `tier-edit-form.tsx` blocks the page and returns early when dismissed** — not a Stripe hang. Subset of #9. |
| 2 | High | Concierge | Admin `/admin/concierge` queue empty under all filters despite dashboard "3 open" + client threads. Founder can't read/respond. |
| 3 | High (config) | AI Search | Haiku semantic search unavailable on Vercel ("AI search unavailable") — likely missing `ANTHROPIC_API_KEY` env var. Keyword fallback works. |
| 4 | High | Providers | No provider auth account seeded (`providers.profile_id` null); provider portal unreachable; Section 7 untestable. |
| 5 | Low | Corridors | New Corridor modal prefilled code defaults not in form state → false "All fields are required." |
| 6 | Low | Outfits | Delete succeeds but shows a spurious "Failed to delete outfit" error toast. |
| 7 | Low | Dates | Requested-delivery date off-by-one on review/details/dispatch-modal screens (final saved date correct). |
| 8 | Low | Notifications | Bell badge not reactive after "Mark all read" (stale until reload). |
| 9 | High | UX / Brand | **Native `window.confirm()` at 8 sites** (tier save-pricing + deactivate; order refund + mark-return-received; client cancel-order + initiate-return; sign-out-everywhere; close-account) instead of a custom dialog. Off-brand OS chrome + blocks the main thread (root cause of #1 and the "freezes"). Founder spotted it on Cancel order. → `llv_code_prompt_2026-06-01_native_dialogs.md` |

## Needs founder / dashboard verification
- **Stripe dashboard:** customer + subscription creation (T3.1/T8.1), proration on tier change, refund processing, per-request invoice line items.
- **Resend dashboard / dev inbox:** email notifications (T9.2).
- **Inngest dashboard:** billing function firing post-delivery (T8.2), seasonal reminder schedules (T9.4).

## Not executed (guardrails / scope)
Subscription cancel/tier-change and refund (Stripe mutations / financial transfer); broadcast send (would notify all clients); CSV downloads; admin return processing steps 4–6; invalid-card decline + offline error cases.

## Test residue left in the environment (harmless)
- Deactivated test provider "Test Provider DELETE ME" and corridor "Wisconsin to Florida TEST".
- Victoria Simmons now fully onboarded (Premier sub, 2 addresses, 0 items).
- QA note appended to Margaret's internal notes.
- Orders created: rotation #F77DE6B0 (cancelled), on-demand #C9892E85 (delivered → return initiated).
- Many leftover smoke-test client accounts clutter the admin roster (finalsmoke, vercelsmoke, webhooktest, etc.) — Clear-Test-Accounts tool exists to purge.
