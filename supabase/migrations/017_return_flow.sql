-- B2-06: Return flow schema additions

ALTER TABLE service_tiers
  ADD COLUMN IF NOT EXISTS return_min_lead_hours integer NOT NULL DEFAULT 48;
