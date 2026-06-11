import { redirect } from 'next/navigation'
import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InvestorPlaceholder } from '@/components/investor/investor-placeholder'

export default async function InvestorTheAskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, investor_tier')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  const TIER_RANK: Record<string, number> = { prospect: 1, investor: 2, board: 3 }
  const tier = profile?.investor_tier ?? 'prospect'
  const tierRank = TIER_RANK[tier] ?? 1
  if (role === 'investor' && tierRank < 3) redirect('/investor/presentations')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">The Ask</h1>
      <InvestorPlaceholder
        icon={Target}
        title="Coming soon"
        description="Round size, use of funds, and terms will appear here."
      />
    </div>
  )
}
