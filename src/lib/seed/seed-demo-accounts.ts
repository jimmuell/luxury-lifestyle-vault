import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

const DEMO_CLIENT_EMAIL   = 'demo.client@llv.dev'
const DEMO_ADMIN_EMAIL    = 'demo.admin@llv.dev'
const DEMO_INVESTOR_EMAIL = 'demo.investor@llv.dev'
const DEMO_PASSWORD       = 'demo1234'

// 6 items spread across categories to give the demo dashboard substance
const DEMO_ITEMS = [
  { name: 'Wool Overcoat — Charcoal',  category: 'outerwear'      as const, brand: 'Loro Piana',          color: 'Charcoal', season: 'fall_winter',   status: 'stored'      as const },
  { name: 'Navy Wool Suit',            category: 'suiting'        as const, brand: 'Brioni',              color: 'Navy',     season: 'fall_winter',   status: 'stored'      as const },
  { name: 'White Poplin Dress Shirt',  category: 'shirts_blouses' as const, brand: 'Turnbull & Asser',    color: 'White',    season: 'all',           status: 'stored'      as const },
  { name: 'Cashmere Crewneck — Ivory', category: 'knitwear'       as const, brand: 'Brunello Cucinelli',  color: 'Ivory',    season: 'fall_winter',   status: 'stored'      as const },
  { name: 'Linen Midi Dress — Sand',   category: 'dresses'        as const, brand: 'Loro Piana',          color: 'Sand',     season: 'spring_summer', status: 'delivered'   as const },
  { name: 'Black Oxford Shoes',        category: 'footwear'       as const, brand: 'John Lobb',           color: 'Black',    season: 'all',           status: 'stored'      as const },
]

