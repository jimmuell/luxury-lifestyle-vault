import { createAdminClient } from '@/lib/supabase/admin'
import { SEED_CLIENT_EMAILS } from './seed-clients'
import { qaEmail } from './qa-email'
import {
  MARGARET_SEASONAL_ITEMS,
  MARGARET_INPROGRESS_ITEMS,
  CATHERINE_GALA_ITEMS,
  CATHERINE_INPROGRESS_ITEMS,
  JAMES_SEASONAL_ITEMS,
  JAMES_RESORT_ITEMS,
  JAMES_UPCOMING_ITEMS,
} from './seed-items'
import type { SeedResult } from './types'
import type { Database } from '@/types/database'

type OrderStatus = Database['public']['Enums']['order_status']
type OrderType   = Database['public']['Enums']['order_type']
type ItemLocation = Database['public']['Enums']['item_location']

// ── Helper: look up item IDs for a client by name list ───────────────────────

async function resolveItemIds(
  adminClient: ReturnType<typeof createAdminClient>,
  clientId: string,
  names: string[]
): Promise<{ itemIds: string[]; missing: string[] }> {
  const { data: items } = await adminClient
    .from('items')
    .select('id, name')
    .eq('client_id', clientId)
    .in('name', names)

  const found = new Map<string, string>()
  for (const i of items ?? []) { found.set(i.name, i.id) }

  const itemIds: string[] = []
  const missing: string[] = []

  for (const name of names) {
    const id = found.get(name)
    if (id) { itemIds.push(id) } else { missing.push(name) }
  }

  return { itemIds, missing }
}

// ── Helper: insert status history entries for an order ───────────────────────

async function insertStatusHistory(
  adminClient: ReturnType<typeof createAdminClient>,
  orderId: string,
  actorId: string,
  steps: Array<{ status: OrderStatus; notes: string; created_at: string }>
): Promise<string[]> {
  const errs: string[] = []
  for (const step of steps) {
    const { error } = await adminClient.from('order_status_history').insert({
      order_id: orderId,
      status: step.status,
      actor_profile_id: actorId,
      notes: step.notes,
      created_at: step.created_at,
      is_seed_data: true,
    })
    if (error) errs.push(`status_history(${step.status}): ${error.message}`)
  }
  return errs
}

