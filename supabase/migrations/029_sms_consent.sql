-- A2P 10DLC: explicit SMS consent columns on client_profiles

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS sms_consent         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source  text;
