-- B7-04: Client settings schema additions

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS default_delivery_address_id uuid REFERENCES addresses(id),
  ADD COLUMN IF NOT EXISTS preferred_channel           text NOT NULL DEFAULT 'email'
    CHECK (preferred_channel IN ('email', 'sms', 'both')),
  ADD COLUMN IF NOT EXISTS in_app_notification_prefs   jsonb NOT NULL DEFAULT
    '{"order_updates":true,"delivery_notices":true,"payment":true,"seasonal_reminders":false}';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted
  ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
