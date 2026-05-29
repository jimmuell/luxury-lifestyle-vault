-- Add is_seed_data flag to all tables that can hold demo data.
-- Seed scripts set this to true; clear-all deletes rows where is_seed_data = true.
-- Default false ensures production records are never affected.

ALTER TABLE profiles           ADD COLUMN is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE items              ADD COLUMN is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE item_photos        ADD COLUMN is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE providers          ADD COLUMN is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE concierge_messages ADD COLUMN is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE item_conditions    ADD COLUMN is_seed_data boolean NOT NULL DEFAULT false;

-- Partial indexes — only index seed rows so production query plans are unaffected
CREATE INDEX idx_profiles_seed           ON profiles(is_seed_data)           WHERE is_seed_data = true;
CREATE INDEX idx_items_seed              ON items(is_seed_data)               WHERE is_seed_data = true;
CREATE INDEX idx_providers_seed          ON providers(is_seed_data)           WHERE is_seed_data = true;
CREATE INDEX idx_concierge_messages_seed ON concierge_messages(is_seed_data)  WHERE is_seed_data = true;
CREATE INDEX idx_item_conditions_seed    ON item_conditions(is_seed_data)     WHERE is_seed_data = true;
