import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'
import type { Json } from '@/types/database'

interface SeedAuditEntry {
  action: string
  entity_type: string
  entity_id_hint: string  // used to derive or look up entity_id at runtime
  entity_id_type: 'order_notes_key' | 'client_email' | 'provider_name' | 'literal'
  before_state: Json | null
  after_state: Json | null
  metadata: Json
  created_at: string
  client_email: string  // used to look up actor or related entity
}

const SEED_AUDIT: SeedAuditEntry[] = [
  // ── Order 1: Margaret Seasonal Rotation ───────────────────────────────────
  {
    action: 'order.confirmed',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Seasonal Rotation Feb 2026',
    client_email: 'client1@test.llv.com',
    before_state: { status: 'requested' },
    after_state: { status: 'confirmed' },
    metadata: { item_count: 25, rotation_direction: 'WI→AZ' },
    created_at: '2026-01-28T12:00:00Z',
  },
  {
    action: 'provider.assigned',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Seasonal Rotation Feb 2026',
    client_email: 'client1@test.llv.com',
    before_state: null,
    after_state: { provider: 'RAVE FabriCARE', response: 'pending' },
    metadata: { declared_value_cents: 18750000 },
    created_at: '2026-02-01T09:05:00Z',
  },
  {
    action: 'order.status_changed',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Seasonal Rotation Feb 2026',
    client_email: 'client1@test.llv.com',
    before_state: { status: 'dispatched_to_provider' },
    after_state: { status: 'in_preparation' },
    metadata: { provider: 'RAVE FabriCARE' },
    created_at: '2026-02-10T14:05:00Z',
  },
  {
    action: 'order.shipped',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Seasonal Rotation Feb 2026',
    client_email: 'client1@test.llv.com',
    before_state: { status: 'in_preparation' },
    after_state: { status: 'shipped', tracking_number: 'FX29831004720001' },
    metadata: { carrier: 'fedex', cost_cents: 18500 },
    created_at: '2026-02-18T08:05:00Z',
  },
  {
    action: 'order.delivered',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Seasonal Rotation Feb 2026',
    client_email: 'client1@test.llv.com',
    before_state: { status: 'shipped' },
    after_state: { status: 'delivered' },
    metadata: { delivery_confirmed_by: 'client', location: 'Scottsdale AZ' },
    created_at: '2026-02-22T16:05:00Z',
  },

  // ── Order 2: Catherine Gala Delivery ─────────────────────────────────────
  {
    action: 'order.confirmed',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Catherine Beaumont Gala On-Demand Apr 2026',
    client_email: 'client2@test.llv.com',
    before_state: { status: 'requested' },
    after_state: { status: 'confirmed' },
    metadata: { item_count: 4, request_type: 'on_demand' },
    created_at: '2026-04-03T10:05:00Z',
  },
  {
    action: 'order.delivered',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Catherine Beaumont Gala On-Demand Apr 2026',
    client_email: 'client2@test.llv.com',
    before_state: { status: 'shipped' },
    after_state: { status: 'delivered' },
    metadata: { delivery_confirmed_by: 'client', location: 'Paradise Valley AZ' },
    created_at: '2026-04-05T17:05:00Z',
  },

  // ── Order 3: James Seasonal Rotation ─────────────────────────────────────
  {
    action: 'order.confirmed',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'James Thornton Seasonal Rotation Feb 2026',
    client_email: 'client3@test.llv.com',
    before_state: { status: 'requested' },
    after_state: { status: 'confirmed' },
    metadata: { item_count: 20, rotation_direction: 'WI→AZ' },
    created_at: '2026-01-30T11:05:00Z',
  },
  {
    action: 'order.delivered',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'James Thornton Seasonal Rotation Feb 2026',
    client_email: 'client3@test.llv.com',
    before_state: { status: 'shipped' },
    after_state: { status: 'delivered' },
    metadata: { location: 'Fountain Hills AZ' },
    created_at: '2026-02-17T15:05:00Z',
  },

  // ── Order 5: Margaret Gown Cleaning (in progress) ─────────────────────────
  {
    action: 'order.confirmed',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Gown Cleaning In Progress May 2026',
    client_email: 'client1@test.llv.com',
    before_state: { status: 'requested' },
    after_state: { status: 'confirmed' },
    metadata: { provider: 'RAVE FabriCARE', item: 'Ivory Silk Evening Gown' },
    created_at: '2026-05-12T10:05:00Z',
  },
  {
    action: 'provider.assigned',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Margaret Hartwell Gown Cleaning In Progress May 2026',
    client_email: 'client1@test.llv.com',
    before_state: null,
    after_state: { provider: 'RAVE FabriCARE', response: 'accepted' },
    metadata: { declared_value_cents: 580000, special_instructions: 'no solvents on silk charmeuse' },
    created_at: '2026-05-15T10:05:00Z',
  },

  // ── Order 6: Catherine Valentino Repair ────────────────────────────────────
  {
    action: 'order.confirmed',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Catherine Beaumont Valentino Repair May 2026',
    client_email: 'client2@test.llv.com',
    before_state: { status: 'requested' },
    after_state: { status: 'confirmed' },
    metadata: { provider: 'European Couture Cleaners', item: 'Blush Valentino Couture Gown' },
    created_at: '2026-04-22T11:05:00Z',
  },
  {
    action: 'order.shipped',
    entity_type: 'orders',
    entity_id_type: 'order_notes_key',
    entity_id_hint: 'Catherine Beaumont Valentino Repair May 2026',
    client_email: 'client2@test.llv.com',
    before_state: { status: 'in_preparation' },
    after_state: { status: 'shipped', tracking_number: '1Z999AA20111222333' },
    metadata: { carrier: 'ups', cost_cents: 4800 },
    created_at: '2026-05-24T09:05:00Z',
  },

  // ── Item records ─────────────────────────────────────────────────────────
  {
    action: 'item.added',
    entity_type: 'items',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000101',
    client_email: 'client1@test.llv.com',
    before_state: null,
    after_state: { sku: 'LLV-000001', name: 'Ivory Silk Evening Gown', brand: 'Valentino', status: 'in_storage' },
    metadata: { added_by: 'admin', condition: 'excellent' },
    created_at: '2025-11-25T11:00:00Z',
  },
  {
    action: 'item.condition_updated',
    entity_type: 'items',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000101',
    client_email: 'client1@test.llv.com',
    before_state: { condition: 'excellent' },
    after_state: { condition: 'good', notes: 'Minor wear on hem after gala event' },
    metadata: { inspected_by: 'RAVE FabriCARE' },
    created_at: '2026-02-22T17:00:00Z',
  },
  {
    action: 'item.photo_uploaded',
    entity_type: 'items',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000102',
    client_email: 'client2@test.llv.com',
    before_state: null,
    after_state: { photo_count: 3, ai_analyzed: true },
    metadata: { item_name: 'Blush Valentino Couture Gown', sku: 'LLV-000002' },
    created_at: '2025-11-26T11:00:00Z',
  },
  {
    action: 'item.status_changed',
    entity_type: 'items',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000102',
    client_email: 'client2@test.llv.com',
    before_state: { status: 'in_storage' },
    after_state: { status: 'with_provider' },
    metadata: { provider: 'European Couture Cleaners', reason: 'repair' },
    created_at: '2026-04-22T12:00:00Z',
  },

  // ── Service Tier records ──────────────────────────────────────────────────
  {
    action: 'service_tier.created',
    entity_type: 'service_tiers',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000201',
    client_email: 'client1@test.llv.com',
    before_state: null,
    after_state: { name: 'Seasonal Premier', price_cents: 480000, items_included: 50 },
    metadata: { created_by: 'admin' },
    created_at: '2025-10-01T09:00:00Z',
  },
  {
    action: 'service_tier.updated',
    entity_type: 'service_tiers',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000201',
    client_email: 'client1@test.llv.com',
    before_state: { price_cents: 480000, items_included: 50 },
    after_state: { price_cents: 520000, items_included: 60 },
    metadata: { reason: 'Annual pricing adjustment + capacity increase' },
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    action: 'service_tier.created',
    entity_type: 'service_tiers',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000202',
    client_email: 'client1@test.llv.com',
    before_state: null,
    after_state: { name: 'Seasonal Essentials', price_cents: 240000, items_included: 25 },
    metadata: { created_by: 'admin' },
    created_at: '2025-10-01T09:30:00Z',
  },
  {
    action: 'service_tier.client_assigned',
    entity_type: 'service_tiers',
    entity_id_type: 'literal',
    entity_id_hint: '00000000-0000-0000-0000-000000000202',
    client_email: 'client2@test.llv.com',
    before_state: { assigned_tier: null },
    after_state: { assigned_tier: 'Seasonal Essentials', client: 'Catherine Beaumont' },
    metadata: { assigned_by: 'admin' },
    created_at: '2025-11-26T10:30:00Z',
  },

  // ── Client onboarding records ─────────────────────────────────────────────
  {
    action: 'client.onboarded',
    entity_type: 'profiles',
    entity_id_type: 'client_email',
    entity_id_hint: 'client1@test.llv.com',
    client_email: 'client1@test.llv.com',
    before_state: { onboarding_complete: false },
    after_state: { onboarding_complete: true, founding_member: true },
    metadata: { tier: 'Seasonal Premier' },
    created_at: '2025-11-25T10:00:00Z',
  },
  {
    action: 'client.onboarded',
    entity_type: 'profiles',
    entity_id_type: 'client_email',
    entity_id_hint: 'client2@test.llv.com',
    client_email: 'client2@test.llv.com',
    before_state: { onboarding_complete: false },
    after_state: { onboarding_complete: true, founding_member: true },
    metadata: { tier: 'Seasonal Essentials' },
    created_at: '2025-11-26T10:00:00Z',
  },
  {
    action: 'client.onboarded',
    entity_type: 'profiles',
    entity_id_type: 'client_email',
    entity_id_hint: 'client3@test.llv.com',
    client_email: 'client3@test.llv.com',
    before_state: { onboarding_complete: false },
    after_state: { onboarding_complete: true, founding_member: true },
    metadata: { tier: 'Seasonal Essentials' },
    created_at: '2025-11-28T10:00:00Z',
  },
]

