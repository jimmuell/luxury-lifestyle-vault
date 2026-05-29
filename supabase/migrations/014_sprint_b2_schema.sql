-- Sprint B2: Payments, Providers & Notifications — schema foundation
-- Covers: Stripe webhook events, client subscriptions, notifications, email_sends,
-- provider dispatch, provider service stages, order shipments, corridors,
-- pricing change log, and column additions across existing tables.

-- ── Stripe webhook events (idempotency) ────────────────────────────────────

CREATE TABLE stripe_webhook_events (
  id                text        PRIMARY KEY, -- Stripe event ID (evt_...)
  type              text        NOT NULL,
  payload           jsonb       NOT NULL,
  processed_at      timestamptz,
  processing_error  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stripe_webhook_admin" ON stripe_webhook_events FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- ── service_tiers column additions ─────────────────────────────────────────

ALTER TABLE service_tiers
  ADD COLUMN IF NOT EXISTS stripe_product_id      text,
  ADD COLUMN IF NOT EXISTS stripe_price_id_current text,
  ADD COLUMN IF NOT EXISTS tier_type              text NOT NULL DEFAULT 'subscription'
    CHECK (tier_type IN ('subscription', 'on_demand')),
  ADD COLUMN IF NOT EXISTS billing_cycle          text NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual', 'none')),
  ADD COLUMN IF NOT EXISTS included_services      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS addon_options          jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS founding_member_eligible bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier3_billing_mode     text NOT NULL DEFAULT 'on_delivery'
    CHECK (tier3_billing_mode IN ('on_delivery', 'monthly_rollup'));

-- ── client_subscriptions ───────────────────────────────────────────────────

CREATE TABLE client_subscriptions (
  id                              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id                       uuid        NOT NULL REFERENCES profiles(id),
  service_tier_id                 uuid        NOT NULL REFERENCES service_tiers(id),
  stripe_subscription_id          text        NOT NULL,
  stripe_price_id                 text        NOT NULL,
  status                          text        NOT NULL DEFAULT 'active',
  current_period_start            timestamptz,
  current_period_end              timestamptz,
  cancel_at_period_end            boolean     NOT NULL DEFAULT false,
  canceled_at                     timestamptz,
  founding_member_discount_applied boolean    NOT NULL DEFAULT false,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_client_read" ON client_subscriptions FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.get_my_role() = 'admin');
CREATE POLICY "subscriptions_admin_write" ON client_subscriptions FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE INDEX idx_client_subs_client ON client_subscriptions(client_id);
CREATE INDEX idx_client_subs_stripe ON client_subscriptions(stripe_subscription_id);

CREATE TRIGGER client_subs_updated_at
  BEFORE UPDATE ON client_subscriptions FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ── client_profiles column additions ───────────────────────────────────────

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS subscription_active    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notifications    jsonb   NOT NULL DEFAULT '{"order_updates":true,"delivery_notices":true,"payment":true,"seasonal_reminders":true}';

-- ── notifications ──────────────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM (
  'order_confirmed',
  'order_status_changed',
  'payment_succeeded',
  'payment_failed',
  'concierge_reply',
  'provider_assignment_declined',
  'system'
);

CREATE TABLE notifications (
  id                    uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_profile_id  uuid              NOT NULL REFERENCES profiles(id),
  type                  notification_type NOT NULL,
  title                 text              NOT NULL,
  snippet               text,
  link_target           text,
  metadata              jsonb             NOT NULL DEFAULT '{}',
  read_at               timestamptz,
  created_at            timestamptz       NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_recipient_read" ON notifications FOR SELECT TO authenticated
  USING (recipient_profile_id = auth.uid() OR public.get_my_role() = 'admin');
CREATE POLICY "notifications_system_insert" ON notifications FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "notifications_recipient_update" ON notifications FOR UPDATE TO authenticated
  USING (recipient_profile_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE INDEX idx_notifications_recipient ON notifications(recipient_profile_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_profile_id) WHERE read_at IS NULL;

-- ── email_sends ────────────────────────────────────────────────────────────

CREATE TYPE email_send_status AS ENUM ('queued', 'sent', 'failed', 'bounced');

CREATE TABLE email_sends (
  id                    uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_profile_id  uuid              REFERENCES profiles(id),
  template_name         text              NOT NULL,
  subject               text              NOT NULL,
  to_address            text              NOT NULL,
  status                email_send_status NOT NULL DEFAULT 'queued',
  resend_id             text,
  error_message         text,
  created_at            timestamptz       NOT NULL DEFAULT now(),
  sent_at               timestamptz
);

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_sends_admin" ON email_sends FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE INDEX idx_email_sends_recipient ON email_sends(recipient_profile_id, created_at DESC);

-- ── dev_email_inbox (gated by application logic, not schema) ───────────────

CREATE TABLE dev_email_inbox (
  id          uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient   text  NOT NULL,
  subject     text  NOT NULL,
  html        text,
  text        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dev_email_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_email_admin" ON dev_email_inbox FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- ── provider_order_assignments ─────────────────────────────────────────────

CREATE TYPE provider_response_type AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE provider_order_assignments (
  id                        uuid                    DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id                  uuid                    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id               uuid                    NOT NULL REFERENCES providers(id),
  assigned_by_profile_id    uuid                    REFERENCES profiles(id),
  pickup_window_start       timestamptz,
  pickup_window_end         timestamptz,
  delivery_deadline         timestamptz,
  prep_instructions         text,
  declared_value_total_cents integer,
  provider_response         provider_response_type  NOT NULL DEFAULT 'pending',
  decline_reason            text,
  created_at                timestamptz             NOT NULL DEFAULT now(),
  updated_at                timestamptz             NOT NULL DEFAULT now()
);

ALTER TABLE provider_order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poa_admin_all" ON provider_order_assignments FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "poa_provider_read" ON provider_order_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_order_assignments.provider_id
      AND p.profile_id = auth.uid()
    )
  );
CREATE POLICY "poa_provider_update" ON provider_order_assignments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_order_assignments.provider_id
      AND p.profile_id = auth.uid()
    )
  );

CREATE INDEX idx_poa_order ON provider_order_assignments(order_id);
CREATE INDEX idx_poa_provider ON provider_order_assignments(provider_id);

CREATE TRIGGER poa_updated_at
  BEFORE UPDATE ON provider_order_assignments FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ── provider_service_stage + order_items additions ─────────────────────────

CREATE TYPE provider_service_stage AS ENUM (
  'received',
  'cleaning',
  'pressing',
  'ready_for_pickup'
);

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS provider_service_stage provider_service_stage,
  ADD COLUMN IF NOT EXISTS provider_notes          text,
  ADD COLUMN IF NOT EXISTS damage_flagged          boolean NOT NULL DEFAULT false;

-- ── order_shipments ────────────────────────────────────────────────────────

CREATE TYPE shipment_direction AS ENUM ('outbound', 'return');
CREATE TYPE shipping_carrier   AS ENUM ('ups', 'fedex', 'usps', 'dhl', 'other');

CREATE TABLE order_shipments (
  id                     uuid               DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id               uuid               NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  direction              shipment_direction NOT NULL DEFAULT 'outbound',
  carrier                shipping_carrier,
  carrier_other          text,
  tracking_number        text,
  label_url              text,
  shipped_at             timestamptz,
  expected_delivery_at   timestamptz,
  delivered_at           timestamptz,
  shipping_cost_cents    integer,
  notes                  text,
  created_at             timestamptz        NOT NULL DEFAULT now(),
  updated_at             timestamptz        NOT NULL DEFAULT now()
);

ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipments_client_read" ON order_shipments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_shipments.order_id
      AND (o.client_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );
CREATE POLICY "shipments_admin_write" ON order_shipments FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE INDEX idx_shipments_order ON order_shipments(order_id);

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON order_shipments FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ── corridors ──────────────────────────────────────────────────────────────

CREATE TABLE corridors (
  id                           uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                         text  NOT NULL UNIQUE,
  display_name                 text  NOT NULL,
  origin_region_code           text  NOT NULL,
  destination_region_code      text  NOT NULL,
  active                       boolean NOT NULL DEFAULT true,
  fall_transition_start_date   date,
  fall_transition_end_date     date,
  spring_transition_start_date date,
  spring_transition_end_date   date,
  sort_order                   integer NOT NULL DEFAULT 0,
  created_at                   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE corridors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corridors_read" ON corridors FOR SELECT TO authenticated USING (true);
CREATE POLICY "corridors_admin_write" ON corridors FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Pre-seed the WI-AZ corridor
INSERT INTO corridors (slug, display_name, origin_region_code, destination_region_code, active,
  fall_transition_start_date, fall_transition_end_date,
  spring_transition_start_date, spring_transition_end_date, sort_order)
VALUES (
  'wi_az', 'Wisconsin ↔ Arizona', 'WI', 'AZ', true,
  '2026-09-01', '2026-10-15',
  '2027-03-15', '2027-05-01',
  1
);

-- ── provider_corridors ─────────────────────────────────────────────────────

CREATE TYPE corridor_role AS ENUM ('origin_provider', 'destination_provider', 'both');

CREATE TABLE provider_corridors (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id   uuid          NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  corridor_id   uuid          NOT NULL REFERENCES corridors(id) ON DELETE CASCADE,
  corridor_role corridor_role NOT NULL DEFAULT 'both',
  created_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (provider_id, corridor_id)
);

ALTER TABLE provider_corridors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_corridors_read" ON provider_corridors FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider_corridors_admin" ON provider_corridors FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- ── orders column additions ────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS corridor_id        uuid REFERENCES corridors(id),
  ADD COLUMN IF NOT EXISTS stripe_invoice_id  text,
  ADD COLUMN IF NOT EXISTS paid_at            timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at        timestamptz,
  ADD COLUMN IF NOT EXISTS is_rush            boolean NOT NULL DEFAULT false;

-- ── addresses column addition ──────────────────────────────────────────────

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS region_code text;

-- Backfill region_code from state
UPDATE addresses SET region_code = state WHERE region_code IS NULL AND state IS NOT NULL;

-- ── pricing_change_log ─────────────────────────────────────────────────────

CREATE TABLE pricing_change_log (
  id               uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  service_tier_id  uuid  NOT NULL REFERENCES service_tiers(id),
  actor_profile_id uuid  REFERENCES profiles(id),
  field            text  NOT NULL,
  before_value     text,
  after_value      text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pricing_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_log_admin" ON pricing_change_log FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- ── item_photos column additions ───────────────────────────────────────────

ALTER TABLE item_photos
  ADD COLUMN IF NOT EXISTS related_order_id uuid REFERENCES orders(id);

-- ── Extend photo_type enum (add provider_service if not already there) ─────
-- Note: item_photos.photo_type may not exist as an enum; check existing schema.
-- The AI analysis column is ai_analysis (jsonb). If there's a photo_type column,
-- we need to extend the enum. Checking migration 002_core_tables for the column.
-- Adding photo_type as a text column if it doesn't exist:
ALTER TABLE item_photos
  ADD COLUMN IF NOT EXISTS photo_type text NOT NULL DEFAULT 'gallery'
    CHECK (photo_type IN ('intake', 'gallery', 'condition', 'provider_service'));

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_corridor ON orders(corridor_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_invoice ON orders(stripe_invoice_id);
