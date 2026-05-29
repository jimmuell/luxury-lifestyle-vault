-- Fix On-Demand Occasion tier_type: defaulted to 'subscription' when the column
-- was added in 014 because no backfill was run. The check constraint already
-- accepts 'on_demand'; 'per_request' is not a valid value.
UPDATE service_tiers
SET tier_type = 'on_demand'
WHERE name = 'On-Demand Occasion'
  AND tier_type = 'subscription';