export async function seedAudit(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // Resolve admin profile for actor_id
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (!adminProfile) {
    return { seeded: 0, skipped: 0, errors: ['No admin profile found — cannot seed audit log (actor_id required)'] }
  }

  const actorId = adminProfile.id

  // Load client profiles for entity resolution
  const { data: allProfiles } = await adminClient
    .from('profiles')
    .select('id, email')

  const clientMap: Record<string, string> = {}
  for (const p of allProfiles ?? []) { clientMap[p.email] = p.id }

  for (const entry of SEED_AUDIT) {
    try {
      // Resolve entity_id
      let entityId: string | null = null

      if (entry.entity_id_type === 'order_notes_key') {
        const clientId = clientMap[entry.client_email]
        if (clientId) {
          const { data: order } = await adminClient
            .from('orders')
            .select('id')
            .eq('client_id', clientId)
            .eq('notes', entry.entity_id_hint)
            .maybeSingle()
          entityId = order?.id ?? null
        }
      } else if (entry.entity_id_type === 'client_email') {
        entityId = clientMap[entry.entity_id_hint] ?? null
      } else if (entry.entity_id_type === 'literal') {
        entityId = entry.entity_id_hint
      }

      // Idempotency: check by (actor_id, action, entity_id, created_at)
      const { data: existing } = await adminClient
        .from('admin_audit_log')
        .select('id')
        .eq('actor_id', actorId)
        .eq('action', entry.action)
        .eq('created_at', entry.created_at)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      const { error } = await adminClient.from('admin_audit_log').insert({
        actor_id: actorId,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entityId,
        before_state: entry.before_state,
        after_state: entry.after_state,
        metadata: entry.metadata,
        created_at: entry.created_at,
        is_seed_data: true,
      })

      if (error) throw new Error(error.message)
      seeded++
    } catch (err) {
      errors.push(`"${entry.action}" at ${entry.created_at}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
