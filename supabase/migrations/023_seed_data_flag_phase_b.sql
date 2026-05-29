-- Add is_seed_data flag to all Phase B tables that can hold demo/seed data.
-- Matches pattern from migration 010. Seed scripts set this to true;
-- clear-all deletes rows where is_seed_data = true.

ALTER TABLE order_items                ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE order_status_history       ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE client_subscriptions       ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE notifications              ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE provider_order_assignments ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE order_shipments            ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE outfits                    ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE outfit_items               ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE billing_history_cache      ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;
ALTER TABLE admin_audit_log            ADD COLUMN IF NOT EXISTS is_seed_data boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_order_items_seed                ON order_items(is_seed_data)                WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_order_status_history_seed       ON order_status_history(is_seed_data)       WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_seed       ON client_subscriptions(is_seed_data)       WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_notifications_seed              ON notifications(is_seed_data)              WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_provider_order_assignments_seed ON provider_order_assignments(is_seed_data) WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_order_shipments_seed            ON order_shipments(is_seed_data)            WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_outfits_seed                    ON outfits(is_seed_data)                    WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_outfit_items_seed               ON outfit_items(is_seed_data)               WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_billing_history_cache_seed      ON billing_history_cache(is_seed_data)      WHERE is_seed_data = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_seed            ON admin_audit_log(is_seed_data)            WHERE is_seed_data = true;
