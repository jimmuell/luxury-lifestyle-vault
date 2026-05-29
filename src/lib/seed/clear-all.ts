import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

export async function clearAll(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let deleted = 0
  const errors: string[] = []

  try {
    // ── Collect seed profile IDs before any deletes ───────────────────────────
    // Needed for the auth.admin.deleteUser() calls at the very end.
    const { data: seedProfiles } = await adminClient
      .from('profiles')
      .select('id')
      .eq('is_seed_data', true)

    const seedProfileIds = seedProfiles?.map(p => p.id) ?? []

    // ── Step 1: admin_audit_log ───────────────────────────────────────────────
    // FK: actor_id → profiles. Leaf table — no children.
    const { error: auditErr, count: auditCount } = await adminClient
      .from('admin_audit_log')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (auditErr) errors.push(`admin_audit_log: ${auditErr.message}`)
    else deleted += auditCount ?? 0

    // ── Step 2: notifications ─────────────────────────────────────────────────
    // FK: recipient_profile_id → profiles. Leaf table.
    const { error: notifErr, count: notifCount } = await adminClient
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (notifErr) errors.push(`notifications: ${notifErr.message}`)
    else deleted += notifCount ?? 0

    // ── Step 3: billing_history_cache ─────────────────────────────────────────
    // FK: order_id → orders, client_id → profiles.
    // MUST be before orders — this was the primary FK violation.
    const { error: bhErr, count: bhCount } = await adminClient
      .from('billing_history_cache')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (bhErr) errors.push(`billing_history_cache: ${bhErr.message}`)
    else deleted += bhCount ?? 0

    // ── Step 4: order_status_history ─────────────────────────────────────────
    // FK: order_id → orders, actor_profile_id → profiles.
    const { error: oshErr, count: oshCount } = await adminClient
      .from('order_status_history')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (oshErr) errors.push(`order_status_history: ${oshErr.message}`)
    else deleted += oshCount ?? 0

    // ── Step 5: order_items ───────────────────────────────────────────────────
    // FK: order_id → orders, item_id → items.
    const { error: oiErr, count: oiCount } = await adminClient
      .from('order_items')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (oiErr) errors.push(`order_items: ${oiErr.message}`)
    else deleted += oiCount ?? 0

    // ── Step 6: provider_order_assignments ────────────────────────────────────
    // FK: order_id → orders, provider_id → providers, assigned_by_profile_id → profiles.
    const { error: poaErr, count: poaCount } = await adminClient
      .from('provider_order_assignments')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (poaErr) errors.push(`provider_order_assignments: ${poaErr.message}`)
    else deleted += poaCount ?? 0

    // ── Step 7: order_shipments ───────────────────────────────────────────────
    // FK: order_id → orders.
    const { error: shipErr, count: shipCount } = await adminClient
      .from('order_shipments')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (shipErr) errors.push(`order_shipments: ${shipErr.message}`)
    else deleted += shipCount ?? 0

    // ── Step 8: concierge_messages ────────────────────────────────────────────
    // FK: related_order_id → orders (nullable), author_profile_id → profiles,
    //     client_id → profiles.
    const { error: msgErr, count: msgCount } = await adminClient
      .from('concierge_messages')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (msgErr) errors.push(`concierge_messages: ${msgErr.message}`)
    else deleted += msgCount ?? 0

    // ── Step 9: item_photos + storage cleanup ─────────────────────────────────
    // FK: item_id → items, uploaded_by → profiles,
    //     related_order_id → orders (nullable — must be before orders).
    // Collect paths first so we can clean up storage files afterward.
    const { data: seedPhotoRows } = await adminClient
      .from('item_photos')
      .select('storage_path, storage_bucket')
      .eq('is_seed_data', true)

    const { error: photoErr, count: photoCount } = await adminClient
      .from('item_photos')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (photoErr) errors.push(`item_photos: ${photoErr.message}`)
    else deleted += photoCount ?? 0

    // Delete storage objects (idempotent — no error if files are absent).
    if (seedPhotoRows?.length) {
      const byBucket: Record<string, string[]> = {}
      for (const row of seedPhotoRows) {
        if (!row.storage_bucket || !row.storage_path) continue
        if (!byBucket[row.storage_bucket]) byBucket[row.storage_bucket] = []
        byBucket[row.storage_bucket].push(row.storage_path)
      }
      for (const [bucket, paths] of Object.entries(byBucket)) {
        for (let i = 0; i < paths.length; i += 1000) {
          const { error: storageErr } = await adminClient.storage
            .from(bucket)
            .remove(paths.slice(i, i + 1000))
          if (storageErr) errors.push(`storage cleanup (${bucket}): ${storageErr.message}`)
        }
      }
    }

    // ── Step 10: orders ───────────────────────────────────────────────────────
    // FK: client_id → profiles, provider_id → providers,
    //     to_address_id → addresses, outfit_id → outfits, corridor_id → corridors.
    // Safe now: billing_history_cache, order_status_history, order_items,
    // provider_order_assignments, order_shipments, concierge_messages,
    // and item_photos are all gone.
    const { error: orderErr, count: orderCount } = await adminClient
      .from('orders')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (orderErr) errors.push(`orders: ${orderErr.message}`)
    else deleted += orderCount ?? 0

    // ── Step 11: outfit_items ─────────────────────────────────────────────────
    // FK: outfit_id → outfits, item_id → items.
    const { error: oiOErr, count: oiOCount } = await adminClient
      .from('outfit_items')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (oiOErr) errors.push(`outfit_items: ${oiOErr.message}`)
    else deleted += oiOCount ?? 0

    // ── Step 12: outfits ──────────────────────────────────────────────────────
    // FK: client_id → profiles.
    // Safe now: orders (outfit_id FK) and outfit_items are gone.
    const { error: outfitErr, count: outfitCount } = await adminClient
      .from('outfits')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (outfitErr) errors.push(`outfits: ${outfitErr.message}`)
    else deleted += outfitCount ?? 0

    // ── Step 13: item_conditions ──────────────────────────────────────────────
    // FK: item_id → items, assessed_by → profiles.
    const { error: condErr, count: condCount } = await adminClient
      .from('item_conditions')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (condErr) errors.push(`item_conditions: ${condErr.message}`)
    else deleted += condCount ?? 0

    // ── Step 14: items ────────────────────────────────────────────────────────
    // FK: client_id → profiles.
    // Safe now: item_photos, item_conditions, order_items, outfit_items gone.
    const { error: itemErr, count: itemCount } = await adminClient
      .from('items')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (itemErr) errors.push(`items: ${itemErr.message}`)
    else deleted += itemCount ?? 0

    // ── Step 15: client_subscriptions ────────────────────────────────────────
    // FK: client_id → profiles, service_tier_id → service_tiers.
    const { error: csErr, count: csCount } = await adminClient
      .from('client_subscriptions')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (csErr) errors.push(`client_subscriptions: ${csErr.message}`)
    else deleted += csCount ?? 0

    // ── Step 16: providers ────────────────────────────────────────────────────
    // FK: profile_id → profiles.
    // Safe now: provider_order_assignments and orders (provider_id FK) are gone.
    const { error: provErr, count: provCount } = await adminClient
      .from('providers')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (provErr) errors.push(`providers: ${provErr.message}`)
    else deleted += provCount ?? 0

    // ── Step 17: client_profiles ──────────────────────────────────────────────
    // FK: profile_id → profiles, default_delivery_address_id → addresses.
    // MUST be before addresses — client_profiles has a FK pointing into addresses.
    const { error: cpErr, count: cpCount } = await adminClient
      .from('client_profiles')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (cpErr) errors.push(`client_profiles: ${cpErr.message}`)
    else deleted += cpCount ?? 0

    // ── Step 18: addresses ────────────────────────────────────────────────────
    // FK: profile_id → profiles.
    // Safe now: client_profiles (default_delivery_address_id FK) and orders
    // (to_address_id FK) are gone.
    const { error: addrErr, count: addrCount } = await adminClient
      .from('addresses')
      .delete({ count: 'exact' })
      .eq('is_seed_data', true)
    if (addrErr) errors.push(`addresses: ${addrErr.message}`)
    else deleted += addrCount ?? 0

    // ── Step 19: auth users (cascades to profiles) ────────────────────────────
    // All rows that FK into profiles are now gone, so auth deletion succeeds.
    for (const profileId of seedProfileIds) {
      const { error: authErr } = await adminClient.auth.admin.deleteUser(profileId)
      if (authErr) {
        // Auth user already gone — delete the orphaned profile row directly.
        await adminClient.from('profiles').delete().eq('id', profileId)
        if (!authErr.message.includes('not found')) {
          errors.push(`auth user ${profileId}: ${authErr.message}`)
        }
      } else {
        deleted += 1
      }
    }

  } catch (err) {
    errors.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { seeded: deleted, skipped: 0, errors }
}
