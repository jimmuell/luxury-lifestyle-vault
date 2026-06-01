-- Add Pexels attribution data to item_photos.
-- Stored as JSONB: { photographer, photographer_url, source_url }
-- Null for real client uploads; only populated by the Pexels seed-photo fetch.
ALTER TABLE item_photos
  ADD COLUMN IF NOT EXISTS attribution jsonb DEFAULT NULL;
