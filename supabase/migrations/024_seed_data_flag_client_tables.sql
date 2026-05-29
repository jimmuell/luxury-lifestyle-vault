-- Add is_seed_data to client_profiles and addresses — omitted from migration 010.
-- Partial indexes follow the same pattern as the other seed-flagged tables.

ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE addresses       ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_client_profiles_seed ON client_profiles(is_seed_data) WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_addresses_seed        ON addresses(is_seed_data)        WHERE is_seed_data = true;