export async function seedDemoAccounts(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // ── Demo Admin Account ────────────────────────────────────────────────────

  try {
    const { data: existingAdmin } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', DEMO_ADMIN_EMAIL)
      .maybeSingle()

    if (existingAdmin) {
      // Ensure is_seed_data and role are correct
      await adminClient.from('profiles')
        .update({ role: 'admin', is_seed_data: true })
        .eq('id', existingAdmin.id)
      skipped++
    } else {
      const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.admin.createUser({
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'Demo Admin' },
      })
      if (adminAuthErr) throw new Error(adminAuthErr.message)
      if (!adminAuth.user) throw new Error('No user returned')

      await adminClient.from('profiles').update({
        full_name: 'Demo Admin',
        role: 'admin',
        onboarding_complete: true,
        is_seed_data: true,
      }).eq('id', adminAuth.user.id)

      seeded++
    }
  } catch (err) {
    errors.push(`${DEMO_ADMIN_EMAIL}: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── Demo Client Account ───────────────────────────────────────────────────

  try {
    const { data: existingClient } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', DEMO_CLIENT_EMAIL)
      .maybeSingle()

    let clientId: string

    if (existingClient) {
      clientId = existingClient.id
      await adminClient.from('profiles').update({ is_seed_data: true }).eq('id', clientId)
      skipped++
    } else {
      const { data: clientAuth, error: clientAuthErr } = await adminClient.auth.admin.createUser({
        email: DEMO_CLIENT_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'client', full_name: 'Demo Client' },
      })
      if (clientAuthErr) throw new Error(clientAuthErr.message)
      if (!clientAuth.user) throw new Error('No user returned')

      clientId = clientAuth.user.id

      await adminClient.from('profiles').update({
        full_name: 'Demo Client',
        phone: '(480) 555-0199',
        role: 'client',
        onboarding_complete: true,
        is_seed_data: true,
      }).eq('id', clientId)

      // Resolve Seasonal Essentials tier
      const { data: tier } = await adminClient
        .from('service_tiers')
        .select('id, stripe_price_id_current')
        .eq('name', 'Seasonal Essentials')
        .maybeSingle()

      // client_profiles
      const { error: cpErr } = await adminClient.from('client_profiles').upsert({
        profile_id: clientId,
        membership_tier: 'founding',
        preferred_contact_method: 'email',
        subscription_active: true,
        founding_member: true,
        stripe_customer_id: 'cus_demo_client001',
        is_seed_data: true,
      }, { onConflict: 'profile_id' })
      if (cpErr) throw new Error(`client_profiles: ${cpErr.message}`)

      // Addresses
      const { error: wiErr } = await adminClient.from('addresses').insert({
        profile_id: clientId,
        label: 'Brookfield Home',
        line1: '3200 N Brookfield Rd',
        city: 'Brookfield',
        state: 'WI',
        postal_code: '53045',
        country: 'US',
        is_primary: true,
        is_seed_data: true,
      }).select('id').single()
      if (wiErr) throw new Error(`WI address: ${wiErr.message}`)

      const { data: azAddr, error: azErr } = await adminClient.from('addresses').insert({
        profile_id: clientId,
        label: 'Scottsdale Residence',
        line1: '8700 E Camelback Rd',
        line2: 'Unit 205',
        city: 'Scottsdale',
        state: 'AZ',
        postal_code: '85251',
        country: 'US',
        is_primary: false,
        is_seed_data: true,
      }).select('id').single()
      if (azErr) throw new Error(`AZ address: ${azErr.message}`)

      // Subscription (uses fake Stripe IDs — sufficient for UI testing)
      if (tier) {
        const { error: subErr } = await adminClient.from('client_subscriptions').insert({
          client_id: clientId,
          service_tier_id: tier.id,
          stripe_subscription_id: 'sub_demo_client001',
          stripe_price_id: tier.stripe_price_id_current ?? 'price_demo_essentials',
          status: 'active',
          current_period_start: '2025-11-01T00:00:00Z',
          current_period_end:   '2026-11-01T00:00:00Z',
          cancel_at_period_end: false,
          founding_member_discount_applied: true,
          is_seed_data: true,
        })
        if (subErr) errors.push(`${DEMO_CLIENT_EMAIL} subscription: ${subErr.message}`)
      }

      // Wardrobe items
      const itemInserts = DEMO_ITEMS.map(item => ({
        client_id: clientId,
        name: item.name,
        category: item.category,
        brand: item.brand,
        color: item.color,
        season: item.season,
        status: item.status,
        is_seed_data: true,
      }))
      const { data: createdItems, error: itemsErr } = await adminClient
        .from('items')
        .insert(itemInserts)
        .select('id, name')
      if (itemsErr) throw new Error(`items: ${itemsErr.message}`)

      // One past completed seasonal rotation order
      const corridor = await adminClient
        .from('corridors')
        .select('id')
        .eq('slug', 'wi_az')
        .maybeSingle()

      if (createdItems?.length && corridor.data && azAddr) {
        const orderItemIds = createdItems.slice(0, 3).map(i => i.id)

        const { data: order, error: orderErr } = await adminClient.from('orders').insert({
          client_id: clientId,
          order_type: 'seasonal_rotation',
          status: 'delivered',
          corridor_id: corridor.data.id,
          to_address_id: azAddr.id,
          requested_delivery_date: '2025-10-15',
          total_cents: 29900,
          is_seed_data: true,
        }).select('id').single()

        if (orderErr) {
          errors.push(`${DEMO_CLIENT_EMAIL} order: ${orderErr.message}`)
        } else if (order) {
          // Order items
          await adminClient.from('order_items').insert(
            orderItemIds.map(itemId => ({
              order_id: order.id,
              item_id: itemId,
              is_seed_data: true,
            }))
          )

          // Brief status history
          const adminProfile = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', DEMO_ADMIN_EMAIL)
            .maybeSingle()

          const actorId = adminProfile.data?.id ?? clientId
          const steps = [
            { status: 'requested' as const,  notes: 'Fall WI→AZ rotation requested', created_at: '2025-09-20T10:00:00Z' },
            { status: 'confirmed' as const,  notes: 'Confirmed by concierge',         created_at: '2025-09-21T09:00:00Z' },
            { status: 'shipped'   as const,  notes: 'Items collected and shipped',     created_at: '2025-10-10T14:00:00Z' },
            { status: 'delivered' as const,  notes: 'Delivered to Scottsdale address', created_at: '2025-10-15T11:30:00Z' },
          ]
          for (const step of steps) {
            await adminClient.from('order_status_history').insert({
              order_id: order.id,
              status: step.status,
              actor_profile_id: actorId,
              notes: step.notes,
              created_at: step.created_at,
              is_seed_data: true,
            })
          }
        }
      }

      seeded++
    }
  } catch (err) {
    errors.push(`${DEMO_CLIENT_EMAIL}: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── Demo Investor Account ─────────────────────────────────────────────────

  try {
    const { data: existingInvestor } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', DEMO_INVESTOR_EMAIL)
      .maybeSingle()

    if (existingInvestor) {
      await adminClient.from('profiles')
        .update({ role: 'investor', nda_acknowledged: true, is_seed_data: true })
        .eq('id', existingInvestor.id)
      skipped++
    } else {
      const { data: investorAuth, error: investorAuthErr } = await adminClient.auth.admin.createUser({
        email: DEMO_INVESTOR_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'investor', full_name: 'Demo Investor' },
      })
      if (investorAuthErr) throw new Error(investorAuthErr.message)
      if (!investorAuth.user) throw new Error('No user returned')

      await adminClient.from('profiles').update({
        full_name: 'Demo Investor',
        role: 'investor',
        onboarding_complete: true,
        nda_acknowledged: true,
        is_seed_data: true,
      }).eq('id', investorAuth.user.id)

      seeded++
    }
  } catch (err) {
    errors.push(`${DEMO_INVESTOR_EMAIL}: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { seeded, skipped, errors }
}
