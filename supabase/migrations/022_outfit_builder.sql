-- B1-04: Outfit builder

CREATE TABLE outfits (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outfit_items (
  outfit_id   uuid        NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  item_id     uuid        NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sort_order  integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (outfit_id, item_id)
);

-- outfit_id reference on orders (nullable — not all orders are outfit-based)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS outfit_id uuid REFERENCES outfits(id);

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outfits_client_own" ON outfits
  FOR ALL USING (client_id = auth.uid());

CREATE POLICY "outfit_items_client_own" ON outfit_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM outfits o
      WHERE o.id = outfit_id AND o.client_id = auth.uid()
    )
  );

CREATE POLICY "outfits_admin" ON outfits
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "outfit_items_admin" ON outfit_items
  FOR ALL USING (get_my_role() = 'admin');

CREATE INDEX idx_outfits_client ON outfits(client_id, created_at DESC);
CREATE INDEX idx_outfit_items_outfit ON outfit_items(outfit_id, sort_order);

CREATE TRIGGER set_outfits_updated_at
  BEFORE UPDATE ON outfits
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
