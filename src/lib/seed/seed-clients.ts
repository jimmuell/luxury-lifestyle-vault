import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

export const SEED_CLIENT_EMAILS = [
  'client1@test.llv.com',
  'client2@test.llv.com',
  'client3@test.llv.com',
  'client4@test.llv.com',
  'client5@test.llv.com',
]

const SEED_PASSWORD = 'TestLLV2026!'

const SEED_CLIENTS = [
  {
    email: 'client1@test.llv.com',
    full_name: 'Margaret Hartwell',
    phone: '(262) 555-0101',
    tier: 'elite',
    onboarding_complete: true,
    preferred_contact_method: 'email',
    internal_notes: 'Longtime client — joined 2019. Husband Richard frequently travels. Prefers advance notice for all pickups. Strong preference for Brioni and Loro Piana care.',
    wi_address: {
      label: 'Brookfield Residence',
      line1: '4200 N Lake Drive',
      city: 'Brookfield',
      state: 'WI',
      postal_code: '53045',
      is_primary: true,
    },
    az_address: {
      label: 'Scottsdale Residence',
      line1: '7890 E Camelback Rd',
      line2: 'Unit 412',
      city: 'Scottsdale',
      state: 'AZ',
      postal_code: '85251',
      is_primary: false,
    },
  },
  {
    email: 'client2@test.llv.com',
    full_name: 'Catherine Beaumont',
    phone: '(414) 555-0202',
    tier: 'premier',
    onboarding_complete: true,
    preferred_contact_method: 'phone',
    internal_notes: 'Art collector and philanthropist. Attends multiple galas per season. Very particular about French couture care. Do not use any solvent-based process on silk.',
    wi_address: {
      label: 'Milwaukee Residence',
      line1: '1850 N Prospect Ave',
      city: 'Milwaukee',
      state: 'WI',
      postal_code: '53202',
      is_primary: true,
    },
    az_address: {
      label: 'Paradise Valley Estate',
      line1: '6200 E Lincoln Dr',
      city: 'Paradise Valley',
      state: 'AZ',
      postal_code: '85253',
      is_primary: false,
    },
  },
  {
    email: 'client3@test.llv.com',
    full_name: 'James Thornton',
    phone: '(608) 555-0303',
    tier: 'elite',
    onboarding_complete: true,
    preferred_contact_method: 'email',
    internal_notes: 'Retired attorney. Avid golfer — manages two full golf wardrobes (WI summer, AZ winter). Wife Patricia also has items. Coordinate seasonal transitions with 6-week lead.',
    wi_address: {
      label: 'Madison Residence',
      line1: '312 E Gorham St',
      city: 'Madison',
      state: 'WI',
      postal_code: '53703',
      is_primary: true,
    },
    az_address: {
      label: 'Fountain Hills Home',
      line1: '15445 N Eagle Ridge Dr',
      city: 'Fountain Hills',
      state: 'AZ',
      postal_code: '85268',
      is_primary: false,
    },
  },
  {
    email: 'client4@test.llv.com',
    full_name: 'Victoria Simmons',
    phone: '(920) 555-0404',
    tier: 'premier',
    onboarding_complete: false,
    preferred_contact_method: 'email',
    internal_notes: 'New client — onboarding in progress. Has significant fur collection from Chicago storage. Needs intake consultation before first transfer.',
    wi_address: {
      label: 'Green Bay Residence',
      line1: '2100 S Webster Ave',
      city: 'Green Bay',
      state: 'WI',
      postal_code: '54301',
      is_primary: true,
    },
    az_address: {
      label: 'Tempe Condo',
      line1: '960 W University Dr',
      line2: 'Unit 3B',
      city: 'Tempe',
      state: 'AZ',
      postal_code: '85281',
      is_primary: false,
    },
  },
  {
    email: 'client5@test.llv.com',
    full_name: 'Robert Whitmore',
    phone: '(262) 555-0505',
    tier: 'standard',
    onboarding_complete: false,
    preferred_contact_method: 'email',
    internal_notes: 'Referred by Hartwell family. First-time luxury wardrobe service client. Still completing onboarding form. Follow up in 2 weeks.',
    wi_address: {
      label: 'Waukesha Residence',
      line1: '555 N Grand Ave',
      city: 'Waukesha',
      state: 'WI',
      postal_code: '53186',
      is_primary: true,
    },
    az_address: {
      label: 'Mesa Condo',
      line1: '1500 S Longmore',
      line2: 'Unit 201',
      city: 'Mesa',
      state: 'AZ',
      postal_code: '85202',
      is_primary: false,
    },
  },
]

