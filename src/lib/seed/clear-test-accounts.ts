import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

export async function previewTestAccounts(): Promise<{ count: number; emails: string[] }> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('profiles')
    .select('id, email')
    .neq('role', 'admin')
  return {
    count: data?.length ?? 0,
    emails: data?.map(p => p.email) ?? [],
  }
}

export async function clearTestAccounts(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let deleted = 0
  const errors: string[] = []

  // Collect non-admin profile IDs — preserves every admin account including
  // Jim's manually-promoted hosted account.
  const { data: nonAdminProfiles } = await adminClient
    .from('profiles')
    .select('id')
    .neq('role', 'admin')

  const profileIds = nonAdminProfiles?.map(p => p.id) ?? []
  if (!profileIds.length) return { seeded: 0, skipped: 0, errors }

  // Pre-fetch related entity IDs needed for indirect-FK tables
  const [orderResult, itemResult, outfitResult] = await Promise.all([
    adminClient.from('orders').select('id').in('client_id', profileIds),
    adminClient.from('items').select('id').in('client_id', profileIds),
    adminClient.from('outfits').select('id').in('client_id', profileIds),
  ])
  const orderIds = orderResult.data?.map(o => o.id) ?? []
  const itemIds  = itemResult.data?.map(i => i.id) ?? []
  const outfitIds = outfitResult.data?.map(o => o.id) ?? []

  // ── Step 1: admin_audit_log ───────────────────────────────────────────────
  const { error: auditErr, count: auditCount } = await adminClient
    .from('admin_audit_log')
    .delete({ count: 'exact' })
    .in('actor_id', profileIds)
  if (auditErr) errors.push(`admin_audit_log: ${auditErr.message}`)
  else deleted += auditCount ?? 0

  // ── Step 2: notifications ─────────────────────────────────────────────────
  const { error: notifErr, count: notifCount } = await adminClient
    .from('notifications')
    .delete({ count: 'exact' })
    .in('recipient_profile_id', profileIds)
  if (notifErr) errors.push(`notifications: ${notifErr.message}`)
  else deleted += notifCount ?? 0

  // ── Step 3: billing_history_cache ─────────────────────────────────────────
  const { error: bhErr, count: bhCount } = await adminClient
    .from('billing_history_cache')
    .delete({ count: 'exact' })
    .in('client_id', profileIds)
  if (bhErr) errors.push(`billing_history_cache: ${bhErr.message}`)
  else deleted += bhCount ?? 0

  // ── Step 4–7: order children (only if orders exist) ───────────────────────
  if (orderIds.length) {
    const [oshRes, oiRes, poaRes, shipRes] = await Promise.all([
      adminClient.from('order_status_history').delete({ count: 'exact' }).in('order_id', orderIds),
      adminClient.from('order_items').delete({ count: 'exact' }).in('order_id', orderIds),
      adminClient.from('provider_order_assignments').delete({ count: 'exact' }).in('order_id', orderIds),
      adminClient.from('order_shipments').delete({ count: 'exact' }).in('order_id', orderIds),
    ])
    if (oshRes.error) errors.push(`order_status_history: ${oshRes.error.message}`)
    else deleted += oshRes.count ?? 0
    if (oiRes.error) errors.push(`order_items: ${oiRes.error.message}`)
    else deleted += oiRes.count ?? 0
    if (poaRes.error) errors.push(`provider_order_assignments: ${poaRes.error.message}`)
    else deleted += poaRes.count ?? 0
    if (shipRes.error) errors.push(`order_shipments: ${shipRes.error.message}`)
    else deleted += shipRes.count ?? 0
  }

  // ── Step 8: concierge_messages ────────────────────────────────────────────
  const { error: msgErr, count: msgCount } = await adminClient
    .from('concierge_messages')
    .delete({ count: 'exact' })
    .in('client_id', profileIds)
  if (msgErr) errors.push(`concierge_messages: ${msgErr.message}`)
  else deleted += msgCount ?? 0

  // ── Step 9: item_photos + storage cleanup ─────────────────────────────────
  if (itemIds.length) {
    const { data: photoRows } = await adminClient
      .from('item_photos')
      .select('storage_path, storage_bucket')
      .in('item_id', itemIds)

    const { error: photoErr, count: photoCount } = await adminClient
      .from('item_photos')
      .delete({ count: 'exact' })
      .in('item_id', itemIds)
    if (photoErr) errors.push(`item_photos: ${photoErr.message}`)
    else deleted += photoCount ?? 0

    if (photoRows?.length) {
      const byBucket: Record<string, string[]> = {}
      for (const row of photoRows) {
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
  }

  // ── Step 10: orders ───────────────────────────────────────────────────────
  const { error: orderErr, count: orderCount } = await adminClient
    .from('orders')
    .delete({ count: 'exact' })
    .in('client_id', profileIds)
  if (orderErr) errors.push(`orders: ${orderErr.message}`)
  else deleted += orderCount ?? 0

  // ── Step 11: outfit_items then outfits ────────────────────────────────────
  if (outfitIds.length) {
    const { error: oiOErr, count: oiOCount } = await adminClient
      .from('outfit_items')
      .delete({ count: 'exact' })
      .in('outfit_id', outfitIds)
    if (oiOErr) errors.push(`outfit_items: ${oiOErr.message}`)
    else deleted += oiOCount ?? 0
  }
  const { error: outfitErr, count: outfitCount } = await adminClient
    .from('outfits')
    .delete({ count: 'exact' })
    .in('client_id', profileIds)
  if (outfitErr) errors.push(`outfits: ${outfitErr.message}`)
  else deleted += outfitCount ?? 0

  // ── Step 12: item_conditions then items ───────────────────────────────────
  if (itemIds.length) {
    const { error: condErr, count: condCount } = await adminClient
      .from('item_conditions')
      .delete({ count: 'exact' })
      .in('item_id', itemIds)
    if (condErr) errors.push(`item_conditions: ${condErr.message}`)
    else deleted += condCount ?? 0
  }
  const { error: itemErr, count: itemCount } = await adminClient
    .from('items')
    .delete({ count: 'exact' })
    .in('client_id', profileIds)
  if (itemErr) errors.push(`items: ${itemErr.message}`)
  else deleted += itemCount ?? 0

  // ── Step 13: client_subscriptions ────────────────────────────────────────
  const { error: csErr, count: csCount } = await adminClient
    .from('client_subscriptions')
    .delete({ count: 'exact' })
    .in('client_id', profileIds)
  if (csErr) errors.push(`client_subscriptions: ${csErr.message}`)
  else deleted += csCount ?? 0

  // ── Step 14: client_profiles then addresses ───────────────────────────────
  const { error: cpErr, count: cpCount } = await adminClient
    .from('client_profiles')
    .delete({ count: 'exact' })
    .in('profile_id', profileIds)
  if (cpErr) errors.push(`client_profiles: ${cpErr.message}`)
  else deleted += cpCount ?? 0

  const { error: addrErr, count: addrCount } = await adminClient
    .from('addresses')
    .delete({ count: 'exact' })
    .in('profile_id', profileIds)
  if (addrErr) errors.push(`addresses: ${addrErr.message}`)
  else deleted += addrCount ?? 0

  // ── Step 15: auth users (cascade to profiles) ─────────────────────────────
  for (const profileId of profileIds) {
    const { error: authErr } = await adminClient.auth.admin.deleteUser(profileId)
    if (authErr) {
      await adminClient.from('profiles').delete().eq('id', profileId)
      if (!authErr.message.includes('not found')) {
        errors.push(`auth user ${profileId}: ${authErr.message}`)
      }
    } else {
      deleted += 1
    }
  }

  return { seeded: deleted, skipped: 0, errors }
}
