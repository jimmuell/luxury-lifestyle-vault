# LLV — Phase B Task Breakdown for Claude Code

**Author:** Claude Cowork
**Date:** May 25, 2026
**Status:** 🏁 **PHASE B COMPLETE (May 25, 2026)**

---

## 🏁 Phase B Completion Summary

**31 of 32 features complete · 1 deferred · all sprints delivered May 25, 2026.**

| Sprint | Status | Features delivered | Deferred |
|---|---|---|---|
| **Sprint B1 — Core Client Experience** | ✅ Complete (May 25, 2026) | B1-01, B1-02, B2-01, B2-02, B2-03, B6-01 (6 features) | — |
| **Sprint B2 — Payments, Providers & Notifications** | ✅ Complete (May 25, 2026) | B1-03, B2-04, B2-05, B3-01, B3-02, B3-03, B3-04, B4-01, B4-02, B5-01, B5-02, B6-02, B6-03, B7-01, B7-02 (15 features) | — |
| **Sprint B3 — Polish, Analytics & Nice-to-Have** | ✅ Complete (May 25, 2026) | B7-03, B7-04, B3-05, B2-06, B6-04, B6-05, B4-03, B4-04, B5-03, B1-04 (10 features) | **B1-05** (wardrobe analytics — nice-to-have, post-launch) |

**Build state:** Clean. All 31 required features shipped and building. Stripe integrated in sandbox mode via the Lion Gate Technology account. Platform is **launch-ready for the founding-member pilot**.

**Deferred to post-launch:** B1-05 (wardrobe analytics) — pure client polish; tagged nice-to-have throughout Sprint B3 planning. Skipping does not block any launch surface.

