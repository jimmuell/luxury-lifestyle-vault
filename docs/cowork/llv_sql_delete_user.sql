-- ═══════════════════════════════════════════════════════════════════════════
-- DELETE A USER AND ALL RELATED DATA
-- ───────────────────────────────────────────────────────────────────────────
-- Usage:
--   1. Edit the `target_email` line OR `target_id` line below
--      (leave the unused one as NULL)
--   2. Paste this entire script into the Supabase SQL Editor
--   3. Run
--   4. If auth.users delete fails with permission denied (last block),
--      remove the auth user manually via:
--        Supabase Dashboard → Authentication → Users → find user → ⋯ → Delete
--
-- Cascades through these tables in FK-safe order:
--   admin_audit_log → notifications → billing_history_cache →
--   order_status_history → order_items → provider_order_assignments →
--   order_shipments → concierge_messages → item_photos → orders →
--   outfit_items → outfits → item_conditions → items →
--   client_subscriptions → providers → client_profiles → addresses →
--   pricing_change_log → email_sends → admin_settings → reminder_sends →
--   ai_search_logs → notification_template_config → admin_broadcasts →
--   profiles → auth.users
--
-- ⚠️  CONFIG NOTE
-- admin_settings and notification_template_config are GLOBAL config tables.
-- Their rows are NOT deleted — only the updated_by reference is set to NULL,
-- so removing a user never wipes shared app-wide settings.
--
-- ⚠️  STRIPE NOTE
-- This script does NOT delete the user's Stripe customer or subscription.
-- After running, the Stripe records will be orphaned (no DB row references
-- them). Clean up manually in Stripe Dashboard → Customers if needed.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- ───── EDIT ONE OF THESE ─────────────────────────────────────────────
  target_email text := 'user@example.com';
  target_id    uuid := NULL;  -- leave NULL to look up by email
  -- ─────────────────────────────────────────────────────────────────────

  user_id uuid;
  found_email text;
