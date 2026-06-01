-- Provider RLS gap: order detail 404s and item count 0
--
-- The provider_order_assignments table already has read/update policies, but
-- providers had no SELECT on orders / order_items / items / item_photos, so:
--   • The nested orders() join on the dashboard returned null → 0 item count
--   • The order detail page hit .single() on orders and got null → notFound()
--
-- Pattern reused from poa_provider_read / poa_provider_update (migration 014):
--   JOIN providers p ON p.id = poa.provider_id WHERE p.profile_id = auth.uid()

-- ── orders ────────────────────────────────────────────────────────────────────

CREATE POLICY "orders_provider_read" ON public.orders
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'provider'
    AND EXISTS (
      SELECT 1
      FROM public.provider_order_assignments poa
      JOIN public.providers p ON p.id = poa.provider_id
      WHERE poa.order_id = orders.id
        AND p.profile_id = auth.uid()
    )
  );

-- ── order_items ───────────────────────────────────────────────────────────────

CREATE POLICY "order_items_provider_read" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'provider'
    AND EXISTS (
      SELECT 1
      FROM public.provider_order_assignments poa
      JOIN public.providers p ON p.id = poa.provider_id
      WHERE poa.order_id = order_items.order_id
        AND p.profile_id = auth.uid()
    )
  );

-- Providers update provider_service_stage, provider_notes, damage_flagged
-- on order_items of their assigned orders (column-level control is in the app).
CREATE POLICY "order_items_provider_update" ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'provider'
    AND EXISTS (
      SELECT 1
      FROM public.provider_order_assignments poa
      JOIN public.providers p ON p.id = poa.provider_id
      WHERE poa.order_id = order_items.order_id
        AND p.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    get_my_role() = 'provider'
    AND EXISTS (
      SELECT 1
      FROM public.provider_order_assignments poa
      JOIN public.providers p ON p.id = poa.provider_id
      WHERE poa.order_id = order_items.order_id
        AND p.profile_id = auth.uid()
    )
  );

-- ── items ─────────────────────────────────────────────────────────────────────

CREATE POLICY "items_provider_read" ON public.items
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'provider'
    AND EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.provider_order_assignments poa ON poa.order_id = oi.order_id
      JOIN public.providers p ON p.id = poa.provider_id
      WHERE oi.item_id = items.id
        AND p.profile_id = auth.uid()
    )
  );

-- ── item_photos ───────────────────────────────────────────────────────────────

CREATE POLICY "item_photos_provider_read" ON public.item_photos
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'provider'
    AND EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.provider_order_assignments poa ON poa.order_id = oi.order_id
      JOIN public.providers p ON p.id = poa.provider_id
      WHERE oi.item_id = item_photos.item_id
        AND p.profile_id = auth.uid()
    )
  );
