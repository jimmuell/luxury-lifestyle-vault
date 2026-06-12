import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FilterablePresentationList } from '@/components/investor/filterable-presentation-list'

export default async function InvestorPresentationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileResult, presentationsResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase
      .from('investor_documents')
      .select('id, title, description')
      .eq('doc_type', 'presentation')
      .eq('is_published', true)
      .order('sort_order'),
  ])

  const role = profileResult.data?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  const docs = presentationsResult.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Presentations</h1>
      <FilterablePresentationList docs={docs} />
    </div>
  )
}
