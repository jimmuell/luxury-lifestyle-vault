import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type InvestorDocument = Database['public']['Tables']['investor_documents']['Row']

export async function getInvestorDocuments(): Promise<InvestorDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('investor_documents')
    .select('*')
    .eq('is_published', true)
    .order('section')
    .order('sort_order')
    .order('title')
  if (error) throw new Error(`Failed to fetch investor documents: ${error.message}`)
  return data ?? []
}
