-- Sprint B1: Order & Request System foundation
-- Creates order_type, order_status enums and orders / order_items / order_status_history tables.

-- Ensure handle_updated_at() function exists (idempotent)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE order_type AS ENUM (
  'seasonal_rotation',
  'on_demand_item',
  'return'
);

CREATE TYPE order_status AS ENUM (
  'requested',
  'confirmed',
  'dispatched_to_provider',
  'in_preparation',
  'shipped',
  'delivered',
  'return_initiated',
  'return_received',
  'cancelled'
);

-- ── orders ─────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id               uuid        NOT NULL REFERENCES profiles(id),
  order_type              order_type  NOT NULL,
  status                  order_status NOT NULL DEFAULT 'requested',
  from_location           item_location,
  to_address_id           uuid        REFERENCES addresses(id),
  requested_delivery_date date,
  confirmed_delivery_date date,
  provider_id             uuid        REFERENCES providers(id),
  total_cents             integer,
  notes                   text,
  admin_notes             text,
  is_seed_data            boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_client_read"   ON orders FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.get_my_role() = 'admin');
CREATE POLICY "orders_client_insert" ON orders FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid() OR public.get_my_role() = 'admin');
CREATE POLICY "orders_client_update" ON orders FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR public.get_my_role() = 'admin');
CREATE POLICY "orders_admin_delete"  ON orders FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created    ON orders(created_at DESC);
CREATE INDEX idx_orders_delivery   ON orders(requested_delivery_date);

-- ── order_items ────────────────────────────────────────────────────────────

CREATE TABLE order_items (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id          uuid        NOT NULL REFERENCES items(id),
  unit_price_cents integer,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_via_order" ON order_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (o.client_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item  ON order_items(item_id);

-- ── order_status_history ───────────────────────────────────────────────────

CREATE TABLE order_status_history (
  id                uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id          uuid         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status            order_status NOT NULL,
  actor_profile_id  uuid         REFERENCES profiles(id),
  notes             text,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_history_via_order" ON order_status_history FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
      AND (o.client_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

CREATE INDEX idx_order_history_order   ON order_status_history(order_id);
CREATE INDEX idx_order_history_created ON order_status_history(created_at);
