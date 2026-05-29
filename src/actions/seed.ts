'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedAll } from '@/lib/seed/seed-all'
import { clearAll } from '@/lib/seed/clear-all'
import { SEED_MANIFEST } from '@/lib/seed/manifest'
import type { SeedResult } from '@/lib/seed/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
}

export async function runSeedScript(id: string): Promise<SeedResult> {
  await requireAdmin()
  const manifest = SEED_MANIFEST.find(s => s.id === id)
  if (!manifest) throw new Error(`Unknown seed script: ${id}`)
  return manifest.script()
}

export async function runAllSeeds() {
  await requireAdmin()
  return seedAll()
}

export async function clearAllSeeds(): Promise<SeedResult> {
  await requireAdmin()
  return clearAll()
}

export async function getSeedStatus() {
  await requireAdmin()
  const adminClient = createAdminClient()

  const [
    profiles, items, providers, messages, conditions, photos,
    orders, orderItems, orderHistory, orderShipments, providerAssignments,
    outfits, outfitItems, subs, notifs, auditLog, addresses,
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('items').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('providers').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('concierge_messages').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('item_conditions').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('item_photos').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('orders').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('order_items').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('order_status_history').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('order_shipments').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('provider_order_assignments').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('outfits').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('outfit_items').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('client_subscriptions').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('notifications').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('admin_audit_log').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
    adminClient.from('addresses').select('*', { count: 'exact', head: true }).eq('is_seed_data', true),
  ])

  const counts = {
    profiles: profiles.count ?? 0,
    items: items.count ?? 0,
    providers: providers.count ?? 0,
    concierge_messages: messages.count ?? 0,
    item_conditions: conditions.count ?? 0,
    item_photos: photos.count ?? 0,
    orders: orders.count ?? 0,
    order_items: orderItems.count ?? 0,
    order_status_history: orderHistory.count ?? 0,
    order_shipments: orderShipments.count ?? 0,
    provider_order_assignments: providerAssignments.count ?? 0,
    outfits: outfits.count ?? 0,
    outfit_items: outfitItems.count ?? 0,
    client_subscriptions: subs.count ?? 0,
    notifications: notifs.count ?? 0,
    admin_audit_log: auditLog.count ?? 0,
    addresses: addresses.count ?? 0,
  }

  return {
    ...counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  }
}
