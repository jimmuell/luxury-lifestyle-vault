import { createClient } from '@/lib/supabase/server'

export async function getActiveProviders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('is_active', true)
    .order('business_name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getAllProviders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('business_name', { ascending: true })
  if (error) throw error
  return data ?? []
}
