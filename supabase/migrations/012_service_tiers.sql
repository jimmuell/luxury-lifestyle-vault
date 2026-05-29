-- Sprint B1: Service tiers configuration table and client founding_member flag.
-- All pricing lives here — never hardcoded. Admin-editable via B6-02 surface.
-- Pre-seeded with working-assumption values from assumptions register [AR-2].

CREATE TABLE service_tiers (
  id                          uuid           DEFAULT gen_random_uuid() PRIMARY KEY,
  name                        text           NOT NULL,
  description                 text,
  monthly_price_cents         integer,
  per_request_base_cents      integer,
  per_item_surcharge_cents    integer        NOT NULL DEFAULT 0,
  rush_premium_pct            numeric(5,2)   NOT NULL DEFAULT 50.0,
  min_lead_time_hours         integer        NOT NULL DEFAULT 48,
  rush_lead_time_hours        integer        NOT NULL DEFAULT 24,
  founding_member_discount_pct numeric(5,2)  NOT NULL DEFAULT 0,
  active                      boolean        NOT NULL DEFAULT true,
  sort_order                  integer        NOT NULL DEFAULT 0,
  created_at                  timestamptz    NOT NULL DEFAULT now(),
  updated_at                  timestamptz    NOT NULL DEFAULT now()
);

ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read tiers (needed for cost preview in B2-02)
CREATE POLICY "service_tiers_authenticated_read" ON service_tiers FOR SELECT TO authenticated
  USING (true);

-- Only admins can write
CREATE POLICY "service_tiers_admin_write" ON service_tiers FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "service_tiers_admin_update" ON service_tiers FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "service_tiers_admin_delete" ON service_tiers FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE TRIGGER service_tiers_updated_at
  BEFORE UPDATE ON service_tiers FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Pre-seed with working-assumption values [AR-2]
-- Tier 1: two seasonal rotations / year, subscription
-- Tier 2: four rotations + express, subscription
-- Tier 3: no subscription, per-request on-demand
INSERT INTO service_tiers
  (name, description, monthly_price_cents, per_request_base_cents, per_item_surcharge_cents,
   rush_premium_pct, min_lead_time_hours, rush_lead_time_hours, founding_member_discount_pct, sort_order)
VALUES
  ('Seasonal Essentials',
   'Two seasonal wardrobe rotations per year. Items transported between your WI and AZ residences at the start of each season. Cleaning, pressing, and storage included.',
   29900, NULL, 0, 50.0, 336, 168, 20.0, 1),

  ('Seasonal Premier',
   'Four seasonal rotations per year plus express single-item delivery. White-glove service with priority scheduling, dedicated concierge, and complimentary cleaning after each rotation.',
   59900, NULL, 0, 50.0, 168, 72, 20.0, 2),

  ('On-Demand Occasion',
   'No monthly subscription. Request any item from your stored wardrobe delivered to your door whenever you need it. Base fee covers pick, prep, and delivery for up to one item.',
   NULL, 7500, 1500, 50.0, 48, 24, 20.0, 3);

-- founding_member flag on client_profiles
ALTER TABLE client_profiles ADD COLUMN founding_member boolean NOT NULL DEFAULT false;
