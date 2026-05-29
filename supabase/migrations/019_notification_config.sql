-- B4-03: Admin notification configuration

-- Per-type channel toggles (global defaults)
CREATE TABLE notification_template_config (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key  text        NOT NULL UNIQUE,  -- e.g. 'order_confirmed', 'order_status_changed'
  label         text        NOT NULL,
  email_enabled boolean     NOT NULL DEFAULT true,
  in_app_enabled boolean    NOT NULL DEFAULT true,
  sms_enabled   boolean     NOT NULL DEFAULT false,
  updated_by    uuid        REFERENCES profiles(id),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_template_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ntc_admin" ON notification_template_config FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Pre-seed default config
INSERT INTO notification_template_config (template_key, label, email_enabled, in_app_enabled, sms_enabled) VALUES
  ('order_confirmed',         'Order confirmed',            true,  true,  false),
  ('order_status_changed',    'Order status changed',       true,  true,  false),
  ('payment_succeeded',       'Payment receipt',            true,  true,  false),
  ('payment_failed',          'Payment failure alert',      true,  false, false),
  ('concierge_reply',         'Concierge reply',            false, true,  false),
  ('seasonal_rotation_reminder', 'Seasonal rotation reminder', true, true, false);

-- Per-client override (nullable — inherits global when null)
ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS email_notifications_admin_override jsonb;

-- Admin broadcasts (one-off messages to clients)
CREATE TABLE admin_broadcasts (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  subject             text        NOT NULL,
  body                text        NOT NULL,
  channel             text        NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'in_app', 'both')),
  target              text        NOT NULL DEFAULT 'all'
    CHECK (target IN ('all', 'tier', 'founding_members', 'specific')),
  target_tier_id      uuid        REFERENCES service_tiers(id),
  target_client_ids   uuid[],
  sent_by             uuid        NOT NULL REFERENCES profiles(id),
  sent_at             timestamptz NOT NULL DEFAULT now(),
  recipient_count     integer     NOT NULL DEFAULT 0
);

ALTER TABLE admin_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broadcasts_admin" ON admin_broadcasts FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE INDEX idx_broadcasts_sent ON admin_broadcasts(sent_at DESC);
