import { createAdminClient } from '@/lib/supabase/admin'
import { SEED_CLIENT_EMAILS } from './seed-clients'
import type { SeedResult } from './types'
import type { Database } from '@/types/database'

type ConditionLevel = Database['public']['Enums']['condition_level']

interface SeedCondition {
  item_name: string
  client_email: string
  condition_level: ConditionLevel
  notes: string
  assessed_at: string
}

const SEED_CONDITIONS: SeedCondition[] = [
  {
    item_name: 'Midnight Navy Tuxedo Jacket',
    client_email: 'client1@test.llv.com',
    condition_level: 'pristine',
    notes: 'Received in excellent condition. No signs of wear. All buttons intact. Lining pristine.',
    assessed_at: '2026-02-10T10:00:00Z',
  },
  {
    item_name: 'Midnight Navy Tuxedo Jacket',
    client_email: 'client1@test.llv.com',
    condition_level: 'pristine',
    notes: 'Post-cleaning inspection. Pressed to perfection. Ready for storage.',
    assessed_at: '2026-02-14T14:30:00Z',
  },
  {
    item_name: 'Ivory Silk Evening Gown',
    client_email: 'client1@test.llv.com',
    condition_level: 'excellent',
    notes: 'Received following gala event. Very light perspiration mark at left underarm, treated at intake. Fabric otherwise in excellent condition.',
    assessed_at: '2026-03-01T09:15:00Z',
  },
  {
    item_name: 'Sable Brown Cashmere Overcoat',
    client_email: 'client1@test.llv.com',
    condition_level: 'pristine',
    notes: 'End-of-season assessment. No pilling. Buttons secure. Lining clean. Stored with cedar.',
    assessed_at: '2026-04-05T11:00:00Z',
  },
  {
    item_name: 'Black Tuxedo Trousers',
    client_email: 'client1@test.llv.com',
    condition_level: 'excellent',
    notes: 'Minor press crease noted at left leg after transit. Cleaned and re-pressed. Silk braid intact.',
    assessed_at: '2026-02-10T10:30:00Z',
  },
  {
    item_name: 'Sapphire Silk Cocktail Dress',
    client_email: 'client2@test.llv.com',
    condition_level: 'pristine',
    notes: 'Received from client in new condition. Tags still attached. Stored immediately.',
    assessed_at: '2026-01-20T13:00:00Z',
  },
  {
    item_name: 'Camel Cashmere Wrap Coat',
    client_email: 'client2@test.llv.com',
    condition_level: 'excellent',
    notes: 'Received for end-of-season cleaning. Very light general soiling on cuffs. No damage. Monili trim all intact.',
    assessed_at: '2026-03-15T10:00:00Z',
  },
  {
    item_name: 'Charcoal Herringbone Sport Coat',
    client_email: 'client3@test.llv.com',
    condition_level: 'good',
    notes: 'Received for seasonal cleaning. Light general wear — minor pilling at elbows. Some wrinkling from storage. No staining. Sent to MKE Garment Care.',
    assessed_at: '2026-04-01T09:00:00Z',
  },
  {
    item_name: 'White French-Cuff Dress Shirt',
    client_email: 'client3@test.llv.com',
    condition_level: 'excellent',
    notes: 'Four shirts received. Collar wear on one (noted). All cuffs crisp. Minor collar yellowing on shirt #3 — pre-treated.',
    assessed_at: '2026-04-02T10:00:00Z',
  },
  {
    item_name: 'Walnut Shell Cordovan Derby Shoes',
    client_email: 'client3@test.llv.com',
    condition_level: 'excellent',
    notes: 'End-of-season assessment. Minor heel wear. Leather in excellent condition — high mirror shine retained. Shoe trees in place.',
    assessed_at: '2026-03-20T14:00:00Z',
  },
  {
    item_name: 'Black Patent Leather Oxfords',
    client_email: 'client1@test.llv.com',
    condition_level: 'good',
    notes: 'Received for restoration. Scuffing on right toe box, heel rubber worn through on both. Sent to European Couture Cleaners for restoration service.',
    assessed_at: '2026-04-10T11:00:00Z',
  },
]

export async function seedConditions(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // Load seed clients to get profile IDs
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('email', SEED_CLIENT_EMAILS)

  if (!profiles?.length) {
    return { seeded: 0, skipped: 0, errors: ['No seed clients found — run seed-clients first'] }
  }

  const clientMap: Record<string, string> = {}
  for (const p of profiles) { clientMap[p.email] = p.id }

  // Find an admin to use as assessor; fall back to item owner
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  for (const cond of SEED_CONDITIONS) {
    try {
      const clientId = clientMap[cond.client_email]
      if (!clientId) {
        errors.push(`${cond.item_name}: client not found`)
        continue
      }

      // Look up the item by name + client_id
      const { data: item } = await adminClient
        .from('items')
        .select('id')
        .eq('client_id', clientId)
        .eq('name', cond.item_name)
        .maybeSingle()

      if (!item) {
        errors.push(`${cond.item_name}: item not found — run seed-items first`)
        continue
      }

      // Idempotency: check by item_id + condition_level + assessed_at
      const { data: existing } = await adminClient
        .from('item_conditions')
        .select('id')
        .eq('item_id', item.id)
        .eq('condition_level', cond.condition_level)
        .eq('assessed_at', cond.assessed_at)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      const assessedBy = adminProfile?.id ?? clientId

      const { error } = await adminClient.from('item_conditions').insert({
        item_id: item.id,
        assessed_by: assessedBy,
        condition_level: cond.condition_level,
        notes: cond.notes,
        issues: [],
        assessed_at: cond.assessed_at,
        is_seed_data: true,
      })

      if (error) throw new Error(error.message)
      seeded++
    } catch (err) {
      errors.push(`${cond.item_name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
