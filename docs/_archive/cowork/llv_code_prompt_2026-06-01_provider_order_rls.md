# Code Prompt — Provider RLS gap: order detail 404s, item counts show 0

**Date:** 2026-06-01
**Severity:** High (blocks the provider workflow even after the provider-auth seed fix)
**Surfaced by:** QA re-verification after Bug #27 (provider auth seed) shipped.

## Symptom
With provider login now working (quick-login as European Couture Cleaners → `/provider` shows the order queue: "Awaiting your response (1)" + "Active orders (2)"), **opening any provider order 404s** (`/provider/orders/<id>` → "This page could not be found"), and every queue card shows **"0 item(s)."** This blocks T7.1 (open order, accept/decline), T7.2 (service-stage updates), T7.3 (damage flag), T7.4 (messaging).

## Root cause
`src/app/(provider)/provider/orders/[id]/page.tsx` loads the assignment (succeeds — `provider_order_assignments` has a provider read policy), then queries `orders` with nested `order_items → items → item_photos`. That query returns `null` → `notFound()`.

RLS audit (`supabase/migrations/`) confirms there are provider policies for `providers`, `provider_order_assignments` (`poa_provider_read` / `poa_provider_update`), and `concierge_messages` — but **no provider SELECT policy on `orders`, `order_items`, `items`, or `item_photos`.** So the provider can list assignments but cannot read the assigned order or its items (which is also why the item count is 0).

## Fix (new migration)
Add RLS SELECT policies letting a provider read the orders they're assigned to, plus the related rows. Reuse the EXISTS pattern already in `poa_provider_read` (`providers p WHERE p.profile_id = auth.uid()`). Specifically:

1. **`orders` — provider SELECT** where an assignment links the order to the current provider:
   ```sql
   CREATE POLICY "orders_provider_read" ON public.orders FOR SELECT TO authenticated
   USING (EXISTS (
     SELECT 1 FROM public.provider_order_assignments poa
     JOIN public.providers p ON p.id = poa.provider_id
     WHERE poa.order_id = orders.id AND p.profile_id = auth.uid()
   ));
   ```
2. **`order_items` — provider SELECT** for those orders (EXISTS on assignment via `order_items.order_id`).
3. **`order_items` — provider UPDATE** for those orders, so providers can set `provider_service_stage`, `provider_notes`, `damage_flagged` (the provider portal stage/damage actions). Scope the USING/WITH CHECK to assigned orders.
4. **`items` — provider SELECT** for items referenced by `order_items` of their assigned orders.
5. **`item_photos` — provider SELECT** for those items (the detail page reads `item_photos`).

Keep client PII out of the provider order query (it already omits it per AR-3). Don't widen beyond assigned orders.

## Verify
- Quick-login as European Couture Cleaners → `/provider` → open the "Awaiting your response" order (#C9892E85): detail page loads (no 404), shows the 3 items, prep instructions, pickup/delivery dates, and Accept/Decline.
- Item counts on the queue cards show the real number (not 0).
- Accept the order, then walk an item through `received → cleaning → pressing → ready_for_pickup`; flag damage on an item (→ admin notified + concierge message created); send a provider message (→ appears in `/admin/concierge` under Provider source with a View-order link).
- Confirm a provider still cannot read orders they are NOT assigned to (direct URL → 404).
- `npm run verify` clean. Add the Bug Fix Cycle entry (#34) to `llv_session_handoff.md`.
