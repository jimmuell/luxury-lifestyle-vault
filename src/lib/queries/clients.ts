import { createClient } from '@/lib/supabase/server'

export async function getAllClientsWithItemCounts() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, onboarding_complete, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false })
  if (error) throw error

  if (!profiles || profiles.length === 0) return []

  const clientIds = profiles.map(p => p.id)
  const { data: itemCounts } = await supabase
    .from('items')
    .select('client_id')
    .in('client_id', clientIds)

  const countMap: Record<string, number> = {}
  for (const row of itemCounts ?? []) {
    countMap[row.client_id] = (countMap[row.client_id] ?? 0) + 1
  }

  const { data: clientProfiles } = await supabase
    .from('client_profiles')
    .select('profile_id, membership_tier, internal_notes')
    .in('profile_id', clientIds)

  const cpMap: Record<string, { membership_tier: string | null; internal_notes: string | null }> = {}
  for (const cp of clientProfiles ?? []) {
    cpMap[cp.profile_id] = { membership_tier: cp.membership_tier, internal_notes: cp.internal_notes }
  }

  return profiles.map(p => ({
    ...p,
    item_count: countMap[p.id] ?? 0,
    membership_tier: cpMap[p.id]?.membership_tier ?? null,
    internal_notes: cpMap[p.id]?.internal_notes ?? null,
  }))
}

export async function getClientWithAddresses(clientId: string) {
  const supabase = await createClient()

  const [profileResult, clientProfileResult, addressesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', clientId).single(),
    supabase.from('client_profiles').select('*').eq('profile_id', clientId).single(),
    supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', clientId)
      .order('is_primary', { ascending: false }),
  ])

  if (profileResult.error) throw profileResult.error

  return {
    profile: profileResult.data,
    clientProfile: clientProfileResult.data ?? null,
    addresses: addressesResult.data ?? [],
  }
}