export async function seedClients(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  for (const client of SEED_CLIENTS) {
    try {
      // Idempotency: check if profile already exists by email
      const { data: existing } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', client.email)
        .maybeSingle()

      if (existing) {
        await adminClient.from('profiles').update({ is_seed_data: true }).eq('id', existing.id)

        // If addresses are missing (e.g. prior seed failed mid-flight), insert them now
        const { count: addrCount } = await adminClient
          .from('addresses')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', existing.id)

        if (!addrCount || addrCount === 0) {
          const { error: wiErr } = await adminClient.from('addresses').insert({
            profile_id: existing.id,
            label: client.wi_address.label,
            line1: client.wi_address.line1,
            city: client.wi_address.city,
            state: client.wi_address.state,
            postal_code: client.wi_address.postal_code,
            country: 'US',
            is_primary: client.wi_address.is_primary,
            is_seed_data: true,
          })
          if (wiErr) errors.push(`${client.email} WI address (repair): ${wiErr.message}`)

          const azAddr = client.az_address as typeof client.az_address & { line2?: string }
          const { error: azErr } = await adminClient.from('addresses').insert({
            profile_id: existing.id,
            label: azAddr.label,
            line1: azAddr.line1,
            line2: azAddr.line2 ?? null,
            city: azAddr.city,
            state: azAddr.state,
            postal_code: azAddr.postal_code,
            country: 'US',
            is_primary: azAddr.is_primary,
            is_seed_data: true,
          })
          if (azErr) errors.push(`${client.email} AZ address (repair): ${azErr.message}`)
        }

        skipped++
        continue
      }

      // Create auth user — triggers handle_new_user() which creates profiles row
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: client.email,
        password: SEED_PASSWORD,
        email_confirm: true,
        user_metadata: {
          role: 'client',
          full_name: client.full_name,
        },
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('No user returned from createUser')

      const userId = authData.user.id

      // Update profile with full details + seed flag (trigger may have set partial data)
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          full_name: client.full_name,
          phone: client.phone,
          onboarding_complete: client.onboarding_complete,
          is_seed_data: true,
        })
        .eq('id', userId)

      if (profileError) throw new Error(`Profile update: ${profileError.message}`)

      // Upsert client_profiles — set subscription_active to match onboarding_complete
      // so seeded clients that skip the real Stripe flow still appear fully active
      const { error: cpError } = await adminClient
        .from('client_profiles')
        .upsert({
          profile_id: userId,
          membership_tier: client.tier,
          preferred_contact_method: client.preferred_contact_method,
          internal_notes: client.internal_notes,
          subscription_active: client.onboarding_complete,
          is_seed_data: true,
        }, { onConflict: 'profile_id' })

      if (cpError) throw new Error(`Client profile: ${cpError.message}`)

      // Insert WI address
      const { error: wiErr } = await adminClient.from('addresses').insert({
        profile_id: userId,
        label: client.wi_address.label,
        line1: client.wi_address.line1,
        city: client.wi_address.city,
        state: client.wi_address.state,
        postal_code: client.wi_address.postal_code,
        country: 'US',
        is_primary: client.wi_address.is_primary,
        is_seed_data: true,
      })
      if (wiErr) throw new Error(`WI address: ${wiErr.message}`)

      // Insert AZ address
      const azAddr = client.az_address as typeof client.az_address & { line2?: string }
      const { error: azErr } = await adminClient.from('addresses').insert({
        profile_id: userId,
        label: azAddr.label,
        line1: azAddr.line1,
        line2: azAddr.line2 ?? null,
        city: azAddr.city,
        state: azAddr.state,
        postal_code: azAddr.postal_code,
        country: 'US',
        is_primary: azAddr.is_primary,
        is_seed_data: true,
      })
      if (azErr) throw new Error(`AZ address: ${azErr.message}`)

      seeded++
    } catch (err) {
      errors.push(`${client.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
