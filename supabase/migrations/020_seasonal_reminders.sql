-- B4-04: Seasonal rotation reminders

-- Admin-configurable global settings
CREATE TABLE admin_settings (
  key         text        PRIMARY KEY,
  value       jsonb       NOT NULL,
  updated_by  uuid        REFERENCES profiles(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_settings_admin" ON admin_settings FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- Pre-seed defaults
INSERT INTO admin_settings (key, value) VALUES
  ('seasonal_reminder_days_before', '14'),
  ('seasonal_reminder_enabled', 'true');

-- Idempotency table: one row per client per corridor per season
CREATE TABLE reminder_sends (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id      uuid        NOT NULL REFERENCES profiles(id),
  corridor_id    uuid        NOT NULL REFERENCES corridors(id),
  reminder_type  text        NOT NULL,  -- 'fall_transition' | 'spring_transition'
  reminder_year  integer     NOT NULL,
  sent_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, corridor_id, reminder_type, reminder_year)
);

ALTER TABLE reminder_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminder_sends_admin" ON reminder_sends FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "reminder_sends_system" ON reminder_sends FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX idx_reminder_sends_client ON reminder_sends(client_id, sent_at DESC);
