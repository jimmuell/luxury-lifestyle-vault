-- OE-4: Structured location vocabulary for Wisconsin ↔ Arizona corridor model.
-- location_status (enum) = machine-queryable structured state
-- location_label (text)  = stays as human notes (e.g. "master bedroom closet", "Rack A-12")

CREATE TYPE item_location AS ENUM (
  'with_client_wi',
  'with_client_az',
  'in_storage_wi',
  'in_storage_az',
  'at_provider_wi',
  'at_provider_az',
  'in_transit',
  'intake_pending',
  'delivery_scheduled'
);

ALTER TABLE items ADD COLUMN location_status item_location;

-- Index for "what's in AZ right now?" queries
CREATE INDEX idx_items_location_status ON items(location_status);
