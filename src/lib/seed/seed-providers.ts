import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

const SEED_PASSWORD = 'TestLLV2026!'

const SEED_PROVIDERS = [
  {
    business_name: 'RAVE FabriCARE',
    contact_name: 'Michael Rave',
    email: 'care@ravefabricare.com',
    phone: '(480) 555-0201',
    address_line1: '8900 E Pinnacle Peak Rd',
    city: 'Scottsdale',
    state: 'AZ',
    postal_code: '85255',
    services: ['dry_cleaning', 'wet_cleaning', 'pressing_steaming', 'leather_care'] as const,
    capacity_per_week: 120,
    turnaround_days_min: 2,
    turnaround_days_max: 5,
    notes: 'Premier luxury garment care specialist serving Scottsdale since 1998. Specializes in haute couture and European designer pieces.',
  },
  {
    business_name: 'European Couture Cleaners',
    contact_name: 'Sophia Marchetti',
    email: 'sophia@europeancouture.com',
    phone: '(480) 555-0202',
    address_line1: '7350 E Shoeman Ln',
    city: 'Scottsdale',
    state: 'AZ',
    postal_code: '85251',
    services: ['dry_cleaning', 'hand_wash', 'alterations', 'repair', 'shoe_care'] as const,
    capacity_per_week: 80,
    turnaround_days_min: 3,
    turnaround_days_max: 7,
    notes: 'Family-owned European-style couture cleaners. Known for meticulous hand-finishing and couture alterations. Preferred for delicate eveningwear.',
  },
  {
    business_name: 'Mastel Dry Cleaning',
    contact_name: 'David Mastel',
    email: 'david@mastellcleaners.com',
    phone: '(480) 555-0203',
    address_line1: '15250 N Hayden Rd',
    city: 'Scottsdale',
    state: 'AZ',
    postal_code: '85260',
    services: ['dry_cleaning', 'pressing_steaming', 'storage', 'shoe_care'] as const,
    capacity_per_week: 200,
    turnaround_days_min: 1,
    turnaround_days_max: 3,
    notes: 'High-volume luxury cleaner with same-day express service available. Excellent for suiting and structured garments. North Scottsdale location.',
  },
  {
    business_name: 'Milwaukee Garment Care',
    contact_name: 'Janet Kowalski',
    email: 'info@milwaukeegarmentcare.com',
    phone: '(414) 555-0301',
    address_line1: '2200 N Prospect Ave',
    city: 'Milwaukee',
    state: 'WI',
    postal_code: '53202',
    services: ['dry_cleaning', 'wet_cleaning', 'pressing_steaming', 'alterations'] as const,
    capacity_per_week: 90,
    turnaround_days_min: 2,
    turnaround_days_max: 4,
    notes: 'Wisconsin primary provider. Serves Milwaukee metro and Brookfield corridor. Reliable partner for fall/winter transition cleaning.',
  },
  {
    business_name: 'Madison Premium Cleaners',
    contact_name: 'Thomas Berg',
    email: 'thomas@madisonpremium.com',
    phone: '(608) 555-0302',
    address_line1: '411 State St',
    city: 'Madison',
    state: 'WI',
    postal_code: '53703',
    services: ['dry_cleaning', 'hand_wash', 'pressing_steaming', 'leather_care'] as const,
    capacity_per_week: 60,
    turnaround_days_min: 2,
    turnaround_days_max: 5,
    notes: 'Wisconsin secondary provider covering Madison and Dane County. Boutique operation with strong attention to detail.',
  },
]

export async function seedProviders(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  for (const provider of SEED_PROVIDERS) {
    try {
      // Check if provider row already exists and is linked to an auth profile
      const { data: existing } = await adminClient
        .from('providers')
        .select('id, profile_id')
        .eq('business_name', provider.business_name)
        .maybeSingle()

      if (existing?.profile_id) {
        await adminClient.from('providers').update({ is_seed_data: true }).eq('id', existing.id)
        skipped++
        continue
      }

      // Find or create the auth user for this provider
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', provider.email)
        .maybeSingle()

      let userId: string

      if (existingProfile) {
        userId = existingProfile.id
      } else {
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: provider.email,
          password: SEED_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: provider.contact_name },
        })
        if (authError) throw new Error(authError.message)
        if (!authData.user) throw new Error('No user returned from createUser')
        userId = authData.user.id
      }

      // Set role=provider (trigger defaults to 'client'), full_name, phone, seed flag
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          role: 'provider',
          full_name: provider.contact_name,
          phone: provider.phone,
          is_seed_data: true,
        })
        .eq('id', userId)
      if (profileError) throw new Error(`Profile update: ${profileError.message}`)

      if (existing) {
        // Row exists but profile_id was null — link it
        const { error } = await adminClient
          .from('providers')
          .update({ profile_id: userId, is_seed_data: true })
          .eq('id', existing.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await adminClient.from('providers').insert({
          ...provider,
          services: [...provider.services],
          profile_id: userId,
          is_active: true,
          is_seed_data: true,
        } as never)
        if (error) throw new Error(error.message)
      }

      seeded++
    } catch (err) {
      errors.push(`${provider.business_name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
