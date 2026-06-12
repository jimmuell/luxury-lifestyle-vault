import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tierRank } from '@/lib/investor/tiers'
import { getInvestorDocuments } from '@/lib/queries/investor'
import { PrintButton } from '@/components/investor/print-button'
import { FilterableDocList } from '@/components/investor/filterable-doc-list'

export default async function InvestorDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileResult, docs] = await Promise.all([
    supabase.from('profiles').select('role, investor_tier').eq('id', user.id).maybeSingle(),
    getInvestorDocuments(),
  ])

  const role = profileResult.data?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  const tier = profileResult.data?.investor_tier ?? 'prospect'
  if (role === 'investor' && tierRank(tier) < 2) redirect('/investor/presentations')

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-serif text-3xl font-light">Documents</h1>
        <PrintButton />
      </div>
      <h1 className="hidden print:block font-serif text-3xl font-light">Documents</h1>

      <FilterableDocList docs={docs} />
    </div>
  )
}