export async function seedOrders(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // ── Load profiles ─────────────────────────────────────────────────────────
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('email', [...SEED_CLIENT_EMAILS, qaEmail('admin')])

  const clientMap: Record<string, string> = {}
  for (const p of profiles ?? []) { clientMap[p.email] = p.id }

  // Fall back to any admin profile for actor_profile_id
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  const adminId = adminProfile?.id ?? clientMap['client1@test.llv.com'] ?? ''

  // ── Load providers ────────────────────────────────────────────────────────
  const { data: providers } = await adminClient
    .from('providers')
    .select('id, business_name')

  const providerMap: Record<string, string> = {}
  for (const p of providers ?? []) { providerMap[p.business_name] = p.id }

  // ── Load corridor ─────────────────────────────────────────────────────────
  const { data: corridor } = await adminClient
    .from('corridors')
    .select('id')
    .eq('slug', 'wi_az')
    .maybeSingle()

  const corridorId = corridor?.id ?? null

  // ── Load AZ addresses ─────────────────────────────────────────────────────
  const loadAzAddress = async (email: string): Promise<string | null> => {
    const clientId = clientMap[email]
    if (!clientId) return null
    const { data } = await adminClient
      .from('addresses')
      .select('id')
      .eq('profile_id', clientId)
      .eq('state', 'AZ')
      .limit(1)
      .maybeSingle()
    return data?.id ?? null
  }

  const [margaretAzAddr, catherineAzAddr, jamesAzAddr] = await Promise.all([
    loadAzAddress('client1@test.llv.com'),
    loadAzAddress('client2@test.llv.com'),
    loadAzAddress('client3@test.llv.com'),
  ])

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 1: Margaret — Seasonal Rotation WI→AZ (completed, 3 months ago)
  // ═══════════════════════════════════════════════════════════════════════════

  const margaret1Id = clientMap['client1@test.llv.com']
  if (!margaret1Id) {
    errors.push('Margaret profile not found')
  } else {
    try {
      const ORDER1_IDEMPOTENCY_KEY = 'Margaret Hartwell Seasonal Rotation Feb 2026'

      const { data: existingO1 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', margaret1Id)
        .eq('notes', ORDER1_IDEMPOTENCY_KEY)
        .maybeSingle()

      if (existingO1) {
        skipped++
      } else {
        const { data: o1, error: o1Err } = await adminClient
          .from('orders')
          .insert({
            client_id: margaret1Id,
            order_type: 'seasonal_rotation' as OrderType,
            status: 'delivered' as OrderStatus,
            from_location: 'in_storage_wi' as ItemLocation,
            to_address_id: margaretAzAddr,
            requested_delivery_date: '2026-02-20',
            confirmed_delivery_date: '2026-02-22',
            notes: ORDER1_IDEMPOTENCY_KEY,
            admin_notes: 'WI→AZ spring rotation. 25 items. RAVE FabriCARE cleaned all woolens before transit.',
            corridor_id: corridorId,
            stripe_invoice_id: 'in_test_margaret_seasonal_feb2026',
            paid_at: '2026-01-28T12:00:00Z',
            is_rush: false,
            is_seed_data: true,
            total_cents: 59900,
            created_at: '2026-01-25T10:00:00Z',
            updated_at: '2026-02-22T16:00:00Z',
          })
          .select('id')
          .single()

        if (o1Err) throw new Error(`order1 insert: ${o1Err.message}`)
        const orderId = o1.id

        // Status history
        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested',       notes: 'Client submitted seasonal rotation request.',              created_at: '2026-01-25T10:00:00Z' },
          { status: 'confirmed',       notes: 'Admin confirmed. Items pulled from WI storage.',           created_at: '2026-01-28T12:00:00Z' },
          { status: 'dispatched_to_provider', notes: 'Items dispatched to RAVE FabriCARE for pre-transit cleaning.', created_at: '2026-02-01T09:00:00Z' },
          { status: 'in_preparation', notes: 'Cleaning complete. Items packaged for transit.',            created_at: '2026-02-10T14:00:00Z' },
          { status: 'shipped',         notes: 'FedEx shipment underway. Tracking: FX29831004720001.',     created_at: '2026-02-18T08:00:00Z' },
          { status: 'delivered',       notes: 'All 25 items delivered to Scottsdale residence. Client confirmed receipt.', created_at: '2026-02-22T16:00:00Z' },
        ]))

        // Order items
        const { itemIds: o1Items, missing: o1Missing } = await resolveItemIds(adminClient, margaret1Id, MARGARET_SEASONAL_ITEMS)
        for (const miss of o1Missing) { errors.push(`Order 1 missing item: ${miss}`) }

        if (o1Items.length > 0) {
          const orderItemRows = o1Items.map(itemId => ({
            order_id: orderId,
            item_id: itemId,
            unit_price_cents: Math.floor(59900 / o1Items.length),
            is_seed_data: true,
          }))
          const { error: oiErr } = await adminClient.from('order_items').insert(orderItemRows)
          if (oiErr) errors.push(`Order 1 order_items: ${oiErr.message}`)
        }

        // Shipment record
        const { error: shipErr } = await adminClient.from('order_shipments').insert({
          order_id: orderId,
          direction: 'outbound',
          carrier: 'fedex',
          tracking_number: 'FX29831004720001',
          shipped_at: '2026-02-18T08:00:00Z',
          expected_delivery_at: '2026-02-22T12:00:00Z',
          delivered_at: '2026-02-22T16:00:00Z',
          shipping_cost_cents: 18500,
          notes: 'FedEx Express freight. 25-item seasonal rotation. White-glove delivery confirmed.',
          is_seed_data: true,
        })
        if (shipErr) errors.push(`Order 1 shipment: ${shipErr.message}`)

        // Provider assignment (RAVE for pre-transit cleaning)
        const raveId = providerMap['RAVE FabriCARE']
        if (raveId) {
          const { error: poaErr } = await adminClient.from('provider_order_assignments').insert({
            order_id: orderId,
            provider_id: raveId,
            assigned_by_profile_id: adminId,
            pickup_window_start: '2026-02-01T09:00:00Z',
            pickup_window_end: '2026-02-01T12:00:00Z',
            delivery_deadline: '2026-02-10T17:00:00Z',
            prep_instructions: 'Full seasonal clean on all woolens. Press tuxedo jacket. Handle ivory gown with utmost care.',
            declared_value_total_cents: 18750000,  // $187,500
            provider_response: 'accepted',
            is_seed_data: true,
          })
          if (poaErr) errors.push(`Order 1 provider assignment: ${poaErr.message}`)
        }

        // Billing cache entry
        await adminClient.from('billing_history_cache').upsert({
          client_id: margaret1Id,
          stripe_invoice_id: 'in_test_margaret_seasonal_feb2026',
          stripe_subscription_id: 'sub_test_margaret001',
          order_id: orderId,
          amount_cents: 59900,
          status: 'paid',
          description: 'Seasonal Rotation — WI to AZ (25 items, Feb 2026)',
          invoice_date: '2026-01-28T12:00:00Z',
          period_start: '2026-01-25T00:00:00Z',
          period_end: '2026-02-22T00:00:00Z',
          is_seed_data: true,
        }, { onConflict: 'stripe_invoice_id' })

        seeded++
      }
    } catch (err) {
      errors.push(`Order 1 (Margaret seasonal): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 2: Catherine — On-Demand Gala Delivery (completed, 6 weeks ago)
  // ═══════════════════════════════════════════════════════════════════════════

  const catherine2Id = clientMap['client2@test.llv.com']
  if (!catherine2Id) {
    errors.push('Catherine profile not found')
  } else {
    try {
      const ORDER2_KEY = 'Catherine Beaumont Gala On-Demand Apr 2026'

      const { data: existingO2 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', catherine2Id)
        .eq('notes', ORDER2_KEY)
        .maybeSingle()

      if (existingO2) {
        skipped++
      } else {
        const { data: o2, error: o2Err } = await adminClient
          .from('orders')
          .insert({
            client_id: catherine2Id,
            order_type: 'on_demand_item' as OrderType,
            status: 'delivered' as OrderStatus,
            from_location: 'in_storage_az' as ItemLocation,
            to_address_id: catherineAzAddr,
            requested_delivery_date: '2026-04-04',
            confirmed_delivery_date: '2026-04-05',
            notes: ORDER2_KEY,
            admin_notes: 'Gala request — 4 items pulled from AZ storage. Cocktail dress, earrings, shoes, clutch. European Couture confirmed pressing complete.',
            corridor_id: corridorId,
            stripe_invoice_id: 'in_test_catherine_gala_apr2026',
            paid_at: '2026-04-03T10:00:00Z',
            is_rush: false,
            is_seed_data: true,
            total_cents: 30000,
            created_at: '2026-04-02T09:00:00Z',
            updated_at: '2026-04-05T17:00:00Z',
          })
          .select('id')
          .single()

        if (o2Err) throw new Error(`order2 insert: ${o2Err.message}`)
        const orderId = o2.id

        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested',        notes: 'Cocktail dress and accessories for April 6 gala.',           created_at: '2026-04-02T09:00:00Z' },
          { status: 'confirmed',        notes: 'Items confirmed in AZ storage. European Couture notified for pressing.', created_at: '2026-04-03T10:00:00Z' },
          { status: 'dispatched_to_provider', notes: 'Dispatched to European Couture for final pressing.',   created_at: '2026-04-03T14:00:00Z' },
          { status: 'in_preparation',   notes: 'Pressing complete. Items packaged.',                          created_at: '2026-04-04T15:00:00Z' },
          { status: 'shipped',          notes: 'UPS same-day delivery initiated. Tracking: 1Z999AA10123456784.', created_at: '2026-04-05T09:00:00Z' },
          { status: 'delivered',        notes: 'Delivered to Paradise Valley Estate. Catherine confirmed receipt.', created_at: '2026-04-05T17:00:00Z' },
        ]))

        const { itemIds: o2Items, missing: o2Missing } = await resolveItemIds(adminClient, catherine2Id, CATHERINE_GALA_ITEMS)
        for (const miss of o2Missing) { errors.push(`Order 2 missing item: ${miss}`) }

        if (o2Items.length > 0) {
          const { error: oiErr } = await adminClient.from('order_items').insert(
            o2Items.map(itemId => ({ order_id: orderId, item_id: itemId, unit_price_cents: 7500, is_seed_data: true }))
          )
          if (oiErr) errors.push(`Order 2 order_items: ${oiErr.message}`)
        }

        const { error: ship2Err } = await adminClient.from('order_shipments').insert({
          order_id: orderId,
          direction: 'outbound',
          carrier: 'ups',
          tracking_number: '1Z999AA10123456784',
          shipped_at: '2026-04-05T09:00:00Z',
          expected_delivery_at: '2026-04-05T18:00:00Z',
          delivered_at: '2026-04-05T17:00:00Z',
          shipping_cost_cents: 4500,
          is_seed_data: true,
        })
        if (ship2Err) errors.push(`Order 2 shipment: ${ship2Err.message}`)

        const eccId = providerMap['European Couture Cleaners']
        if (eccId) {
          const { error: poa2Err } = await adminClient.from('provider_order_assignments').insert({
            order_id: orderId,
            provider_id: eccId,
            assigned_by_profile_id: adminId,
            pickup_window_start: '2026-04-03T14:00:00Z',
            pickup_window_end: '2026-04-03T16:00:00Z',
            delivery_deadline: '2026-04-04T17:00:00Z',
            prep_instructions: 'Final press on cocktail dress only. Shoes inspection and clean. Handle python clutch with care.',
            declared_value_total_cents: 1345000,
            provider_response: 'accepted',
            is_seed_data: true,
          })
          if (poa2Err) errors.push(`Order 2 provider assignment: ${poa2Err.message}`)
        }

        await adminClient.from('billing_history_cache').upsert({
          client_id: catherine2Id,
          stripe_invoice_id: 'in_test_catherine_gala_apr2026',
          order_id: orderId,
          amount_cents: 30000,
          status: 'paid',
          description: 'On-Demand — Gala delivery (4 items, Apr 2026)',
          invoice_date: '2026-04-03T10:00:00Z',
          is_seed_data: true,
        }, { onConflict: 'stripe_invoice_id' })

        seeded++
      }
    } catch (err) {
      errors.push(`Order 2 (Catherine gala): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 3: James — Seasonal Rotation WI→AZ (completed, 3 months ago)
  // ═══════════════════════════════════════════════════════════════════════════

  const james3Id = clientMap['client3@test.llv.com']
  if (!james3Id) {
    errors.push('James profile not found')
  } else {
    try {
      const ORDER3_KEY = 'James Thornton Seasonal Rotation Feb 2026'

      const { data: existingO3 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', james3Id)
        .eq('notes', ORDER3_KEY)
        .maybeSingle()

      if (existingO3) {
        skipped++
      } else {
        const { data: o3, error: o3Err } = await adminClient
          .from('orders')
          .insert({
            client_id: james3Id,
            order_type: 'seasonal_rotation' as OrderType,
            status: 'delivered' as OrderStatus,
            from_location: 'in_storage_wi' as ItemLocation,
            to_address_id: jamesAzAddr,
            requested_delivery_date: '2026-02-15',
            confirmed_delivery_date: '2026-02-17',
            notes: ORDER3_KEY,
            admin_notes: 'WI→AZ spring rotation for James. 20 items. Coordinated with housekeeper Maria.',
            corridor_id: corridorId,
            stripe_invoice_id: 'in_test_james_seasonal_feb2026',
            paid_at: '2026-01-30T11:00:00Z',
            is_rush: false,
            is_seed_data: true,
            total_cents: 59900,
            created_at: '2026-01-28T14:00:00Z',
            updated_at: '2026-02-17T15:00:00Z',
          })
          .select('id')
          .single()

        if (o3Err) throw new Error(`order3 insert: ${o3Err.message}`)
        const orderId = o3.id

        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested',       notes: 'James submitted AZ seasonal rotation request.',              created_at: '2026-01-28T14:00:00Z' },
          { status: 'confirmed',       notes: 'Confirmed. Coordinating with Madison Premium Cleaners.',     created_at: '2026-01-30T11:00:00Z' },
          { status: 'dispatched_to_provider', notes: 'Dispatched to Madison Premium Cleaners.',            created_at: '2026-02-03T09:00:00Z' },
          { status: 'in_preparation', notes: 'Cleaning done. Items boxed for transit.',                    created_at: '2026-02-10T12:00:00Z' },
          { status: 'shipped',         notes: 'FedEx. Tracking: FX29831005830002.',                        created_at: '2026-02-13T08:00:00Z' },
          { status: 'delivered',       notes: 'Delivered to Fountain Hills. James confirmed.',              created_at: '2026-02-17T15:00:00Z' },
        ]))

        const { itemIds: o3Items, missing: o3Missing } = await resolveItemIds(adminClient, james3Id, JAMES_SEASONAL_ITEMS)
        for (const miss of o3Missing) { errors.push(`Order 3 missing item: ${miss}`) }

        if (o3Items.length > 0) {
          const { error: oi3Err } = await adminClient.from('order_items').insert(
            o3Items.map(itemId => ({ order_id: orderId, item_id: itemId, unit_price_cents: Math.floor(59900 / o3Items.length), is_seed_data: true }))
          )
          if (oi3Err) errors.push(`Order 3 order_items: ${oi3Err.message}`)
        }

        const { error: ship3Err } = await adminClient.from('order_shipments').insert({
          order_id: orderId,
          direction: 'outbound',
          carrier: 'fedex',
          tracking_number: 'FX29831005830002',
          shipped_at: '2026-02-13T08:00:00Z',
          expected_delivery_at: '2026-02-17T12:00:00Z',
          delivered_at: '2026-02-17T15:00:00Z',
          shipping_cost_cents: 14500,
          is_seed_data: true,
        })
        if (ship3Err) errors.push(`Order 3 shipment: ${ship3Err.message}`)

        const madisonId = providerMap['Madison Premium Cleaners']
        if (madisonId) {
          const { error: poa3Err } = await adminClient.from('provider_order_assignments').insert({
            order_id: orderId,
            provider_id: madisonId,
            assigned_by_profile_id: adminId,
            pickup_window_start: '2026-02-03T09:00:00Z',
            pickup_window_end: '2026-02-03T12:00:00Z',
            delivery_deadline: '2026-02-10T17:00:00Z',
            prep_instructions: 'Seasonal cleaning, light press on all suiting. Golf shoes cleaned and reconditioned.',
            declared_value_total_cents: 2850000,
            provider_response: 'accepted',
            is_seed_data: true,
          })
          if (poa3Err) errors.push(`Order 3 provider assignment: ${poa3Err.message}`)
        }

        await adminClient.from('billing_history_cache').upsert({
          client_id: james3Id,
          stripe_invoice_id: 'in_test_james_seasonal_feb2026',
          stripe_subscription_id: 'sub_test_james003',
          order_id: orderId,
          amount_cents: 59900,
          status: 'paid',
          description: 'Seasonal Rotation — WI to AZ (20 items, Feb 2026)',
          invoice_date: '2026-01-30T11:00:00Z',
          period_start: '2026-01-28T00:00:00Z',
          period_end: '2026-02-17T00:00:00Z',
          is_seed_data: true,
        }, { onConflict: 'stripe_invoice_id' })

        seeded++
      }
    } catch (err) {
      errors.push(`Order 3 (James seasonal): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 4: James — On-Demand Golf Resort Delivery (completed, 1 month ago)
  // ═══════════════════════════════════════════════════════════════════════════

  if (james3Id) {
    try {
      const ORDER4_KEY = 'James Thornton Golf Resort On-Demand Apr 2026'

      const { data: existingO4 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', james3Id)
        .eq('notes', ORDER4_KEY)
        .maybeSingle()

      if (existingO4) {
        skipped++
      } else {
        const { data: o4, error: o4Err } = await adminClient
          .from('orders')
          .insert({
            client_id: james3Id,
            order_type: 'on_demand_item' as OrderType,
            status: 'delivered' as OrderStatus,
            from_location: 'in_storage_az' as ItemLocation,
            to_address_id: jamesAzAddr,
            requested_delivery_date: '2026-04-20',
            confirmed_delivery_date: '2026-04-21',
            notes: ORDER4_KEY,
            admin_notes: 'Golf resort delivery — Mastel Dry Cleaning prepped items. Delivered to TPC Scottsdale resort.',
            corridor_id: corridorId,
            stripe_invoice_id: 'in_test_james_golf_apr2026',
            paid_at: '2026-04-19T11:00:00Z',
            is_rush: false,
            is_seed_data: true,
            total_cents: 22500,
            created_at: '2026-04-18T10:00:00Z',
            updated_at: '2026-04-21T13:00:00Z',
          })
          .select('id')
          .single()

        if (o4Err) throw new Error(`order4 insert: ${o4Err.message}`)
        const orderId = o4.id

        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested',       notes: 'Golf outfit for resort stay at TPC Scottsdale.',             created_at: '2026-04-18T10:00:00Z' },
          { status: 'confirmed',       notes: 'Items located in AZ storage. Mastel scheduled.',            created_at: '2026-04-19T11:00:00Z' },
          { status: 'dispatched_to_provider', notes: 'To Mastel Dry Cleaning for press.',                  created_at: '2026-04-19T14:00:00Z' },
          { status: 'in_preparation', notes: 'Items pressed and packaged.',                                 created_at: '2026-04-20T12:00:00Z' },
          { status: 'shipped',         notes: 'UPS express. Tracking: 1Z999AA10987654321.',                 created_at: '2026-04-21T08:00:00Z' },
          { status: 'delivered',       notes: 'Delivered to TPC Scottsdale. James confirmed receipt.',      created_at: '2026-04-21T13:00:00Z' },
        ]))

        const { itemIds: o4Items, missing: o4Missing } = await resolveItemIds(adminClient, james3Id, JAMES_RESORT_ITEMS)
        for (const miss of o4Missing) { errors.push(`Order 4 missing item: ${miss}`) }

        if (o4Items.length > 0) {
          const { error: oi4Err } = await adminClient.from('order_items').insert(
            o4Items.map(itemId => ({ order_id: orderId, item_id: itemId, unit_price_cents: 7500, is_seed_data: true }))
          )
          if (oi4Err) errors.push(`Order 4 order_items: ${oi4Err.message}`)
        }

        const { error: ship4Err } = await adminClient.from('order_shipments').insert({
          order_id: orderId,
          direction: 'outbound',
          carrier: 'ups',
          tracking_number: '1Z999AA10987654321',
          shipped_at: '2026-04-21T08:00:00Z',
          expected_delivery_at: '2026-04-21T14:00:00Z',
          delivered_at: '2026-04-21T13:00:00Z',
          shipping_cost_cents: 3200,
          is_seed_data: true,
        })
        if (ship4Err) errors.push(`Order 4 shipment: ${ship4Err.message}`)

        await adminClient.from('billing_history_cache').upsert({
          client_id: james3Id,
          stripe_invoice_id: 'in_test_james_golf_apr2026',
          order_id: orderId,
          amount_cents: 22500,
          status: 'paid',
          description: 'On-Demand — Golf resort delivery (4 items, Apr 2026)',
          invoice_date: '2026-04-19T11:00:00Z',
          is_seed_data: true,
        }, { onConflict: 'stripe_invoice_id' })

        seeded++
      }
    } catch (err) {
      errors.push(`Order 4 (James golf): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 5: Margaret — On-Demand Gown Cleaning (IN PROGRESS: in_preparation)
  // ═══════════════════════════════════════════════════════════════════════════

  if (margaret1Id) {
    try {
      const ORDER5_KEY = 'Margaret Hartwell Gown Cleaning In Progress May 2026'

      const { data: existingO5 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', margaret1Id)
        .eq('notes', ORDER5_KEY)
        .maybeSingle()

      if (existingO5) {
        skipped++
      } else {
        const { data: o5, error: o5Err } = await adminClient
          .from('orders')
          .insert({
            client_id: margaret1Id,
            order_type: 'on_demand_item' as OrderType,
            status: 'in_preparation' as OrderStatus,
            from_location: 'at_provider_az' as ItemLocation,
            to_address_id: margaretAzAddr,
            requested_delivery_date: '2026-06-01',
            notes: ORDER5_KEY,
            admin_notes: 'Ivory Carolina Herrera gown at RAVE FabriCARE for wet clean after gala. Beading inspection requested.',
            corridor_id: corridorId,
            is_rush: false,
            is_seed_data: true,
            total_cents: 28000,
            created_at: '2026-05-10T09:00:00Z',
            updated_at: '2026-05-22T11:00:00Z',
          })
          .select('id')
          .single()

        if (o5Err) throw new Error(`order5 insert: ${o5Err.message}`)
        const orderId = o5.id

        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested',       notes: 'Post-gala gown cleaning request.',                          created_at: '2026-05-10T09:00:00Z' },
          { status: 'confirmed',       notes: 'Confirmed. RAVE FabriCARE notified.',                       created_at: '2026-05-12T10:00:00Z' },
          { status: 'dispatched_to_provider', notes: 'Gown picked up by RAVE FabriCARE.',                  created_at: '2026-05-15T10:00:00Z' },
          { status: 'in_preparation', notes: 'RAVE FabriCARE: wet clean in progress. Beading repair assessed.', created_at: '2026-05-22T11:00:00Z' },
        ]))

        const { itemIds: o5Items, missing: o5Missing } = await resolveItemIds(adminClient, margaret1Id, MARGARET_INPROGRESS_ITEMS)
        for (const miss of o5Missing) { errors.push(`Order 5 missing item: ${miss}`) }

        if (o5Items.length > 0) {
          const { error: oi5Err } = await adminClient.from('order_items').insert(
            o5Items.map(itemId => ({ order_id: orderId, item_id: itemId, unit_price_cents: 28000, provider_service_stage: 'cleaning', is_seed_data: true }))
          )
          if (oi5Err) errors.push(`Order 5 order_items: ${oi5Err.message}`)
        }

        const raveId = providerMap['RAVE FabriCARE']
        if (raveId) {
          const { error: poa5Err } = await adminClient.from('provider_order_assignments').insert({
            order_id: orderId,
            provider_id: raveId,
            assigned_by_profile_id: adminId,
            pickup_window_start: '2026-05-15T09:00:00Z',
            pickup_window_end: '2026-05-15T12:00:00Z',
            delivery_deadline: '2026-06-01T17:00:00Z',
            prep_instructions: 'Wet clean ONLY — no solvents on silk charmeuse. Inspect all beading on neckline. Flag any pulls or loose threads before proceeding.',
            declared_value_total_cents: 580000,
            provider_response: 'accepted',
            is_seed_data: true,
          })
          if (poa5Err) errors.push(`Order 5 provider assignment: ${poa5Err.message}`)
        }

        seeded++
      }
    } catch (err) {
      errors.push(`Order 5 (Margaret in-progress): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 6: Catherine — Valentino Repair (IN PROGRESS: shipped)
  // ═══════════════════════════════════════════════════════════════════════════

  if (catherine2Id) {
    try {
      const ORDER6_KEY = 'Catherine Beaumont Valentino Repair May 2026'

      const { data: existingO6 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', catherine2Id)
        .eq('notes', ORDER6_KEY)
        .maybeSingle()

      if (existingO6) {
        skipped++
      } else {
        const { data: o6, error: o6Err } = await adminClient
          .from('orders')
          .insert({
            client_id: catherine2Id,
            order_type: 'on_demand_item' as OrderType,
            status: 'shipped' as OrderStatus,
            from_location: 'at_provider_az' as ItemLocation,
            to_address_id: catherineAzAddr,
            requested_delivery_date: '2026-06-05',
            confirmed_delivery_date: '2026-06-05',
            notes: ORDER6_KEY,
            admin_notes: 'Valentino silk tulle gown pull repair at European Couture. Sophia confirmed seam repair complete. Shipping to client now.',
            corridor_id: corridorId,
            is_rush: false,
            is_seed_data: true,
            total_cents: 45000,
            created_at: '2026-04-20T10:00:00Z',
            updated_at: '2026-05-24T09:00:00Z',
          })
          .select('id')
          .single()

        if (o6Err) throw new Error(`order6 insert: ${o6Err.message}`)
        const orderId = o6.id

        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested',       notes: 'Valentino gown pulled sleeve repair — urgent before summer gala.',  created_at: '2026-04-20T10:00:00Z' },
          { status: 'confirmed',       notes: 'European Couture confirmed they can repair silk tulle seam.',        created_at: '2026-04-22T11:00:00Z' },
          { status: 'dispatched_to_provider', notes: 'Gown with European Couture Cleaners for repair.',            created_at: '2026-04-25T10:00:00Z' },
          { status: 'in_preparation', notes: 'Repair completed. Post-repair clean and press in progress.',          created_at: '2026-05-15T14:00:00Z' },
          { status: 'shipped',         notes: 'UPS. Tracking: 1Z999AA20111222333.',                                created_at: '2026-05-24T09:00:00Z' },
        ]))

        const { itemIds: o6Items, missing: o6Missing } = await resolveItemIds(adminClient, catherine2Id, CATHERINE_INPROGRESS_ITEMS)
        for (const miss of o6Missing) { errors.push(`Order 6 missing item: ${miss}`) }

        if (o6Items.length > 0) {
          const { error: oi6Err } = await adminClient.from('order_items').insert(
            o6Items.map(itemId => ({ order_id: orderId, item_id: itemId, unit_price_cents: 45000, provider_service_stage: 'ready_for_pickup', is_seed_data: true }))
          )
          if (oi6Err) errors.push(`Order 6 order_items: ${oi6Err.message}`)
        }

        const { error: ship6Err } = await adminClient.from('order_shipments').insert({
          order_id: orderId,
          direction: 'outbound',
          carrier: 'ups',
          tracking_number: '1Z999AA20111222333',
          shipped_at: '2026-05-24T09:00:00Z',
          expected_delivery_at: '2026-05-27T17:00:00Z',
          shipping_cost_cents: 4800,
          notes: 'White-glove handling. Signature required.',
          is_seed_data: true,
        })
        if (ship6Err) errors.push(`Order 6 shipment: ${ship6Err.message}`)

        const ecc6Id = providerMap['European Couture Cleaners']
        if (ecc6Id) {
          const { error: poa6Err } = await adminClient.from('provider_order_assignments').insert({
            order_id: orderId,
            provider_id: ecc6Id,
            assigned_by_profile_id: adminId,
            pickup_window_start: '2026-04-25T10:00:00Z',
            pickup_window_end: '2026-04-25T12:00:00Z',
            delivery_deadline: '2026-05-20T17:00:00Z',
            prep_instructions: 'Repair pulled seam on left sleeve — silk tulle over crepe. Re-press after repair. No solvents on blush tulle.',
            declared_value_total_cents: 850000,
            provider_response: 'accepted',
            is_seed_data: true,
          })
          if (poa6Err) errors.push(`Order 6 provider assignment: ${poa6Err.message}`)
        }

        seeded++
      }
    } catch (err) {
      errors.push(`Order 6 (Catherine in-progress): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER 7: James — Upcoming Seasonal Rotation (REQUESTED, just submitted)
  // ═══════════════════════════════════════════════════════════════════════════

  if (james3Id) {
    try {
      const ORDER7_KEY = 'James Thornton Seasonal Rotation Request Jun 2026'

      const { data: existingO7 } = await adminClient
        .from('orders')
        .select('id')
        .eq('client_id', james3Id)
        .eq('notes', ORDER7_KEY)
        .maybeSingle()

      if (existingO7) {
        skipped++
      } else {
        const { data: o7, error: o7Err } = await adminClient
          .from('orders')
          .insert({
            client_id: james3Id,
            order_type: 'seasonal_rotation' as OrderType,
            status: 'requested' as OrderStatus,
            from_location: 'in_storage_az' as ItemLocation,
            to_address_id: null,  // WI delivery — TBD after confirmation
            requested_delivery_date: '2026-06-15',
            notes: ORDER7_KEY,
            admin_notes: null,
            corridor_id: corridorId,
            is_rush: false,
            is_seed_data: true,
            total_cents: null,
            created_at: '2026-05-25T08:30:00Z',
            updated_at: '2026-05-25T08:30:00Z',
          })
          .select('id')
          .single()

        if (o7Err) throw new Error(`order7 insert: ${o7Err.message}`)
        const orderId = o7.id

        errors.push(...await insertStatusHistory(adminClient, orderId, adminId, [
          { status: 'requested', notes: 'James submitted fall rotation request — AZ to WI. Returning to Madison June 15.', created_at: '2026-05-25T08:30:00Z' },
        ]))

        const { itemIds: o7Items, missing: o7Missing } = await resolveItemIds(adminClient, james3Id, JAMES_UPCOMING_ITEMS)
        for (const miss of o7Missing) { errors.push(`Order 7 missing item: ${miss}`) }

        if (o7Items.length > 0) {
          const { error: oi7Err } = await adminClient.from('order_items').insert(
            o7Items.map(itemId => ({ order_id: orderId, item_id: itemId, is_seed_data: true }))
          )
          if (oi7Err) errors.push(`Order 7 order_items: ${oi7Err.message}`)
        }

        seeded++
      }
    } catch (err) {
      errors.push(`Order 7 (James upcoming): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