BEGIN
  -- Resolve profile ID
  IF target_id IS NOT NULL THEN
    user_id := target_id;
    SELECT email INTO found_email FROM profiles WHERE id = user_id;
    IF found_email IS NULL THEN
      RAISE EXCEPTION 'No profile found for id %', user_id;
    END IF;
  ELSE
    SELECT id, email INTO user_id, found_email
    FROM profiles WHERE email = target_email;
    IF user_id IS NULL THEN
      RAISE EXCEPTION 'No profile found for email %', target_email;
    END IF;
  END IF;

  RAISE NOTICE 'Deleting profile % (email: %) and all related records...',
    user_id, found_email;

  -- ── Step 1: admin_audit_log (actor_id → profiles) ─────────────────────
  DELETE FROM admin_audit_log WHERE actor_id = user_id;

  -- ── Step 2: notifications (recipient_profile_id → profiles) ───────────
  DELETE FROM notifications WHERE recipient_profile_id = user_id;

  -- ── Step 3: billing_history_cache (client_id → profiles) ──────────────
  DELETE FROM billing_history_cache WHERE client_id = user_id;

  -- ── Step 4: order_status_history (actor + indirect via orders) ────────
  DELETE FROM order_status_history WHERE actor_profile_id = user_id;
  DELETE FROM order_status_history
    WHERE order_id IN (SELECT id FROM orders WHERE client_id = user_id);

  -- ── Step 5: order_items (indirect via orders) ─────────────────────────
  DELETE FROM order_items
    WHERE order_id IN (SELECT id FROM orders WHERE client_id = user_id);
  DELETE FROM order_items
    WHERE item_id IN (SELECT id FROM items WHERE client_id = user_id);

  -- ── Step 6: provider_order_assignments ────────────────────────────────
  DELETE FROM provider_order_assignments WHERE assigned_by_profile_id = user_id;
  DELETE FROM provider_order_assignments
    WHERE order_id IN (SELECT id FROM orders WHERE client_id = user_id);
  DELETE FROM provider_order_assignments
    WHERE provider_id IN (SELECT id FROM providers WHERE profile_id = user_id);

  -- ── Step 7: order_shipments (indirect via orders) ─────────────────────
  DELETE FROM order_shipments
    WHERE order_id IN (SELECT id FROM orders WHERE client_id = user_id);

  -- ── Step 8: concierge_messages (author + client) ──────────────────────
  DELETE FROM concierge_messages WHERE author_profile_id = user_id;
  DELETE FROM concierge_messages WHERE client_id = user_id;

  -- ── Step 9: item_photos (uploaded_by + indirect via items) ────────────
  DELETE FROM item_photos WHERE uploaded_by = user_id;
  DELETE FROM item_photos
    WHERE item_id IN (SELECT id FROM items WHERE client_id = user_id);
  -- Note: storage objects (the actual photo files in Supabase Storage)
  -- are NOT cleaned up by this script. They'll orphan in the bucket.

  -- ── Step 10: orders (client_id + indirect via provider) ───────────────
  DELETE FROM orders WHERE client_id = user_id;
  DELETE FROM orders
    WHERE provider_id IN (SELECT id FROM providers WHERE profile_id = user_id);

  -- ── Step 11: outfit_items (indirect via outfits + items) ──────────────
  DELETE FROM outfit_items
    WHERE outfit_id IN (SELECT id FROM outfits WHERE client_id = user_id);
  DELETE FROM outfit_items
    WHERE item_id IN (SELECT id FROM items WHERE client_id = user_id);

  -- ── Step 12: outfits (client_id → profiles) ───────────────────────────
  DELETE FROM outfits WHERE client_id = user_id;

  -- ── Step 13: item_conditions (assessed_by + indirect via items) ───────
  DELETE FROM item_conditions WHERE assessed_by = user_id;
  DELETE FROM item_conditions
    WHERE item_id IN (SELECT id FROM items WHERE client_id = user_id);

  -- ── Step 14: items (client_id → profiles) ─────────────────────────────
  DELETE FROM items WHERE client_id = user_id;

  -- ── Step 15: client_subscriptions (client_id → profiles) ──────────────
  DELETE FROM client_subscriptions WHERE client_id = user_id;

  -- ── Step 16: providers (profile_id → profiles) ────────────────────────
  DELETE FROM providers WHERE profile_id = user_id;

  -- ── Step 17: client_profiles (profile_id → profiles) ──────────────────
  -- MUST be before addresses — client_profiles.default_delivery_address_id
  -- FKs into addresses.
  DELETE FROM client_profiles WHERE profile_id = user_id;

  -- ── Step 18: addresses (profile_id → profiles) ────────────────────────
  DELETE FROM addresses WHERE profile_id = user_id;

  -- ── Step 19: admin/system log tables that FK to profiles ──────────────
  -- These didn't have direct relationships to client data so they were
  -- missed in the first cut. All have actor/updater FKs that block the
  -- final profile delete if not cleared.
  --
  -- NOTE: admin_settings and notification_template_config are GLOBAL config
  -- tables (app-wide key/value settings), not per-user data. We must NOT
  -- delete their rows just because this user was the last to edit them —
  -- that would wipe shared configuration for everyone. Instead we NULL the
  -- updated_by reference so the profile can be deleted while the setting
  -- itself survives.
  DELETE FROM pricing_change_log         WHERE actor_profile_id = user_id;
  DELETE FROM email_sends                WHERE recipient_profile_id = user_id;
  UPDATE admin_settings             SET updated_by = NULL WHERE updated_by = user_id;
  DELETE FROM reminder_sends             WHERE client_id = user_id;
  DELETE FROM ai_search_logs             WHERE client_id = user_id;
  UPDATE notification_template_config SET updated_by = NULL WHERE updated_by = user_id;
  DELETE FROM admin_broadcasts           WHERE sent_by = user_id;

  -- ── Step 20: profile row itself ───────────────────────────────────────
  DELETE FROM profiles WHERE id = user_id;

  RAISE NOTICE 'Profile % deleted. Run the auth.users DELETE below or remove via Dashboard.', user_id;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- AUTH USER DELETION (run as a separate statement)
-- ───────────────────────────────────────────────────────────────────────────
-- Supabase SQL editor MAY not have permission to delete from auth.users
-- depending on your role. Try the DELETE below — if it fails with
-- "permission denied", remove the auth user manually:
--   Supabase Dashboard → Authentication → Users → find user → ⋯ → Delete
-- ───────────────────────────────────────────────────────────────────────────

-- Edit the email or id below to match what you used in the DO block above,
-- then run this DELETE separately:

-- DELETE FROM auth.users WHERE email = 'user@example.com';
-- OR:
-- DELETE FROM auth.users WHERE id = 'paste-uuid-here';


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (optional — uncomment + edit to confirm cleanup)
-- ═══════════════════════════════════════════════════════════════════════════

-- Should return 0 rows everywhere:
--   SELECT 'profiles' AS table_name, count(*) FROM profiles WHERE email = 'user@example.com'
--   UNION ALL SELECT 'auth.users', count(*) FROM auth.users WHERE email = 'user@example.com';

-- Show all remaining tables that might reference this email/id:
--   SELECT 'client_profiles' AS table_name, count(*) FROM client_profiles WHERE profile_id = 'paste-uuid'
--   UNION ALL SELECT 'addresses', count(*) FROM addresses WHERE profile_id = 'paste-uuid';