**Next phase: NOT platform work.** Business strategy resolution (the assumptions register's 10 open items), founding-member recruitment, provider onboarding, and the October 2026 launch preparation. See `docs/strategy/llv_launch_readiness.md` for the full pre-launch checklist.

---
**Source documents:**
- `docs/strategy/llv_phase_b_feature_checklist.docx` (31 features across 7 groups, organized into Sprints B1/B2/B3)
- `docs/strategy/llv_business_strategy_assumptions_register.docx` (working assumptions for 10 open business items)
- `docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx` (ratified stack — Sections 1–5)
- `docs/cowork/llv_phase_a_task_breakdown.md` (Phase A patterns, complete)
- The live codebase as of May 25, 2026 (Phase A complete: 25 routes, 10 migrations).

**Consumer:** Claude Code, working in the LLV repository.

---

## How to use this document

Phase B delivers the digital wardrobe management experience and the order/payment/provider workflows required for an October 2026 soft launch. Tasks are grouped by the seven functional groups defined in the feature checklist:

1. Digital Wardrobe Catalog (B1)
2. Order & Request System (B2)
3. Payments & Subscriptions (B3)
4. Notifications & Communication (B4)
5. Provider Portal Expansion (B5)
6. Admin Operations & Configuration (B6)
7. Client Portal Polish & Onboarding (B7)

Each Sprint B1 feature has a full Code-level task spec below — atomic enough to pick up in one Code session, with explicit done-when criteria. Sprint B2 and B3 features are listed at feature-summary level; they will be expanded into Code-level tasks as B1 wraps up and B2 begins.

Status legend:
- ✅ **Done** — present in codebase, no Phase B work needed
- 🔧 **In progress** — Code actively building right now
- ⚙️ **Partial** — foundation exists, finishing work remains
- ☐ **Not started** — no codebase artifacts yet
- ⛔ **Blocked** — held pending business decision or dependency

Working-assumption pointers marked **[AR-N]** reference the assumptions register. The platform is designed so each AR-N item is a configuration change (admin or DB), not a code change. Code can build against the working assumption immediately.

---

## Recent completions (build cycle log)

| Date | Tasks completed | Notes |
|---|---|---|
| May 25, 2026 | **🏁 PHASE B COMPLETE.** 31 of 32 features shipped across all three sprints in a single session. B1-05 (wardrobe analytics) deferred as planned nice-to-have, post-launch. Platform is launch-ready for the founding-member pilot. | All three sprints marked ✅ Complete in this document. Next phase: business strategy resolution + launch preparation (see `docs/strategy/llv_launch_readiness.md`). |
| May 25, 2026 | **🏁 SPRINT B3 COMPLETE.** All 10 B3 features delivered: B7-03 (client order history), B7-04 (client settings & preferences), B3-05 (billing history & invoices), B2-06 (return flow), B6-04 (reporting & analytics), B6-05 (audit trail), B4-03 (admin notification triggers), B4-04 (seasonal rotation reminders), B5-03 (provider messaging), B1-04 (outfit builder). B1-05 deferred. | Platform launch-ready. |
| May 25, 2026 | **🏁 SPRINT B2 COMPLETE.** All 15 B2 features delivered: B1-03, B2-04, B2-05, B3-01 (Stripe sandbox via Lion Gate Technology), B3-02, B3-03, B3-04, B4-01 (Resend), B4-02, B5-01, B5-02, B6-02, B6-03, B7-01, B7-02. | Payments, provider workflows, and notifications all wired. |
| May 25, 2026 | **🟢 Sprint B3 task breakdown delivered (Cowork).** All 11 B3 features expanded from feature-summary to Code-level detail, sequenced in the founder-specified build order: B7-03 → B7-04 → B3-05 → B2-06 → B6-04 → B6-05 → B4-03 → B4-04 → B5-03 → B1-04, then B1-05 (nice-to-have). | This is the launch-ready finish line. Code can begin B3 as soon as B2 wraps. B1-05 explicitly tagged deferrable. |
| May 25, 2026 | **🏁 SPRINT B1 COMPLETE.** All 6 features delivered: B1-01 (wardrobe browse & filter), B1-02 (AI-powered search), B2-01 (seasonal rotation request), B2-02 (on-demand item request), B2-03 (order lifecycle management — built as foundation), B6-01 (order management dashboard). | 31 routes, clean build. New surfaces: client wardrobe catalog with filters + Haiku 4.5 natural-language search, seasonal rotation wizard, on-demand request flow with cost preview, full 9-status order lifecycle, admin order dashboard with provider assignment, client order tracking with timeline. Next: Sprint B2. |
| May 25, 2026 | **🟢 Phase B planning complete.** Feature checklist + assumptions register delivered; Sprint B1 task breakdown written. | 31 features, 7 groups, 3 sprints. October 2026 launch target. Sprint B1 (6 features) ready for Code to begin. |
| May 25, 2026 | **Admin Seed Data Manager shipped.** Migration 010 + env-gated admin route. | 5 demo clients, 36 demo items, full seed suite. Lets Phase B work proceed against realistic data immediately. |

Add new rows at the top as Code completes Phase B tasks.

---

## Current state assessment (entering Phase B)

### What Phase A delivered (already in codebase)

**Foundation & data layer:**
- Next.js 16 App Router, Tailwind v4, Shadcn/UI on Base UI, three Supabase client factories, role-based middleware (`/client`, `/provider`, `/admin`).
- 10 migrations live: enums (`user_role`, `item_status` 9 values, `item_category` 14, `condition_level` 5, `service_type`, `item_location`), tables (`profiles`, `client_profiles`, `addresses`, `providers`, `items`, `item_photos`, `item_conditions`, `concierge_messages`), RLS on every table, auto-generated SKU trigger, storage buckets (`item-photos`, `item-photos-archive`, `avatars`).
- Inngest client + `/api/inngest` route; AI photo categorization (Haiku 4.5) wired async on upload.
- Storage abstraction: `src/lib/storage/` (`constants.ts`, `server.ts`, `upload-photo.ts`) — provider-agnostic `PhotoStorage` interface.
- Admin Seed Data Manager — env-gated, 5 demo clients, 36 demo items.

**Customer Experience (Phase A scope):**
- Client dashboard, address management, 4-step onboarding stepper with middleware gating.
- Wardrobe catalog page (basic list with photo + status), item detail page (photo gallery, metadata, condition history), client intake page (5-step form, multi-file photo upload with HEIC).
- Concierge messaging (table-backed, admin queue).

**Operations Engine (Phase A scope):**
- Admin dashboard (client counts, item status grid, concierge queue).
- Admin client roster + per-client detail.
- Admin inventory detail (`/admin/items`, `/admin/items/[id]`) with status-transition controls (CONDITION_REQUIRED map enforced) and condition history.
- Controlled `item_location` enum (migration 007) for the WI/AZ corridor.

**Provider Network (Phase A scope):**
- Provider CRUD (create, edit, deactivate, reactivate).
- Provider portal landing (welcome, contact, deferred-functionality copy).

**Design System:**
- Typography primitives (`<Display>`, `<H1>`–`<H3>`, `<Body>`, `<BodySmall>`, `<Caption>`, `<Mono>`) in `src/components/ui/typography.tsx`.
- `/admin/styleguide` for design QA.
- Obsidian & Ivory palette, Cormorant Garamond + Inter via `next/font`.

### What Phase B must add

| Group | Phase A delivered | Phase B adds |
|---|---|---|
| Digital Wardrobe Catalog | Basic list view, item detail | Filter, AI search, outfit builder, analytics, enhanced item detail with request CTA |
| Order & Request System | None — Phase A has no order concept | Full lifecycle: requested → confirmed → dispatched → in_preparation → shipped → delivered → return |
| Payments | None | Stripe integration, subscriptions, per-request billing, admin pricing config |
| Notifications | Concierge messages only | Resend email templates, in-app notification center, admin triggers, seasonal reminders |
| Provider Portal | Landing page | Order queue, status updates, messaging |
| Admin Ops & Config | Client roster, item search, provider CRUD | Order dashboard, tier/pricing config, corridor management, reporting, audit trail |
| Client Portal Polish | Functional dashboards, basic onboarding | Tier selection + Stripe payment in onboarding, luxury dashboard, history, settings |

---

## Sprint structure

Three sprints, roughly four to six weeks each, getting Phase B to launch-ready by October 2026.

- **Sprint B1 — Core Client Experience.** ✅ **Complete (May 25, 2026).** Delivered: B1-01, B1-02, B2-01, B2-02, B2-03, B6-01. 31 routes, clean build.
- **Sprint B2 — Payments, Providers & Notifications.** ✅ **Complete (May 25, 2026).** Delivered: B1-03, B2-04, B2-05, B3-01 (Stripe sandbox via Lion Gate Technology), B3-02, B3-03, B3-04, B4-01, B4-02, B5-01, B5-02, B6-02, B6-03, B7-01, B7-02.
- **Sprint B3 — Polish, Analytics & Nice-to-Have.** ✅ **Complete (May 25, 2026).** Delivered: B7-03, B7-04, B3-05, B2-06, B6-04, B6-05, B4-03, B4-04, B5-03, B1-04. **Deferred:** B1-05 (wardrobe analytics, nice-to-have, post-launch).

Founder approves sprint composition before Claude Code begins each sprint. Sprints are not hard boundaries — Code may pull from later sprints if blocked.

---

## Sprint B1 — Core Client Experience (detailed tasks)

### B1-01. Wardrobe browse & filter — ✅ Done (May 25, 2026)

- **Why:** Phase A delivered a basic wardrobe grid. Phase B turns it into a true browsable catalog — the surface that makes Tier 3 (On-Demand Occasion Fulfillment) and Tier 1/2 rotation requests possible. Per blueprint Section 2.1 and feature checklist B1-01.
- **What to build:** Upgrade `/client/wardrobe` from the Phase A list to a full catalog experience with filtering and view modes.
- **Done when:**
  - Filters wired (all client-side after RLS-respecting server fetch): **category** (multi-select from `item_category` enum, 14 values), **occasion** (derived from AI tags + manual tags — see schema task below), **season** (`spring`/`summer`/`fall`/`winter`, multi-select), **color** (derived from AI tags + manual tags), **brand** (free-text contains, from `items.brand`), **current location** (multi-select from `item_location` enum, 8 values).
  - **View toggle**: grid (photography-forward, large thumbnails, Phase A current default) and list (denser, scannable, sortable by name / recently added / category). Toggle persists per-user (use a `client_profiles.preferences` jsonb column — add via migration).
  - **Sort**: name (A→Z, Z→A), recently added (default), category, current location.
  - **Empty states**: distinct copy when (a) wardrobe is empty and (b) filters return zero — both concierge-toned, not utilitarian.
  - **Responsive**: 4-column grid on desktop, 2-column on tablet, 1-column on mobile. List view: full-width rows with thumbnail.
  - **RLS-respecting**: server-fetched via `getItemsByClient` in `src/lib/queries/items.ts`; never uses the admin client.
  - **Performance**: pagination or infinite scroll at 50 items per page (founding members may have 200+ items). Use the existing typography primitives throughout.
- **Schema work:**
  - Migration: add `client_profiles.preferences` (jsonb, default `'{}'`) for view-mode persistence.
  - Migration: add `items.tags` (text[], nullable) for manual occasion/color tags the AI didn't capture. AI tags continue to live in `item_photos.ai_analysis`.
  - Query helper: extend `getItemsByClient` to accept a filter object (`{ categories?, seasons?, locations?, brands?, occasions?, colors? }`) and return paginated results with total count.
- **Dependencies:** None (Phase A foundation is sufficient).
- **Footnotes:** [AR-2] Pricing is irrelevant on this surface but the catalog will eventually power Tier 3 "request this item" CTAs (B2-02).
- **Estimated effort:** 1.5 Code sessions.

---

### B1-02. AI-powered search — ✅ Done (May 25, 2026)

- **Why:** This is the differentiator that elevates the catalog from "filter by category" to "find me a black-tie outfit for the December gala." Per blueprint Section 3.2 and feature checklist B1-02.
- **What to build:** A natural-language search box on `/client/wardrobe` that uses Haiku 4.5 to match the query against each item's AI-analyzed metadata, returning ranked results.
- **Done when:**
  - Search input above the filter bar with debounced submit (500ms) and an explicit "Search" button.
  - On submit: server action `searchClientWardrobe(query, clientId)` runs.
    - Fetches all items for the client (RLS-enforced) with `item_photos.ai_analysis` joined.
    - Calls Haiku 4.5 via Anthropic SDK with a structured prompt: query + each item's `{name, category, brand, color, season, ai_analysis.suggestedName, ai_analysis.detectedBrand, ai_analysis.detectedColor, ai_analysis.conditionFlags}`.
    - Receives back a ranked list of item IDs with confidence scores `[{itemId, score, reason}]`.
    - Returns the items in ranked order with the AI's `reason` string visible as a small caption under each card.
  - **Latency**: under 3 seconds for a 200-item wardrobe (acceptable for a search action). If slower, add a "Searching…" state and cancel-previous-on-new-query logic.
  - **Cost guardrail**: cap calls to one per user per 2 seconds (basic debounce) and log token usage to `ai_search_logs` table for cost monitoring.
  - **Empty result**: friendly concierge-toned copy with a "Clear search" CTA back to the filtered catalog.
  - **Combinability**: search and filters compose — if the user has filters active, the AI search runs against the filtered subset.
  - **Fallback**: if the Anthropic API errors, fall back to client-side substring match across name/brand/category/tags and toast "AI search unavailable — showing best-effort matches."
- **Schema work:**
  - Migration: `ai_search_logs` table (`id`, `client_id`, `query`, `result_count`, `input_tokens`, `output_tokens`, `latency_ms`, `created_at`). RLS: admin-only read.
- **Implementation notes:**
  - Use a server action, not a route handler — the Anthropic API key is server-only.
  - Structured output: ask Claude to return JSON conforming to a schema, parse with strict validation, fail gracefully if parse fails.
  - Prompt should be terse (Haiku is cheaper but smaller context) — send the query and the item metadata only, not photos. The AI categorization already analyzed photos at upload time; reuse that output.
- **Dependencies:** B1-01 (the catalog surface) lands first so search shares the same result rendering.
- **Footnotes:** [AR-2] Per-request fee structure (Tier 3) will eventually display alongside results — defer to B2-02.
- **Estimated effort:** 2 Code sessions (1 for search backend + prompt + logging, 1 for UI + fallback + tuning).

---

### B2-01. Seasonal rotation request — ✅ Done (May 25, 2026)

- **Why:** Tier 1 and Tier 2 are subscription tiers built around seasonal rotation. Without this surface, the subscription tiers have no client action. Per feature checklist B2-01 and blueprint Section 3.1.
- **What to build:** A `/client/rotations/new` flow where a client kicks off a seasonal rotation request: which items, which destination, when.
- **Done when:**
  - **Step 1 — Items**: client chooses (a) "all seasonal items" (system pre-selects items tagged for the current upcoming season per their address-based corridor logic) or (b) a manual selection from the wardrobe catalog (reuses B1-01 grid in selection mode with checkboxes).
  - **Step 2 — Destination**: client picks a destination address from their saved addresses (Phase A address management). Address must be different from the current location of the selected items (server-side validation).
  - **Step 3 — Date**: client sets a preferred delivery date. Date must be at least 14 days in the future (configurable in admin — see B6-02). Calendar input with disabled past/too-soon dates.
  - **Step 4 — Review & submit**: shows summary (N items, from → to, date). Submit creates a new `orders` row with `order_type = 'seasonal_rotation'`, status `requested`, and `order_items` rows for each selected item.
  - **Admin notification**: a new admin-queue entry surfaces the request (B6-01 is where admin actually processes it).
  - **Client confirmation**: toast + redirect to `/client/orders/[id]` with status `requested`.
  - **Concierge toned throughout**: "We'll prepare your wardrobe for the move" copy, not "submit order."
- **Schema work:**
  - Migration: `orders` table — `id`, `client_id`, `order_type` enum (`seasonal_rotation`, `on_demand_item`, `return`), `status` enum (see B2-03), `from_location`, `to_address_id`, `requested_delivery_date`, `confirmed_delivery_date`, `provider_id` (nullable until dispatch), `total_cents`, `notes`, `created_at`, `updated_at`. RLS: client sees own, admin sees all.
  - Migration: `order_items` table — `id`, `order_id`, `item_id`, `unit_price_cents` (nullable for seasonal), `notes`. RLS inherits via order.
  - Migration: `order_status_history` table — `id`, `order_id`, `status` enum, `actor_profile_id`, `notes`, `created_at`. Append-only.
- **Dependencies:** B1-01 (catalog grid in selection mode), Phase A address management.
- **Footnotes:** [AR-2] Subscription tier determines whether this is included or per-rotation-billed — but billing is Sprint B2 (B3-03). For B1, the request creates the order; payment ties in B2.
- **Estimated effort:** 2 Code sessions (1 for schema + server actions, 1 for the multi-step flow UI).

---

### B2-02. On-demand item request (Tier 3) — ✅ Done (May 25, 2026)

- **Why:** Tier 3 is the year-round differentiator no competitor offers. Without this surface, Tier 3 doesn't exist. Per feature checklist B2-02 and blueprint Section 3 (Tier 3 description).
- **What to build:** A "Request this item" CTA on item cards (catalog and detail) that opens a streamlined request flow.
- **Done when:**
  - **Entry points**: "Request this item" button on `/client/wardrobe/[id]` (item detail) and as a hover/long-press action on items in the catalog grid (B1-01).
  - **Modal flow** (or dedicated `/client/orders/new?items=...` page on mobile):
    - Pre-filled with the selected item(s). Client can add more items from a quick wardrobe picker.
    - **Destination**: address picker from saved addresses (Phase A).
    - **Delivery date**: calendar with minimum lead time enforcement (per assumption: 48 hours for standard, +50% premium for rush — configurable in admin).
    - **Special instructions**: free-text textarea (e.g., "for Friday evening, black tie").
    - **Cost preview**: server-computed estimate based on assumption-register pricing ($75 base + $15/item + rush premium if applicable). Pulled from `service_tiers` table (added in B6-02). Founding member discount applied if `client_profiles.founding_member = true`.
    - **Submit**: creates `orders` row with `order_type = 'on_demand_item'`, status `requested`, `total_cents` populated with estimate (final amount confirmed on dispatch by admin).
  - **Optimistic UI**: button shows "Request created — your concierge will confirm shortly" then routes to the order detail page.
- **Schema work:**
  - Migration: `service_tiers` table — `id`, `name`, `description`, `monthly_price_cents` (nullable for non-subscription tiers), `per_request_base_cents` (nullable for subscription), `per_item_surcharge_cents`, `rush_premium_pct`, `min_lead_time_hours`, `rush_lead_time_hours`, `founding_member_discount_pct`, `active`, `sort_order`. Pre-seed with Tier 1/2/3 working-assumption values. Editable via B6-02.
  - Migration: `client_profiles.founding_member` (bool, default false).
- **Dependencies:** B1-01 (catalog), Phase A item detail page.
- **Footnotes:** [AR-2] All pricing values come from `service_tiers` — never hardcoded. When pricing decision finalizes, admin updates the table; UI and billing automatically reflect.
- **Estimated effort:** 2 Code sessions (1 for schema + cost computation, 1 for the modal flow + integration points).

---

### B2-03. Order lifecycle management — ✅ Done (May 25, 2026, built as foundation for B2-01/B2-02/B6-01)

- **Why:** Once an order exists (from B2-01 or B2-02), its status must move through a defined lifecycle that both client and admin can track. Without this, the order surface is one-way and Tier 3 is just a "submit and hope" experience. Per feature checklist B2-03.
- **What to build:** A state machine for orders, status-transition server actions (admin-only), a client-visible order detail page with live status, and a status timeline.
- **Done when:**
  - **State machine**: define `order_status` enum with these states and transitions (matches feature checklist B2-03):
    - `requested` → `confirmed` | `cancelled`
    - `confirmed` → `dispatched_to_provider` | `cancelled`
    - `dispatched_to_provider` → `in_preparation` | `cancelled`
    - `in_preparation` → `shipped` | `cancelled`
    - `shipped` → `delivered`
    - `delivered` → `return_initiated` (for seasonal rotations) — return flow itself is B2-06 (Sprint B3)
    - `return_initiated` → `return_received`
    - `cancelled` is terminal from any pre-shipped state.
  - **Server actions** in `src/actions/orders.ts`:
    - `adminTransitionOrderStatus({ orderId, toStatus, notes })` — admin-only, validates transition map, writes to `order_status_history`, writes any required side effects (e.g., on `confirmed` set `confirmed_delivery_date`).
    - `clientCancelOrder({ orderId })` — client can cancel only if status is `requested` or `confirmed`.
    - `clientInitiateReturn({ orderId })` — client can initiate return only on `delivered` orders that were seasonal rotations.
    - All actions re-verify `auth.getUser()` and derive client_id from session, never form data (per `CLAUDE.md` server-action pattern).
  - **Client order detail page** (`/client/orders/[id]`):
    - Header: order type label + current status badge (use design-system status colors).
    - Timeline: vertical list of status transitions with timestamp, status label, and notes (if admin added any).
    - Items: photo + name + SKU for each order item.
    - Destination + date.
    - Cost (if Tier 3).
    - Action buttons: "Cancel order" (only when allowed by state machine).
    - RLS-enforced (client sees only own orders).
  - **Client order list page** (`/client/orders`):
    - List of all the client's orders with status badge, type, item count, date.
    - Filter by status (all / open / completed / cancelled).
    - Empty state for new clients.
  - **Transition map** committed to `src/types/app.ts` as `ORDER_STATUS_TRANSITIONS` matching the existing pattern from `ITEM_STATUS_TRANSITIONS`.
- **Schema work:**
  - Migration: `order_status` enum (matches above).
  - Already covered by B2-01's `orders` and `order_status_history` migrations — just confirm the enum aligns.
- **Dependencies:** B2-01 (creates orders), B2-02 (creates orders). Notifications (B4-01) are Sprint B2 — for now, status changes update DB only; client must check the page.
- **Footnotes:** Status-change notifications are explicitly Sprint B2 (B4-01). The lifecycle works without notifications; B4-01 just makes it luxurious.
- **Estimated effort:** 2.5 Code sessions (1 for schema + state machine + server actions, 1.5 for the two pages).

---

### B6-01. Order management dashboard — ✅ Done (May 25, 2026)

- **Why:** Once orders start flowing in (B2-01/02/03), the founder needs a single operations cockpit to see and act on them. Without this, the admin must hunt through individual client pages. Per feature checklist B6-01 and blueprint Section 3.1.
- **What to build:** A `/admin/orders` page that's the admin's primary daily workspace.
- **Done when:**
  - **List view**:
    - All orders across all clients, default sort: oldest open first.
    - **Filters**: status (multi-select), client (autocomplete on name/email), order type, corridor (origin region → destination region — derived from from/to addresses), provider (when assigned), date range.
    - **Columns**: client name, type, item count, from → to, requested date, current status, age (time since created), assigned provider (or "Unassigned").
    - **Bulk actions**: select multiple rows → bulk-assign provider (modal with provider picker), bulk-transition status (only valid common transitions).
    - **Quick row actions**: assign provider, transition status (dropdown of valid next states), view detail.
  - **Calendar view toggle**: month/week calendar showing orders by requested delivery date. Click an event to open the order detail. Useful for spotting bunching and capacity issues.
  - **Detail page** (`/admin/orders/[id]`):
    - Same data as client order detail (B2-03) plus admin-only controls:
      - Status transition panel (matches the existing admin item-detail pattern from Phase A OE-3).
      - Provider assignment (dropdown of active providers from `providers` table, filtered to those matching the order's corridor — admin-configurable).
      - Editable admin notes.
      - Audit trail (`order_status_history`) shown in full.
    - Server actions: `adminAssignProvider`, `adminTransitionOrderStatus` (from B2-03), `adminUpdateOrderNotes`.
  - **Dashboard tile on `/admin`**: count of open orders by status + a "view all" link to `/admin/orders`. Reuses Phase A admin dashboard composition pattern.
  - **RLS / role-gated**: admin-only via existing middleware.
- **Schema work:**
  - None new — uses tables from B2-01.
  - Optional: add a `providers.corridors` text[] column (e.g., `{'WI', 'AZ'}`) to support the corridor filter on provider assignment. Phase A `providers` table may not have this — add via migration if missing.
- **Dependencies:** B2-01, B2-02, B2-03 (orders must exist before they can be managed).
- **Footnotes:** [AR-3] Provider assignment is purely operational at this stage — no provider-side action yet (B5-01 in Sprint B2). Admin assigns and tracks; provider workflow comes later.
- **Estimated effort:** 3 Code sessions (1 for list view + filters, 1 for calendar + detail page, 1 for bulk actions + assignment flow).

---

## Sprint B2 — Payments, Providers & Notifications (detailed tasks)

Sprint B2 wires Stripe payments and subscriptions, activates the provider portal, and adds the notification surface (email + in-app) that makes the platform feel like a concierge service rather than a logistics tool. 15 features. Suggested build order is roughly: B3-01 → B6-02 → B3-04 → B3-02 → B3-03 → B7-01 → B4-01 → B4-02 → B5-01 → B5-02 → B2-04 → B2-05 → B1-03 → B6-03 → B7-02. Some can run in parallel (e.g., B1-03 alongside payments work).

---

### B1-03. Item detail view (Phase B upgrade) — ✅ Done (May 25, 2026)

- **Why:** Phase A item detail is functional but utilitarian. Phase B turns it into a true client-facing showcase: full-screen photography, all AI metadata surfaced, condition history visible, and the "Request this item" CTA from B2-02 wired in. Per feature checklist B1-03.
- **What to build:** Upgrade `/client/wardrobe/[id]` (and `/admin/items/[id]` where it makes sense) with a polished, photography-forward layout.
- **Done when:**
  - **Hero gallery**: full-bleed photo carousel using all `item_photos` for the item, with arrow navigation, dot indicators, swipe on mobile. Click any photo for full-screen lightbox with pinch/scroll zoom and pan.
  - **Metadata panel**: Cormorant-headed sections for Identity (SKU, category, brand, color, size, season, purchase year), Care (material, care instructions, purchase price if entered), and AI Insights (collapsible — surface `item_photos.ai_analysis.suggestedCategory`, `suggestedName`, `detectedBrand`, `detectedColor`, `conditionFlags`, all marked "AI-generated" with confidence score).
  - **Current location + status**: prominent badge using design-system status colors; "Where is it now?" sentence translating the enum value (e.g., `storage_az` → "In your Scottsdale storage").
  - **Condition history**: vertical timeline from `item_conditions` showing condition level, date, photographer/admin, notes, and any flagged issues. Photos attached to conditions inlined.
  - **Order history**: list of past orders containing this item (status + date), pulling from `order_items` joined to `orders`. Empty state for never-requested items.
  - **Request this item CTA**: primary button that opens the B2-02 on-demand request modal pre-filled with the item. Disabled with tooltip if the item is currently `in_transit` or `damaged`.
  - **RLS-enforced**: clients see only their own items; admin variant is read-only on this surface (transitions stay in `/admin/items/[id]`).
- **Schema work:** None.
- **Dependencies:** B2-02 (the request modal it wires into).
- **Footnotes:** [AR-4] Declared item value is shown in the Care section if present; the Phase A `items.value_cents` field is already in place for insurance support.
- **Estimated effort:** 1.5 Code sessions.

---

### B2-04. Provider dispatch — ✅ Done (May 25, 2026)

- **Why:** B6-01 lets the admin assign a provider; this task wires the rest of the dispatch flow — provider receives the order, sees what to do, and confirms acceptance. Without it, "dispatched_to_provider" is an empty status. Per feature checklist B2-04.
- **What to build:** Connect the admin assignment surface (B6-01) to the provider portal (B5-01) so an assigned order shows up in the provider's queue with full context.
- **Done when:**
  - **On admin assignment** (from `/admin/orders/[id]` or bulk action in B6-01): `adminAssignProvider({ orderId, providerId })` server action does the following atomically:
    - Validates the order is in `confirmed` status (cannot assign from `requested`; must be confirmed first).
    - Sets `orders.provider_id`, transitions status to `dispatched_to_provider`, writes `order_status_history` row.
    - Creates a `provider_order_assignments` row (see schema) capturing pickup window, delivery deadline, prep instructions, declared value totals.
    - Enqueues an Inngest job `notify-provider-of-assignment` (Resend email if provider has an email; in-app notification on next provider login).
  - **Admin-side**: assignment modal exposes editable pickup window (default: 24h from now), delivery deadline (computed from order's `requested_delivery_date` minus 48h shipping buffer, admin-overridable), free-text prep instructions (e.g., "Lightly press only; no harsh solvents on the silk lining").
  - **Provider-side preview**: the assigned order appears in B5-01's queue with all assignment context; provider can accept or decline.
  - **Decline path**: provider can decline with a required reason; order moves back to `confirmed`, admin sees the decline in B6-01 with reason captured.
  - **Audit**: every assignment, decline, and reassignment writes to `order_status_history` with actor info.
- **Schema work:**
  - Migration: `provider_order_assignments` table — `id`, `order_id`, `provider_id`, `assigned_by_profile_id`, `pickup_window_start`, `pickup_window_end`, `delivery_deadline`, `prep_instructions`, `declared_value_total_cents`, `provider_response` enum (`pending` | `accepted` | `declined`), `decline_reason`, `created_at`. RLS: admin full, provider sees own assignments only.
- **Dependencies:** B6-01 (assignment surface), B5-01 (provider queue), B4-01 (notification email — degrades gracefully if not yet shipped: in-app notification only).
- **Footnotes:** [AR-3] Provider portal restricts client PII per the assumption-register working assumption — assignments expose item details, item value totals, and corridor endpoints, but not client names or contact info.
- **Estimated effort:** 2 Code sessions.

---

### B2-05. Shipping integration — ✅ Done (May 25, 2026)

- **Why:** Once a provider marks an order ready, shipping has to happen. Phase B keeps this lightweight (manual label entry); Phase C wires carrier APIs. Per feature checklist B2-05.
- **What to build:** A shipping-tracking surface on orders that supports manual carrier + tracking-number entry plus a client-facing tracking link.
- **Done when:**
  - **Admin shipping panel** on `/admin/orders/[id]` (appears when order is in `in_preparation` or `shipped`): fields for carrier (dropdown — UPS, FedEx, USPS, DHL, Other-with-text), tracking number, ship date, expected delivery date, shipping label URL (optional, for storing a generated label PDF), and shipping cost cents (for COGS tracking, not billed to client).
  - **Save action**: `adminUpdateShipping({ orderId, ... })` writes to a new `order_shipments` table (one-to-many — an order may have outbound + return shipments). When the first outbound shipment is saved with carrier + tracking number, status auto-transitions `in_preparation` → `shipped` and `order_status_history` is appended.
  - **Client tracking on `/client/orders/[id]`**: shows carrier logo (use Lucide brand icons or simple text), tracking number, ship date, and a "Track package" link that opens the carrier's tracking URL pattern (e.g., `https://www.ups.com/track?tracknum=...`). Patterns stored in a small constant map in `src/lib/shipping/carriers.ts`.
  - **Delivered transition**: admin marks `delivered` on the order; `order_shipments.delivered_at` is set; client sees confirmation. (Phase C: webhook-driven auto-delivery from carrier APIs.)
  - **Return shipments**: when status moves to `return_initiated`, admin creates a second `order_shipments` row with `direction = 'return'`; client sees both shipments on the order page.
- **Schema work:**
  - Migration: `order_shipments` table — `id`, `order_id`, `direction` enum (`outbound`, `return`), `carrier` enum (with `other` + free-text fallback in `carrier_other`), `tracking_number`, `label_url`, `shipped_at`, `expected_delivery_at`, `delivered_at`, `shipping_cost_cents`, `notes`, `created_at`, `updated_at`. RLS: client sees shipments for own orders; admin all.
  - Constants: `src/lib/shipping/carriers.ts` exporting carrier metadata and tracking URL templates.
- **Dependencies:** B2-03 (order lifecycle), B6-01 (admin order detail).
- **Footnotes:** Phase C will replace manual tracking entry with EasyPost or Shippo integration; the `order_shipments` schema is designed to accept programmatic writes without changes.
- **Estimated effort:** 1.5 Code sessions.

---

### B3-01. Stripe integration — ✅ Done (May 25, 2026, sandbox via Lion Gate Technology)

- **Why:** Foundational for all of payments. B3-02, B3-03, B3-05, and B7-01 all depend on a working Stripe connection. Per feature checklist B3-01.
- **What to build:** Connect Stripe, create customers, wire webhooks, store payment methods.
- **Done when:**
  - **Stripe account**: founder creates a live Stripe account (out-of-band); store secret key in `STRIPE_SECRET_KEY`, publishable key in `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, webhook signing secret in `STRIPE_WEBHOOK_SECRET`. Document in `CLAUDE.md` env section.
  - **Stripe client**: `src/lib/stripe/server.ts` exports a configured `stripe` instance using `stripe` npm package. Pin SDK version.
  - **Customer creation**: on first successful signup (in a `profileCreated` Inngest event triggered by the existing `profiles` insert trigger, or inline in the signup server action — Inngest is preferred for retry safety), call `stripe.customers.create({ email, name, metadata: { profile_id } })`. Store the returned `cus_...` ID in `client_profiles.stripe_customer_id` (column already exists per `CLAUDE.md`).
  - **Idempotency**: customer creation must be idempotent — if `stripe_customer_id` is already set, do nothing. Use Stripe's idempotency key support keyed off `profile_id`.
  - **Payment methods**: client adds a payment method via Stripe Setup Intents (used in B7-01 onboarding + a `/client/settings/billing` page). Cards are tokenized client-side via Stripe.js; server stores nothing card-related except the Stripe payment method ID. Default payment method tracked via Stripe's customer object.
  - **Webhook endpoint**: `app/api/webhooks/stripe/route.ts` verifies signature, then routes events to handlers in `src/lib/stripe/webhooks/`. Phase B handlers: `customer.subscription.created/updated/deleted` (B3-02), `invoice.paid/payment_failed` (B3-03, B3-05), `setup_intent.succeeded` (B7-01). All other events log and 200.
  - **Webhook idempotency**: every webhook event ID is recorded in a `stripe_webhook_events` table on receipt; duplicates are no-ops.
  - **Test mode toggle**: respect `STRIPE_TEST_MODE` env flag for local dev; admin dashboard shows a banner when test mode is active.
- **Schema work:**
  - Migration: `stripe_webhook_events` table — `id` (Stripe event ID), `type`, `payload` jsonb, `processed_at`, `processing_error`, `created_at`. RLS: admin-only read.
  - `client_profiles.stripe_customer_id` — already present (per Phase A).
- **Dependencies:** None — foundational.
- **Footnotes:** [AR-2] No pricing data hardcoded here; this is plumbing only.
- **Estimated effort:** 2 Code sessions.

---

### B3-02. Subscription management — ✅ Done (May 25, 2026)

- **Why:** Tier 1 and Tier 2 are recurring subscriptions. Without this, neither tier is monetized. Per feature checklist B3-02.
- **What to build:** Create and manage Stripe subscriptions backed by `service_tiers` configuration; sync subscription state into the local DB; expose admin and client surfaces.
- **Done when:**
  - **Stripe product/price sync**: a server-side job (callable from admin "Sync to Stripe" button + auto-triggered when `service_tiers` rows change via B6-02) creates or updates Stripe `Product` and `Price` objects to match each active `service_tiers` row. Map `service_tier.id` ↔ `stripe_product_id` (new column on `service_tiers`).
  - **Subscription creation**: on tier selection in onboarding (B7-01) or via admin "Set subscription" action, `createSubscription({ clientId, tierId, founding_member_discount })` server action:
    - Looks up the client's Stripe customer ID.
    - Creates a `stripe.subscription` with the corresponding price ID; applies the 20% founding-member coupon if `client_profiles.founding_member` is true (coupon auto-created and reused).
    - On success, writes a `client_subscriptions` row mirroring the Stripe subscription state.
  - **Subscription state sync**: `customer.subscription.updated` and `customer.subscription.deleted` webhooks update `client_subscriptions.status` and dates. Status maps directly from Stripe: `active`, `past_due`, `canceled`, `unpaid`, `trialing`, etc.
  - **Tier change with proration**: `changeSubscriptionTier({ clientId, newTierId })` calls `stripe.subscriptions.update(id, { items: [...], proration_behavior: 'create_prorations' })`. New tier applies immediately; proration credit/charge shows on next invoice.
  - **Cancellation**: client can cancel from `/client/settings/billing`; sets `cancel_at_period_end = true` on the Stripe subscription. Admin can hard-cancel via `/admin/clients/[id]`.
  - **Admin surface** on `/admin/clients/[id]`: current subscription card (tier name, status, next renewal date, MRR contribution) + "Change tier" action + "Cancel subscription" action.
  - **Grandfathering**: subscription is locked to the Stripe price ID it was created with. If a tier's price changes via B6-02, existing subscriptions keep their original price unless admin explicitly migrates them. This is automatic — Stripe price IDs are immutable, so admin price edits create a new `Price` and existing subscriptions point at the old one.
- **Schema work:**
  - Migration: `client_subscriptions` table — `id`, `client_id`, `service_tier_id`, `stripe_subscription_id`, `stripe_price_id`, `status` enum, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `canceled_at`, `founding_member_discount_applied`, `created_at`, `updated_at`. RLS: client sees own, admin all.
  - `service_tiers.stripe_product_id` and `service_tiers.stripe_price_id_current` columns.
- **Dependencies:** B3-01, B6-02 (the tier-config UI).
- **Footnotes:** [AR-2] Working-assumption prices in `service_tiers` get synced to Stripe automatically.
- **Estimated effort:** 2.5 Code sessions.

---

### B3-03. Per-request billing (Tier 3) — ✅ Done (May 25, 2026)

- **Why:** On-demand requests (B2-02) created orders with a `total_cents` estimate but no actual charge mechanism. Without this, Tier 3 is free. Per feature checklist B3-03.
- **What to build:** Convert on-demand orders into Stripe invoices/charges with admin-configurable timing.
- **Done when:**
  - **Billing trigger choice** (admin-configurable per tier via B6-02): `bill_on_delivery` (default) or `bill_monthly_rollup` (sum delivered orders monthly). Stored as `service_tiers.tier3_billing_mode`.
  - **Bill on delivery path**: when an order with `order_type = 'on_demand_item'` transitions to `delivered`, an Inngest function `bill-on-demand-order` runs:
    - Computes final amount: server-side recompute from `service_tiers` pricing fields (base + per-item × count + rush premium if `is_rush`) minus founding-member discount.
    - Creates a Stripe invoice with one line item per order item plus separate lines for surcharges. Auto-finalizes and charges the default payment method.
    - On success, marks order `paid_at` (new column) and stores `stripe_invoice_id`. On failure, retries via Inngest; after 3 failures, admin gets a `payment_failed` notification.
  - **Monthly rollup path**: a scheduled Inngest function `monthly-tier3-rollup` runs at 02:00 UTC on the 1st of each month; finds clients whose tier has `bill_monthly_rollup`; creates a single invoice per client summing all delivered-and-unpaid orders from the previous month.
  - **Cost preview on B2-02**: already pulls from `service_tiers`; this task just makes the preview match the actual charge by sharing the same `computeOnDemandPrice(order, tier)` helper between preview and billing.
  - **Refunds**: admin can refund a charged order from `/admin/orders/[id]` (cancellation flow). Refund creates a Stripe refund, marks `refunded_at`, writes `order_status_history`.
- **Schema work:**
  - Migration: `orders.stripe_invoice_id`, `orders.paid_at`, `orders.refunded_at`, `orders.is_rush` (bool — used by B2-02 cost preview already; column may need to be added).
  - Migration: `service_tiers.tier3_billing_mode` enum (`on_delivery` | `monthly_rollup`).
- **Dependencies:** B3-01, B2-02, B2-03.
- **Footnotes:** [AR-2] All amount calculations come from `service_tiers`; no hardcoded values.
- **Estimated effort:** 2 Code sessions.

---

### B3-04. Admin pricing configuration — ✅ Done (May 25, 2026)

- **Why:** Lets the founder change every pricing number without code or DB access. Per feature checklist B3-04. Closely related to B6-02 (full tier CRUD) — B3-04 is the price-fields subset that B6-02 builds on.
- **What to build:** An admin form on `/admin/settings/pricing` (or as a section inside B6-02's tier CRUD page) that exposes every pricing field on `service_tiers` and pre-fills with current values.
- **Done when:**
  - **Per-tier fields**: monthly subscription price (Tier 1, 2); per-request base fee, per-item surcharge, rush premium %, rush lead-time threshold (Tier 3); founding member discount %; minimum lead time (hours).
  - **Form validation**: all amounts in cents stored as integers; UI accepts dollars with two-decimal precision; rejected if negative or non-numeric.
  - **Save action**: `adminUpdatePricing({ tierId, fields })` server action; on save, if any price field changed for a subscription tier, a new Stripe `Price` is created and `service_tiers.stripe_price_id_current` is repointed. Existing subscriptions keep their old price (grandfathering — see B3-02).
  - **Preview impact**: before save, show "This will create a new Stripe price. Existing subscribers will keep their current price unless you migrate them." with a "Migrate all" override (admin can force-update all active subscriptions to the new price).
  - **Audit**: every pricing change writes to a `pricing_change_log` table — admin profile, fields changed, before/after values, timestamp. Used in B6-05 audit trail.
- **Schema work:**
  - Migration: `pricing_change_log` — `id`, `service_tier_id`, `actor_profile_id`, `field`, `before_value`, `after_value`, `created_at`. RLS: admin-only.
- **Dependencies:** B3-01, B6-02 (this is logically part of B6-02 but called out separately because pricing changes have payment-side consequences).
- **Footnotes:** [AR-2] This surface is the canonical way to update the working-assumption pricing once research validates real numbers.
- **Estimated effort:** 1 Code session (after B6-02 exists).

---

### B4-01. Email notifications via Resend — ✅ Done (May 25, 2026)

- **Why:** Proactive communication is what makes the platform feel like a concierge. Per feature checklist B4-01 and blueprint Section 2.3 ("Proactive notifications rather than requiring the client to check status").
- **What to build:** Resend-backed email service with branded HTML templates, triggered from the order lifecycle and payment events.
- **Done when:**
  - **Resend client**: `src/lib/email/client.ts` exports a configured Resend SDK instance. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars.
  - **Template system**: `src/lib/email/templates/` holds typed template builders. Each template is a function `(props) => { subject, html, text }`. Built using `react-email` components for live preview during dev. Layout component provides LLV-branded header (Obsidian background, Cormorant logotype), gold-accent dividers, Ivory body, footer with unsubscribe link and physical address (CAN-SPAM requirement).
  - **Phase B templates**:
    - `order-confirmation.tsx` — sent on `requested` → `confirmed`.
    - `order-status-changed.tsx` — sent on `dispatched_to_provider`, `in_preparation`, `shipped`, `delivered`, `return_initiated`, `return_received`. One template parameterized by status with status-specific copy.
    - `delivery-scheduled.tsx` — sent when `confirmed_delivery_date` is set.
    - `payment-receipt.tsx` — sent on `invoice.paid` webhook for both subscription and per-request charges.
    - `payment-failed.tsx` — sent on `invoice.payment_failed`; includes "Update payment method" CTA.
    - `seasonal-rotation-reminder.tsx` — wired in B4-04 (Sprint B3); template exists so B4-01 can ship complete.
  - **Send mechanism**: every send goes through `sendEmail({ to, template, props })` server function which (a) checks client notification preferences (B7-04 column already added: `client_profiles.email_notifications` jsonb), (b) enqueues via Inngest for retry safety, (c) logs to `email_sends` table.
  - **Unsubscribe**: every email has a one-click unsubscribe link → `/unsubscribe/[token]` page → toggles the relevant preference off. Transactional emails (payment receipts) cannot be unsubscribed — per CAN-SPAM, only marketing emails can be opted out; payment receipts are explicitly transactional.
  - **Dev mode**: when `RESEND_DEV_MODE=true`, emails are written to a `dev_email_inbox` table instead of sent. Admin route `/admin/dev/emails` renders them for QA.
- **Schema work:**
  - Migration: `email_sends` table — `id`, `recipient_profile_id`, `template_name`, `subject`, `to_address`, `status` enum (`queued`, `sent`, `failed`, `bounced`), `resend_id`, `created_at`, `sent_at`, `error_message`. RLS: admin read.
  - Migration: `dev_email_inbox` (dev only — gated by env at query time) — `id`, `recipient`, `subject`, `html`, `text`, `created_at`.
  - Migration: `client_profiles.email_notifications` jsonb (default `{"order_updates": true, "delivery_notices": true, "payment": true, "seasonal_reminders": true}`).
- **Dependencies:** B2-03 (order lifecycle triggers most templates), B3-01/02/03 (payment templates).
- **Footnotes:** Stack is Resend (per blueprint Section 5 — ratified May 25, 2026).
- **Estimated effort:** 2.5 Code sessions.

---

### B4-02. In-app notification center — ✅ Done (May 25, 2026)

- **Why:** Not every notification needs an email, and clients want a single place to catch up. Per feature checklist B4-02.
- **What to build:** A notification bell in the top nav with unread count, a notification panel/drawer, a full notifications page, and a unified write API that both order events and B4-01 emails write through.
- **Done when:**
  - **Bell icon**: in `/client` top nav, shows count of unread notifications (`notifications.read_at IS NULL`). Realtime updates via Supabase Realtime subscription on the `notifications` table.
  - **Notification panel**: clicking the bell opens a Shadcn dropdown/sheet with the most recent 10 notifications. Each notification: icon (matching type), title, snippet, relative time, link target. Click marks read and navigates.
  - **Full page**: `/client/notifications` with infinite scroll, filter by type (orders / payments / concierge / system / all), mark-all-read action.
  - **Admin equivalent**: `/admin/notifications` with cross-client view filtered to admin-relevant events (new orders, payment failures, provider declines, concierge messages).
  - **Write API**: `createNotification({ recipientProfileId, type, title, snippet, linkTarget, metadata })` server function. Called everywhere `sendEmail()` is called (often in pairs — B4-01 email + B4-02 in-app); B4-01's `sendEmail()` calls this automatically based on `client_profiles.email_notifications` preferences (in-app even if email is off, unless explicitly disabled).
  - **Persistent**: notifications never auto-delete; admin can purge in B6-05 audit trail tooling if needed.
- **Schema work:**
  - Migration: `notifications` table — `id`, `recipient_profile_id`, `type` enum (`order_confirmed`, `order_status_changed`, `payment_succeeded`, `payment_failed`, `concierge_reply`, `provider_assignment_declined`, `system`), `title`, `snippet`, `link_target`, `metadata` jsonb, `read_at` nullable, `created_at`. RLS: recipient sees own.
- **Dependencies:** B4-01 (same write moments).
- **Footnotes:** Supabase Realtime is already in use for other features; reuse the existing client subscription pattern.
- **Estimated effort:** 2 Code sessions.

---

### B5-01. Provider order queue — ✅ Done (May 25, 2026)

- **Why:** Phase A built only the provider landing page. This makes the provider portal actually useful. Per feature checklist B5-01.
- **What to build:** Provider-facing `/provider` upgrade from a static landing page to an active workspace showing assigned orders, with full context and accept/decline actions.
- **Done when:**
  - **Queue view** on `/provider`: list of assigned orders from `provider_order_assignments` joined to `orders` and `order_items`. Default sort: by `delivery_deadline` ascending. Status badges. Empty state for new providers.
  - **Filters**: by status (`pending_acceptance`, `accepted_and_active`, `completed`), by deadline (overdue, today, this week, later).
  - **Order detail view** on `/provider/orders/[id]`: photos of every item (full-size, swipeable), item-level prep instructions (from `order_items.notes` plus the assignment-level `prep_instructions`), pickup/delivery dates, declared value totals, current status. **Hides client name, contact info, and address** (per [AR-3]) — shows only the corridor endpoint label (e.g., "Pickup: AZ corridor, Scottsdale storage; Deliver: AZ corridor, Paradise Valley residence").
  - **Accept/Decline actions** (only when assignment is `pending_acceptance`):
    - **Accept**: sets `provider_order_assignments.provider_response = 'accepted'`. No status change to the order itself yet — that happens when the provider marks "received" in B5-02.
    - **Decline**: requires a reason; sets `provider_response = 'declined'`; order returns to `confirmed` status; admin gets in-app notification + email.
  - **Photo upload affordance**: visible during B5-02 status-update steps; not on the queue itself.
  - **Mobile-first**: providers will mostly use phones/tablets at intake; layout optimizes for that.
  - **Auth**: existing `/provider` route group middleware gates access; providers are linked via `providers.profile_id`.
- **Schema work:** None new (uses `provider_order_assignments` from B2-04).
- **Dependencies:** B2-04 (creates the assignment rows this surfaces).
- **Footnotes:** [AR-3] Client PII deliberately hidden.
- **Estimated effort:** 2 Code sessions.

---

### B5-02. Provider status updates — ✅ Done (May 25, 2026)

- **Why:** Provider needs to communicate progress through the service stages. Each update flows back to admin and (filtered) to the client. Per feature checklist B5-02.
- **What to build:** Provider-facing status transitions on order items with optional photo upload, mapped to the order lifecycle.
- **Done when:**
  - **Provider service stages**: `received` → `cleaning` → `pressing` → `ready_for_pickup`. Stored as `provider_service_stage` enum.
  - **Per-item granularity**: each `order_items` row tracks its own `provider_service_stage` (some items may be ready before others). Order-level status (`in_preparation`) is computed from item-level stages: when all items reach `received`, the order auto-transitions `dispatched_to_provider` → `in_preparation`; when all items reach `ready_for_pickup`, admin is prompted to transition `in_preparation` → `shipped` (admin still manually generates label per B2-05).
  - **Status transition UI** on `/provider/orders/[id]`: each item card has the current stage + a "Mark next stage" button with optional notes and optional photo upload (uses Phase A storage abstraction; photos go to `item-photos` with a `photoType = 'provider_service'` tag and link to the order via `item_photos.related_order_id` — new column).
  - **Client-side filtering**: clients see order status at the order level only — they don't see per-item provider stages (per the luxury experience principle: "We're preparing your wardrobe," not "Garment 4 of 12 is in pressing"). Client notifications fire only on order-level transitions (`in_preparation`, `shipped`).
  - **Admin gets all detail**: `/admin/orders/[id]` shows per-item provider stage updates as a sub-timeline.
  - **Damage flagging**: if provider notes contain a damage flag (checkbox on the form), admin is notified immediately via B4-02 with order context. Damage handling itself is operational (not platform-encoded).
- **Schema work:**
  - Migration: `provider_service_stage` enum and `order_items.provider_service_stage` column (default `null` until provider receives).
  - Migration: `order_items.provider_notes`, `order_items.damage_flagged` (bool).
  - Migration: `item_photos.related_order_id` nullable FK.
  - Migration: `item_photos.photo_type` enum extension to include `provider_service` (currently has `intake`, `gallery`, `condition` — add `provider_service`).
- **Dependencies:** B5-01 (queue), B4-01/B4-02 (notification triggers).
- **Footnotes:** Damage flag → admin notification path is the platform's seam to the [AR-4] insurance flow.
- **Estimated effort:** 2 Code sessions.

---

### B6-02. Service tier & pricing config — ✅ Done (May 25, 2026)

- **Why:** The founder needs to configure tiers (name, description, what's included, billing cycle) without involving Code. Per feature checklist B6-02.
- **What to build:** Admin CRUD UI for `service_tiers` covering everything except the raw price fields handled in B3-04 (which lives inside this same surface as a section).
- **Done when:**
  - **List view** on `/admin/settings/tiers`: every active and inactive `service_tiers` row with name, type (subscription/on-demand), monthly or per-request price, status (active/inactive), subscriber count.
  - **Create/edit form**: name, description (rich text, Cormorant-rendered in client preview), tier type (`subscription` | `on_demand`), billing cycle (monthly/annual/none-for-on-demand), included services (multi-select from `service_type` enum), add-on options (free-text list — each becomes a labeled boolean during onboarding), display sort order, active flag, founding-member-eligible flag. Plus the pricing-field section from B3-04.
  - **Live preview**: side-by-side preview of how the tier card will render on the onboarding tier-comparison page (B7-01).
  - **Deactivate behavior**: setting `active = false` removes the tier from new-subscription selection but does not touch existing subscriptions. Reactivating re-exposes it.
  - **Delete protection**: tiers with active subscriptions cannot be hard-deleted; admin sees "deactivate instead" UI. Tiers with zero subscriptions can be deleted with confirmation.
  - **Grandfathering shown explicitly**: each tier's edit page surfaces the count of existing subscribers on each historical Stripe price ID, with a "Migrate to current price" button per group.
- **Schema work:**
  - Migration: `service_tiers.tier_type` enum (`subscription`, `on_demand`), `service_tiers.billing_cycle` enum (`monthly`, `annual`, `none`), `service_tiers.included_services` (service_type[]), `service_tiers.addon_options` (jsonb), `service_tiers.founding_member_eligible` bool. Most of `service_tiers` schema already added in B2-02; this fills gaps.
- **Dependencies:** B2-02 (created `service_tiers`), B3-02 (subscription Stripe sync).
- **Footnotes:** [AR-2] This is the canonical tier-config surface that the assumptions register Item 2 routes through.
- **Estimated effort:** 2 Code sessions.

---

### B6-03. Corridor management — ✅ Done (May 25, 2026)

- **Why:** WI-AZ is the pilot. The data model must support adding WI-FL, NY-AZ, PNW-CA, etc., as pure data — no code change. Per feature checklist B6-03 and blueprint Section 4 (Bi-directional corridor model).
- **What to build:** A `corridors` table + admin CRUD UI + refactor of existing location/region usage to consume corridor data instead of hardcoded WI/AZ assumptions.
- **Done when:**
  - **Schema**: `corridors` table — `id`, `slug` (e.g., `wi_az`), `display_name` (e.g., "Wisconsin ↔ Arizona"), `origin_region_code` (e.g., `WI`), `destination_region_code` (e.g., `AZ`), `active`, `fall_transition_start_date`, `fall_transition_end_date`, `spring_transition_start_date`, `spring_transition_end_date`, `sort_order`. Pre-seed the WI-AZ row matching current platform assumptions.
  - **Provider linkage**: `provider_corridors` join table — `provider_id`, `corridor_id`, `corridor_role` enum (`origin_provider`, `destination_provider`, `both`). B2-04 provider assignment uses this to filter providers eligible for a given order's corridor.
  - **Admin CRUD** at `/admin/settings/corridors`: create new corridor, edit dates, activate/deactivate, assign providers from the provider roster. Cannot deactivate a corridor with active orders.
  - **Refactor**: any code currently assuming WI/AZ specifically (region labels, seasonal date defaults in B2-01, address-region inference) reads from `corridors` instead. The `item_location` enum stays as-is for the pilot — Phase C will generalize to `corridor_id + location_role` if a second corridor activates.
  - **Order-level corridor inference**: when a `seasonal_rotation` order is created (B2-01), the system infers the corridor from `from_location` and `to_address` region codes. Stored on `orders.corridor_id` for queryability.
  - **Reporting hook**: B6-04 (Sprint B3) will pivot revenue/order metrics by corridor.
- **Schema work:**
  - Migration: `corridors` and `provider_corridors` tables (above).
  - Migration: `orders.corridor_id` nullable FK, populated on create.
  - Migration: `addresses.region_code` text (extracted from state where present) so corridor inference is consistent.
- **Dependencies:** B6-01 (admin order surface for filter), B2-01/B2-04 (corridor inference at create/assign time).
- **Footnotes:** [AR-1] WI providers join the pilot WI-AZ corridor; new corridors require no code change.
- **Estimated effort:** 2 Code sessions.

---

### B7-01. Enhanced onboarding with tier selection & payment — ✅ Done (May 25, 2026)

- **Why:** Phase A's 4-step onboarding ends without a tier or payment. Phase B gates the client dashboard behind an active subscription. Per feature checklist B7-01.
- **What to build:** Extend the onboarding stepper to include tier comparison, founding-member callout, payment method collection, and subscription activation. Until completion, middleware blocks `/client/*` except onboarding routes.
- **Done when:**
  - **Stepper expansion**: existing 4 steps (profile basics, primary address, seasonal address, tier placeholder) replaced by 6 steps: (1) profile basics, (2) primary address, (3) seasonal address, (4) tier comparison & selection, (5) payment method, (6) review & activate.
  - **Step 4 — Tier comparison**: pulls active tiers from `service_tiers` (excluding `tier_type = on_demand` since Tier 3 is opt-in per-request rather than picked at onboarding, but tier-3 access is included with subscription tiers — make this explicit in copy). Renders each tier as a Cormorant-headed card with description, what's included, price (founding-member discount applied if applicable), and "Select" button. Tier 3 listed separately as "Also included: on-demand requests at member rates" with link to a tier-3 details modal.
  - **Step 5 — Payment method**: Stripe Setup Intent flow. Client enters card via Stripe Elements; server creates SetupIntent, client confirms, payment method attached to the Stripe customer. Save defaults the payment method.
  - **Step 6 — Review & activate**: shows selected tier, billing cycle, first-payment amount + date, payment method (last 4), and a "Confirm & start membership" CTA. On confirm: server creates the subscription (B3-02), marks `client_profiles.onboarding_complete = true` and `client_profiles.subscription_active = true`, redirects to `/client`.
  - **Founding member flow**: if `client_profiles.founding_member` is pre-set by admin (admin tags clients as founding members in `/admin/clients/[id]`), the tier comparison shows a banner ("Welcome, founding member — your first 12 months are 20% off") and pricing reflects the discount automatically.
  - **Middleware gating**: middleware blocks `/client/*` (except `/client/onboarding/*`) when `onboarding_complete = false` or `subscription_active = false`. Already partially in place from Phase A; extend the predicate.
  - **Abandoned-cart recovery (light)**: if a client reaches step 4 but doesn't complete step 6 within 24 hours, send an email via B4-01 (`onboarding-resume.tsx` template) with a deep link back to step 4.
- **Schema work:**
  - Migration: `client_profiles.subscription_active` (bool, default false). The `onboarding_complete` field already exists.
- **Dependencies:** B3-01 (Stripe), B3-02 (subscriptions), B6-02 (tier source data), B4-01 (resume email).
- **Footnotes:** [AR-2] Tier pricing flows from `service_tiers`; [AR-10] founding-member flag drives discount.
- **Estimated effort:** 3 Code sessions.

---

### B7-02. Client dashboard redesign — ✅ Done (May 25, 2026)

- **Why:** Phase A's `/client` dashboard is functional but feels like a logistics readout. Phase B elevates it to a concierge surface. Per feature checklist B7-02 and blueprint Section 2.3.
- **What to build:** Replace the Phase A dashboard layout with a luxury composition built on the design-system primitives, surfacing the things a client actually wants to see in one glance.
- **Done when:**
  - **Hero section**: personalized greeting (Cormorant, "Good afternoon, Eleanor"), current corridor status sentence ("Your Scottsdale residence is ready — 47 items in storage, 12 on rotation"), primary CTA ("Browse my wardrobe").
  - **Active orders card**: up to 3 active orders with status badge, item count, destination, expected delivery date. "View all orders" link.
  - **Next scheduled rotation card**: if a seasonal rotation is scheduled or upcoming based on corridor dates (B6-03), surface it here with date and item count. If none scheduled and the corridor's seasonal date is within 30 days, surface a "Start your fall rotation" CTA → B2-01.
  - **Wardrobe summary card**: items by location, presented as a small horizontal bar or pill row using `<Mono>` for counts. Click → catalog filtered to that location.
  - **Recent activity feed**: last 5 notifications (deduped with B4-02), photographic where applicable. Click into source.
  - **Quick actions row**: Browse wardrobe / Request an item / Contact concierge / Manage subscription. Big tap targets, design-system primary buttons.
  - **Concierge module**: persistent "Message your concierge" footer or floating action button across all client routes; reuses Phase A `concierge_messages` table.
  - **Empty states**: every card has a concierge-toned empty state copy (e.g., "No active orders — when your wardrobe needs to move, request a rotation").
  - **Mobile composition**: cards stack; quick actions become an icon-row strip.
  - **Performance**: dashboard server-rendered, all data fetched in one server-component pass with parallel awaits.
- **Schema work:** None.
- **Dependencies:** All Sprint B1 features (orders, catalog, notifications), B4-02, B6-03 (corridor dates for next-rotation), Phase A typography primitives.
- **Footnotes:** [AR-10] Founding members get a small "Founding Member" pill in the hero.
- **Estimated effort:** 2 Code sessions.

---

## Sprint B3 — Polish, Analytics & Nice-to-Have (detailed tasks)

Sprint B3 finishes the launch-ready feature set: client account surfaces (history, settings, billing), the return half of the order lifecycle, the admin analytics + audit layer, the second-pass notification controls, the provider messaging surface, and the outfit builder. 11 features total. **B1-05 (wardrobe analytics) is a nice-to-have for launch — pick it up only if Sprint B3 has room.**

Sequenced in the founder-specified build order (founder paste, May 25, 2026):

1. **B7-03** — Client order history (foundation surface used by B3-05 and B2-06)
2. **B7-04** — Client settings & preferences (host for B4-03's per-type toggles + B3-05 default payment method UI)
3. **B3-05** — Billing history & invoices (depends on B7-04's billing settings host page)
4. **B2-06** — Return flow (closes the order lifecycle that B2-03 stubbed out)
5. **B6-04** — Reporting & analytics (admin operational reporting)
6. **B6-05** — Audit trail (cross-cutting; many tables already write to it via earlier tasks)
7. **B4-03** — Admin notification triggers (depends on B4-01 templates + B4-02 in-app + the `email_sends`/`notifications` plumbing)
8. **B4-04** — Seasonal rotation reminders (uses B4-03's send-to-all infrastructure + Inngest scheduled jobs)
9. **B5-03** — Provider messaging (extends the Phase A `concierge_messages` table with provider author + order context)
10. **B1-04** — Outfit builder (last by sequence because it's a client polish feature, not launch-critical)
11. **B1-05** *(nice-to-have)* — Wardrobe analytics (skip if behind schedule)

---

### B7-03. Client order history — ✅ Done (May 25, 2026)

- **Why:** Sprint B1 shipped `/client/orders` with current/active orders. Phase B closes the loop with full historical visibility so clients can audit what they've requested, when, what it cost, and what items were involved. Per feature checklist B7-03.
- **What to build:** Upgrade `/client/orders` to be the canonical history surface, plus a per-order PDF/print view for record-keeping.
- **Done when:**
  - **Filters**: order type (seasonal rotation / on-demand / return), status (multi-select including terminal states `delivered`, `cancelled`, `return_received`), date range (preset chips: last 30 days, last 90, last 12 months, all-time, custom), and a "show cancelled" toggle (default off so the surface stays clean).
  - **Sort**: most recent first (default), oldest first, total cost descending.
  - **Row composition**: order type label + status badge + item count + from→to + requested date + delivered date + total cost (if Tier 3) + a small horizontal strip of up to 4 item thumbnails with `+N more` overflow.
  - **Detail view reuse**: row click opens the existing `/client/orders/[id]` page (B2-03) — no separate history detail page.
  - **Printable summary**: each detail page gets a "Print summary" action that renders a clean print-stylesheet version (Cormorant-headed, full item list with photos, condition history at delivery, payment line items if Tier 3). Uses the existing typography primitives.
  - **Empty states**: distinct copy for (a) no orders ever and (b) filter returns nothing.
  - **Performance**: paginated server-side at 25 rows per page; cursor-based pagination on `orders.created_at`. RLS enforced; client sees only own orders.
- **Schema work:** None (uses B2-01's `orders`, `order_items`, `order_status_history`).
- **Dependencies:** B2-01/02/03 (Sprint B1, complete). B3-03 (Sprint B2, must ship before total-cost-by-period is meaningful).
- **Footnotes:** Builds the surface that B3-05's billing history complements — same table, different lens.
- **Estimated effort:** 1.5 Code sessions.

---

### B7-04. Client settings & preferences — ✅ Done (May 25, 2026)

- **Why:** Every Phase B feature that touches the client (payments, notifications, addresses, communication) needs a single self-service settings home. Per feature checklist B7-04.
- **What to build:** `/client/settings` with sub-pages for billing, notifications, addresses, account.
- **Done when:**
  - **Layout**: `/client/settings` page with a left-rail of sub-pages (responsive: tabs on mobile, vertical nav on desktop using design-system primitives). Sub-pages: **Billing** (B3-05's host + payment method management), **Notifications**, **Addresses**, **Account**.
  - **Billing sub-page** (`/client/settings/billing`):
    - **Payment methods**: list cards stored on the Stripe customer via the Stripe API. Default badge on the default method. Actions: Add (opens Stripe Setup Intent flow reused from B7-01), Set default, Remove (blocked if it's the only method on an active subscription).
    - **Active subscription card**: tier name, billing cycle, next renewal, MRR contribution, "Manage subscription" CTA → tier change or cancel (writes to Stripe via B3-02 server actions).
    - **Billing history host**: B3-05 renders inside this sub-page (see B3-05 spec).
  - **Notifications sub-page** (`/client/settings/notifications`):
    - Two columns: **Email** and **In-app**.
    - Rows: Order updates, Delivery notices, Payment confirmations, Seasonal reminders (Tier 1/2 only — hide row if client's subscription is on-demand-only), Concierge replies.
    - Each cell is a toggle. Reads/writes `client_profiles.email_notifications` (jsonb, already added in B4-01) and a new `client_profiles.in_app_notifications` (jsonb mirror).
    - Toggle-off for "Payment confirmations" disabled with tooltip ("Payment receipts are required for tax records and cannot be disabled").
  - **Addresses sub-page** (`/client/settings/addresses`):
    - Reuses Phase A address-management component on a settings-styled host.
    - Adds **"Default delivery address"** selector — sets `client_profiles.default_delivery_address_id`. Pre-selected by B2-01/B2-02 request flows.
  - **Account sub-page** (`/client/settings/account`):
    - Read-only profile basics (name, email, phone, member since, founding-member badge if applicable).
    - **Communication preferences**: preferred channel (email / phone / SMS / in-app only) — single-select. Stored as `client_profiles.preferred_channel` enum.
    - **Sign out everywhere** action (revokes all sessions via Supabase).
    - **Delete account** action — soft delete only at this stage (sets `profiles.deleted_at`, anonymizes PII, retains order history for compliance); admin gets notified; one-week grace period before hard-delete via a scheduled Inngest job.
- **Schema work:**
  - Migration: `client_profiles.in_app_notifications` jsonb (default same shape as email_notifications).
  - Migration: `client_profiles.default_delivery_address_id` nullable FK to `addresses.id`.
  - Migration: `client_profiles.preferred_channel` enum (`email`, `phone`, `sms`, `in_app`); default `email`.
  - Migration: `profiles.deleted_at` timestamp (soft delete).
- **Dependencies:** B3-01 (Stripe), B3-02 (subscription management), B4-01/B4-02 (notification plumbing), Phase A addresses.
- **Footnotes:** [AR-4] Communication preferences + addresses inform insurance and shipping defaults.
- **Estimated effort:** 2.5 Code sessions.

---

### B3-05. Billing history & invoices — ✅ Done (May 25, 2026)

- **Why:** Clients (and the IRS) need a record of every charge. Admin needs revenue visibility. Per feature checklist B3-05.
- **What to build:** Client-side billing-history list + downloadable Stripe invoices, plus an admin all-transactions surface.
- **Done when:**
  - **Client billing history** renders inside `/client/settings/billing`:
    - Table with: date, description (subscription renewal — Tier name / on-demand order #SKU / refund), amount, status (paid / pending / failed / refunded), and a "Download invoice" link.
    - Source: Stripe invoices retrieved via `stripe.invoices.list({ customer: stripe_customer_id })` server-side; cached in a local `billing_history_cache` table for fast list rendering (refreshed on `invoice.*` webhooks). Each row links to the underlying `orders` row when relevant (`subscription_renewal` rows do not have an order).
    - **Download invoice**: server action fetches `stripe.invoices.retrieve(id).invoice_pdf` URL and either streams the PDF or redirects to Stripe's hosted PDF. Stripe-generated PDFs are pre-branded if the Stripe account brand settings (logo, color) are configured — admin sets these out-of-band during B3-01.
    - **Filter**: date range, status, type (subscription/on-demand/refund).
  - **Admin all-transactions** at `/admin/transactions`:
    - Same table shape but cross-client, with client name + email as additional columns, and filters by client.
    - Bulk CSV export of filtered rows (uses the same CSV export helper that B6-04 builds — wire that dependency).
    - Reconciliation marker: each row shows whether the associated `orders.paid_at` exists (for sanity-checking that local order state matches Stripe's invoice ledger).
- **Schema work:**
  - Migration: `billing_history_cache` — `id`, `stripe_invoice_id`, `client_id`, `order_id` nullable, `amount_cents`, `currency`, `status`, `description`, `invoice_pdf_url`, `invoiced_at`, `paid_at`, `refunded_at`, `created_at`, `updated_at`. RLS: client sees own, admin all. Webhook handlers (B3-01) keep this in sync.
- **Dependencies:** B3-01 (webhooks update cache), B3-02 (subscription invoices), B3-03 (per-request invoices), B7-04 (billing settings host).
- **Footnotes:** Stripe-generated PDFs satisfy LLV branding via the Stripe account-level brand settings.
- **Estimated effort:** 2 Code sessions.

---

### B2-06. Return flow — ✅ Done (May 25, 2026)

- **Why:** Sprint B1 left the order lifecycle hanging at `delivered`. Seasonal rotations need to come back. Per feature checklist B2-06 and the existing `return_initiated` / `return_received` states.
- **What to build:** Client-initiated return flow that creates the return shipment and re-syncs item locations on receipt.
- **Done when:**
  - **Client trigger** on `/client/orders/[id]`: a "Return items" action appears when `order_type = seasonal_rotation` AND `status = delivered`. Tier 3 on-demand orders also get this action with copy adjusted ("Send back when you're done") — same workflow; on-demand returns are optional.
  - **Return flow modal**:
    - **Items**: pre-selects all delivered items; client can deselect items they're keeping (Tier 3 only — seasonal returns must be all-or-nothing per the corridor model assumption).
    - **Return-from address**: pre-selected from the order's `to_address` (where the items currently are); editable.
    - **Pickup date**: client picks when the return shipment can leave. Min lead time configurable per tier.
    - **Notes**: any condition flags the client wants admin/provider aware of (stain, damage, just-cleaned).
  - **Submit action** `clientInitiateReturn`:
    - Transitions order `delivered` → `return_initiated`, writes `order_status_history`.
    - Creates a second `order_shipments` row with `direction = 'return'` (label info entered by admin later — same manual-then-tracked pattern as outbound).
    - Sends B4-01 `return-initiated.tsx` email to client (confirmation) and B4-02 in-app notification to admin.
  - **Admin marks return received** on `/admin/orders/[id]`: button "Mark return received" appears when status is `return_initiated`. Transitions to `return_received`. **On this transition**:
    - For each `order_item`, the system updates the underlying `items.current_location` to a configurable destination location (default: the original storage location at the corridor origin — e.g., `storage_wi` after a `wi_az` rotation returns north). The location is pickable per-item if admin needs to override.
    - Optional: create a fresh `item_conditions` row per item if admin chooses to record condition-on-return (reuse Phase A condition logging UI).
  - **Audit**: every transition + per-item location update is logged in `order_status_history` (order-level) and B6-05's audit trail (per-item updates).
- **Schema work:**
  - Migration: `service_tiers.return_min_lead_hours` (numeric, default 48).
  - Schema reuse: `order_shipments.direction = 'return'` already supported by B2-05.
- **Dependencies:** B2-03 (lifecycle states), B2-05 (shipment table), B4-01/B4-02 (notifications), Phase A `item_conditions`.
- **Footnotes:** [AR-9] Storage location on return defaults to the corridor origin's storage location; configurable per item if WI/AZ storage capacity dynamics shift.
- **Estimated effort:** 2.5 Code sessions.

---

### B6-04. Reporting & analytics — ✅ Done (May 25, 2026)

- **Why:** The founder needs operational visibility to evaluate the pilot. Per feature checklist B6-04 and assumption-register Item 7 (choke-point evaluation requires this data).
- **What to build:** `/admin/reports` dashboard with the metrics the assumption register named, plus CSV export.
- **Done when:**
  - **Page structure**: KPI strip at the top (large numbers), four content panels below, date-range filter that applies to everything.
  - **KPI strip**: Active clients (count), MRR (sum of active subscription monthly equivalents), Per-request revenue (current period), Orders in pipeline (count of non-terminal orders).
  - **Panel 1 — Clients by tier**: stacked horizontal bar with counts and percentages; click a tier to filter the page to that tier's clients.
  - **Panel 2 — Revenue trend**: line chart of subscription revenue + per-request revenue across the selected date range, monthly buckets. Hover tooltips. Use a lightweight chart lib (Recharts is fine; already approved per `package.json` ecosystem) or a custom SVG if the dependency budget is tight.
  - **Panel 3 — Fulfillment performance**: average days from `requested` → `delivered`, per tier, plus a histogram. Also a "% on-time" computed against `requested_delivery_date`.
  - **Panel 4 — Provider performance**: per-provider table — orders completed, average prep time, decline rate, damage flags raised, on-time %. Filterable.
  - **CSV export**: each panel has a "Export CSV" button → downloads the underlying data rows. Plus an admin-wide "Export all transactions" used by B3-05.
  - **Implementation note**: all metrics are server-computed via SQL views or query helpers in `src/lib/queries/reports.ts`. Cached for 5 minutes per date range to avoid hammering Postgres; cache invalidates on any `orders` insert/update.
  - **CSV helper**: `src/lib/csv/export.ts` builds a generic streaming CSV response. Reused by B3-05 and B6-05.
- **Schema work:**
  - Migration: a few read-optimized views — `report_active_subscriptions`, `report_revenue_by_month`, `report_fulfillment_by_tier`, `report_provider_performance`.
- **Dependencies:** B3-02 (subscription state), B3-03 (per-request billing), B2-03 (lifecycle history), B5-02 (provider stage history).
- **Footnotes:** [AR-7] This surface is the evidence base for evaluating Choke Points 3 & 4 post-pilot.
- **Estimated effort:** 3 Code sessions.

---

### B6-05. Audit trail — ✅ Done (May 25, 2026)

- **Why:** Insurance carriers will ask for it. Dispute resolution requires it. Compliance grows easier with it. Per feature checklist B6-05 and assumption-register Item 4 (insurance requires evidentiary records).
- **What to build:** A unified `admin_audit_log` table that captures every admin action, a write helper used by every existing admin server action, and an admin-facing browser.
- **Done when:**
  - **Schema**: `admin_audit_log` table — `id`, `actor_profile_id`, `action_type` (e.g., `order.status_transition`, `order.assign_provider`, `pricing.update`, `client.modify`, `subscription.cancel`, `provider.deactivate`, `item.condition_add`), `entity_type`, `entity_id`, `before` jsonb (snapshot), `after` jsonb (snapshot), `notes`, `ip_address`, `user_agent`, `created_at`. RLS: admin-only read; append-only (no UI for delete or update).
  - **Write helper**: `recordAuditEntry({ actor, actionType, entityType, entityId, before, after, notes })` server function. Called from every admin-mutating server action — Sprint B1 actions (`adminTransitionOrderStatus`, `adminAssignProvider`) are retrofit; Sprint B2 actions (`adminUpdatePricing`, subscription mutations) wire it during their build; Phase A admin item actions (`adminTransitionItemStatus`, `adminAddCondition`) get retrofit in this task.
  - **Browser** at `/admin/audit`:
    - Filter by actor (admin profile), action_type (multi-select), entity_type (multi-select), date range, free-text search across notes/before/after JSON.
    - Table rows: timestamp, actor, action_type label, entity (with link to the entity's detail page where possible), one-line summary of the diff.
    - Row click → expanded diff view (before vs. after JSON, monospaced, color-coded additions/changes).
    - CSV export (uses B6-04's helper).
  - **Pricing-change shortcut**: the existing `pricing_change_log` from B3-04 stays for back-compat but a backfill migration mirrors it into `admin_audit_log`. Going forward, both are written (or `pricing_change_log` is deprecated — choose one in implementation; recommend: deprecate `pricing_change_log` and route everything through `admin_audit_log`).
- **Schema work:**
  - Migration: `admin_audit_log` table.
  - Migration (data): backfill `admin_audit_log` from `pricing_change_log`, `order_status_history` (where actor was an admin), and Phase A `item_conditions` (admin-added rows).
- **Dependencies:** Most Sprint B1/B2 admin actions exist already; this task is largely retrofit plus the browser UI.
- **Footnotes:** [AR-4] Insurance claims path. [AR-7] Operational evidence base.
- **Estimated effort:** 2.5 Code sessions.

---

### B4-03. Admin notification triggers — ✅ Done (May 25, 2026)

- **Why:** Sprint B2 wired the send mechanisms but kept the trigger config in code. This task moves trigger configuration into the admin panel and adds a custom-message broadcaster. Per feature checklist B4-03.
- **What to build:** `/admin/settings/notifications` configuration page + a "Send custom message" flow.
- **Done when:**
  - **Trigger configuration**: a table of every B4-01 template × each delivery channel (email / in-app). Each cell is a toggle:
    - **Enabled** (current default) — system sends.
    - **In-app only** — suppresses email regardless of client preferences.
    - **Disabled globally** — neither sends.
    - Each cell has a "View template" preview link (renders the template with placeholder data).
  - **Per-client override surface**: an admin can also set a per-client suppression (e.g., a client who explicitly asked for fewer emails) — stored on `client_profiles.email_notifications_admin_override` jsonb. Client-side preference (B7-04) wins for opt-out; admin override wins for opt-out further.
  - **Custom broadcast**:
    - "Send a message" form: To (individual client / all clients with tier X / all founding members / all clients), Subject, Body (rich text), Channel (email and/or in-app), Schedule (now / specific time).
    - On submit: validates audience, enqueues via Inngest, writes one `email_sends` and/or `notifications` row per recipient, logs to `admin_audit_log` (B6-05).
    - **Test mode**: "Send to my account only" preview action so admin can verify rendering before broadcasting.
  - **Send log**: list of past broadcasts with recipient count, channels used, success/failure breakdown, click-through if available (Resend webhooks already record opens/clicks).
- **Schema work:**
  - Migration: `notification_template_config` — `id`, `template_name` (matches B4-01 template names), `email_enabled`, `in_app_enabled`, `updated_at`. Seeded with defaults.
  - Migration: `client_profiles.email_notifications_admin_override` jsonb (default `{}`).
  - Migration: `admin_broadcasts` — `id`, `actor_profile_id`, `audience_filter` jsonb, `recipient_count`, `subject`, `body`, `channels` (text[]), `scheduled_for`, `executed_at`, `created_at`.
- **Dependencies:** B4-01 (templates + send pipeline), B4-02 (in-app pipeline), B6-05 (audit logging).
- **Footnotes:** Founding-member outreach (per [AR-10]) will eventually run through this broadcaster.
- **Estimated effort:** 2.5 Code sessions.

---

### B4-04. Seasonal rotation reminders — ✅ Done (May 25, 2026)

- **Why:** The corridor model assumes seasonal triggers. Without proactive reminders, clients miss the rotation window. Per feature checklist B4-04 and blueprint Section 4 (corridor seasonal dates).
- **What to build:** Scheduled Inngest jobs that fire 30/14/7 days before each corridor's seasonal transition dates, personalized per client.
- **Done when:**
  - **Schedule source**: `corridors` table (B6-03) holds `fall_transition_start_date` and `spring_transition_start_date` per corridor. The reminders fire **N days before** each of those dates per corridor.
  - **Configurable lead days**: a new admin setting `seasonal_reminder_lead_days` (text[] default `{30, 14, 7}`) on a global `admin_settings` table (creates the table if not already present from B6-04). Admin can edit (e.g., `{45, 21, 7, 2}`).
  - **Inngest function** `seasonal-rotation-reminders`:
    - Cron: daily at 09:00 in the corridor's destination timezone (per-corridor, since AZ and FL differ from WI).
    - Logic: for each active corridor, compute `(next_transition_date - today)` in days; if the gap matches any of `seasonal_reminder_lead_days`, fan out reminder jobs.
    - Per-client fan-out: for each active client whose current location implies the upcoming transition will affect them (e.g., for the WI→AZ fall transition, clients whose primary location is currently WI), enqueue a `send-seasonal-reminder` job.
    - **Per-client personalization**: each reminder includes (a) the client's item count at the origin location, (b) their destination address, (c) a deep link to start the rotation request (B2-01 prefilled).
  - **Template**: `seasonal-rotation-reminder.tsx` (placeholder stub already ships in B4-01 — fill in here). Cormorant header, item-count call-out, destination address, "Start my rotation" CTA, "Not yet — remind me later" CTA (sets a per-client `next_reminder_at` to suppress future reminders for this transition).
  - **Idempotency**: each (client, transition_date, lead_days) tuple sends at most once; tracked in a `reminder_sends` table.
  - **Respect preferences**: clients with `email_notifications.seasonal_reminders = false` and `in_app_notifications.seasonal_reminders = false` are skipped entirely.
  - **Admin view**: `/admin/reports/reminders` (or section on B4-03 page) showing upcoming reminder fires by corridor and dates, plus a manual "Send now" override per corridor.
- **Schema work:**
  - Migration: `admin_settings` table (single-row key/value, or row-per-setting) — used by this and B4-03.
  - Migration: `reminder_sends` — `id`, `client_id`, `corridor_id`, `transition_date`, `lead_days`, `channels` (text[]), `sent_at`. Unique constraint on `(client_id, corridor_id, transition_date, lead_days)`.
- **Dependencies:** B6-03 (corridor dates), B4-01 (template + send), B4-02 (in-app), B4-03 (broadcaster patterns + audit), Inngest scheduled jobs (already in stack).
- **Footnotes:** [AR-10] These reminders are the platform's primary engagement loop; founding-member retention depends on getting this right.
- **Estimated effort:** 2 Code sessions.

---

### B5-03. Provider messaging — ✅ Done (May 25, 2026)

- **Why:** Providers will hit situations that don't fit the status-update flow (stain found mid-cleaning, item arrived already damaged, capacity issue for the deadline). They need a per-order channel back to admin. Per feature checklist B5-03.
- **What to build:** Extend Phase A's `concierge_messages` table to support provider authorship and order context; surface in admin and provider portals.
- **Done when:**
  - **Schema extension**: `concierge_messages` adds `author_profile_id` (FK to `profiles`, replacing the implicit client-only assumption), `related_order_id` (nullable FK to `orders`), `thread_id` (nullable — groups messages into per-order threads). RLS updates: clients see threads where they are the order's client; providers see threads on orders assigned to them; admin sees all.
  - **Provider compose** on `/provider/orders/[id]`: a "Message admin" panel below the status section. Form: subject (optional — defaults to "Re: Order [SKU]"), message body, optional photo attachment (uses storage abstraction). On submit, creates a `concierge_messages` row with `author_profile_id = provider profile`, `related_order_id = current order`.
  - **Admin inbox** on `/admin/concierge`: existing Phase A queue is extended with a "Source" column (Client / Provider) and a "Related order" column with a deep link. Filter by source. Provider messages display with the provider name and the order context inline (item count, status, deadline).
  - **Threading**: replies in either direction set `thread_id` to the same value so the thread renders chronologically on both sides. Admin replies are visible to providers in their portal under the related order.
  - **Notifications**: provider message → admin gets B4-02 in-app + B4-01 email (if enabled); admin reply → provider gets in-app notification next portal visit.
  - **Damage hand-off**: if `order_items.damage_flagged` was set in B5-02, an auto-created concierge message is opened on the order with subject "Damage flagged — [item SKU]" and the provider's notes prepopulated. This makes the damage trail discoverable without provider re-entering data.
- **Schema work:**
  - Migration: `concierge_messages.author_profile_id`, `related_order_id`, `thread_id`. Update RLS policies.
  - Indexes: on `(related_order_id)` and `(thread_id)`.
- **Dependencies:** Phase A `concierge_messages`, B5-02 (damage flag hand-off), B4-01/B4-02 (notifications).
- **Footnotes:** [AR-3] Provider authorship is permitted but client PII still stays out — provider sees order context, never client name/contact.
- **Estimated effort:** 1.5 Code sessions.

---

### B1-04. Outfit builder — ✅ Done (May 25, 2026)

- **Why:** The Tier 3 promise compresses from "request an evening gown" to "request my Friday-night look in one tap." Per feature checklist B1-04 and blueprint Section 2 (Tier 3 differentiator).
- **What to build:** Client-side outfit grouping + one-action outfit request that fans out into a single on-demand order containing all the outfit's items.
- **Done when:**
  - **Outfit creation**: from `/client/wardrobe`, multi-select items → "Save as outfit" → modal: outfit name (required), occasion tag (optional, free-text or pick from a small enum: `black_tie`, `cocktail`, `business`, `casual`, `weekend`, `travel`), notes.
  - **Outfit list page** `/client/outfits`:
    - Grid of saved outfits with a composite preview (top-left photo of each item layered or a 2×2 grid of the first four items, fallback to a single photo).
    - Each outfit row shows: name, occasion tag, item count, last-requested date.
    - Row actions: View detail, Request outfit, Edit (rename / change items / change occasion), Delete.
  - **Outfit detail page** `/client/outfits/[id]`: full list of items with photos, metadata, current location. Each item is clickable → item detail (B1-03).
  - **"Request outfit" CTA**: opens the B2-02 on-demand request modal pre-filled with all outfit items. From there it's the standard on-demand flow (destination, date, special instructions, cost preview, submit). The resulting order is tagged with `orders.outfit_id` so the order detail (B2-03) shows "From outfit: Friday Night Black Tie."
  - **Outfit composition validation**: warn (don't block) if some outfit items are currently in transit / damaged / unavailable; show inline status badges.
  - **Search integration (B1-02)**: AI search includes outfits in its corpus — a query like "black tie outfit for December gala" can return saved outfits ranked alongside individual items. Outfit results render with the composite preview and a "Request outfit" CTA.
- **Schema work:**
  - Migration: `outfits` — `id`, `client_id`, `name`, `occasion_tag`, `notes`, `created_at`, `updated_at`. RLS: client owns.
  - Migration: `outfit_items` — `id`, `outfit_id`, `item_id`, `sort_order`. RLS inherits.
  - Migration: `orders.outfit_id` nullable FK.
- **Dependencies:** B1-01 (multi-select on catalog), B1-02 (search corpus inclusion), B1-03 (item detail click-through), B2-02 (request modal).
- **Footnotes:** Outfits are a polish feature for launch; if the build slips, deliverable can ship a launch-minus-1-week without blocking the soft launch.
- **Estimated effort:** 2.5 Code sessions.

---

### B1-05. Wardrobe analytics — ⏸️ DEFERRED (May 25, 2026, nice-to-have, post-launch)

- **Why:** Useful for client engagement and self-awareness ("I have 23 cashmere sweaters in WI") but not launch-critical. Per feature checklist B1-05; founder explicitly tagged as nice-to-have for launch.
- **What to build:** A `/client/wardrobe/analytics` page (or a tab within `/client/wardrobe`) with simple, photography-friendly visualizations of the client's own catalog.
- **Done when:**
  - **Total items** — large Cormorant number; subtle breakdown by status (`with_client_*`, `storage_*`, `provider_*`, `in_transit_*`).
  - **Items by category** — horizontal bar with category icons + counts. Click a bar → catalog filtered to that category.
  - **Items by location** — small map-style layout with corridor endpoints (origin / destination / in transit / at provider) and counts.
  - **Most-/least-requested items** — small carousel of the top 5 by order count and the bottom 5 (items never requested), pulled from `order_items` aggregations.
  - **Estimated wardrobe value** — only renders if the client has entered values; sums `items.value_cents` where present, shows "complete N more values to see your total" otherwise.
  - **Date range** — defaults to last 12 months for request-frequency calculations; filterable to lifetime / last 6 months / last 30 days.
  - **Performance**: server-rendered with the same 5-minute cache strategy as B6-04 (per-client cache key). Bumped on order completion.
- **Schema work:** None — pure aggregation over existing tables.
- **Dependencies:** B1-01 (catalog), B6-04 (cache helper, reused).
- **Footnotes:** Tag as deferrable in any sprint-status update if Sprint B3 starts slipping.
- **Estimated effort:** 1.5 Code sessions.

---

## Out of Phase B scope (do not start; listed for traceability)

These belong to Phase C (Polish & Launch Prep, Sep 2026) or post-launch:

- Shipping carrier API integration (B2-05 is manual entry in Phase B; API in Phase C).
- Native mobile app for iOS / Android (blueprint Section 9, future).
- Referral tracking (assumption register Item 10 notes this as Phase C nice-to-have).
- Luxury resale marketplace enablement (Phase 3 expansion roadmap).
- Lifestyle asset logistics (handbags, watches, jewelry — Phase 4).
- Estate and downsizing services (Phase 5).
- Multi-corridor expansion beyond WI-AZ (data model supports it via B6-03; activation is post-launch operational work).

---

## Cross-cutting non-functional requirements

Apply to every Phase B task above:

- **RLS first.** Every query respects row-level security. Never use the admin client from a client-facing route. Re-verify `auth.getUser()` in every server action; derive `client_id` from `user.id`, never from form data.
- **Photography-forward visual design.** Blueprint Section 2.3. Catalog, item detail, dashboard, and order surfaces use generous whitespace, large photo treatments, and the Cormorant Garamond / Inter type pairing via the `<Typography>` primitives.
- **Three-tap maximum.** Any core client task — browse → search → request → confirm — reachable within three interactions from `/client`.
- **Dark/light mode.** All new components support both via the existing theme infrastructure.
- **Accessible.** Base UI primitives provide accessibility — preserve it. Form fields labeled, focus states visible, color contrast WCAG AA.
- **Admin-configurable over hardcoded.** Every price, fee, tier name, corridor definition, lead-time threshold, and provider relationship lives in DB and is editable via admin UI. No hardcoded business values in code.
- **Inngest for anything async.** Background jobs (notifications, scheduled reminders, AI categorization) run via Inngest, not ad-hoc setTimeout or cron. Use `src/lib/inngest/functions/` patterns already established by DI-3.
- **Storage via the abstraction.** All photo reads/writes go through `src/lib/storage/server.ts` (or the client-side helpers in `upload-photo.ts`). No direct `supabase.storage.from(...)` calls outside that module.

---

## Footnote index — assumption-register pointers referenced above

All ten items are **OPEN business decisions** with platform-built working assumptions. The platform is configuration-driven: each can be updated without code changes.

- **[AR-1]** Wisconsin providers — onboard via admin panel. Tasks affected: B6-03 (corridor management surfaces them), B6-01 (assignment).
- **[AR-2]** Pricing & packaging — `service_tiers` table; admin-editable via B6-02; pre-seeded with assumption values. Tasks affected: B2-02 (cost preview), B3-01/02/03 (Stripe sync from DB), B6-02 (CRUD surface), B7-01 (tier selection UI).
- **[AR-3]** Provider partnership terms — vendors, not partners; LLV owns client relationship; provider portal restricts client PII. Tasks affected: B5-01/02 (portal scope), B6-01 (assignment).
- **[AR-4]** Insurance & liability — declared values + condition records support claims; liability caps configurable. Tasks affected: B7-04 (settings), schema (item values, conditions — Phase A).
- **[AR-5]** Daughter's role — AZ corridor manager; role-based admin access already built. Tasks affected: B6-03 (corridor-region admin filtering, eventually).
- **[AR-6]** Capital strategy — self-fund pilot; platform on free/hobby tiers. Tasks affected: none.
- **[AR-7]** Operational choke points — pilot is the proof; B6-04 reporting + B6-05 audit captures the data.
- **[AR-8]** Business entity formation — WI LLC + AZ foreign registration; trademark. Tasks affected: content only (ToS, footer).
- **[AR-9]** WI storage facility — provider-handled first; LLV unit as overflow. Tasks affected: `item_location` enum already supports both; admin updates location string.
- **[AR-10]** Founding member recruitment — `client_profiles.founding_member` flag drives discounting (added in B2-02 schema). Referral tracking deferred to Phase C.

See `docs/strategy/llv_business_strategy_assumptions_register.docx` for the full register with platform-impact details and timelines.

---

*End of Phase B task breakdown. Cowork will update this document when founder revises sprint composition, when assumption-register items resolve, or when Code reports tasks complete. Sprint B2 and B3 features will be expanded into Code-level tasks as B1 wraps.*
