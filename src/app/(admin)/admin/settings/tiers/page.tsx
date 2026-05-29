import { createClient } from '@/lib/supabase/server'
import { H1, Caption } from '@/components/ui/typography'
import { TierList } from '@/components/admin/tier-list'
import { isTestMode } from '@/lib/stripe/server'

export default async function AdminTiersPage() {
  const supabase = await createClient()

  const { data: tiers } = await supabase
    .from('service_tiers')
    .select('*')
    .order('sort_order', { ascending: true })

  // Subscriber counts per tier
  const { data: subCounts } = await supabase
    .from('client_subscriptions')
    .select('service_tier_id')
    .eq('status', 'active')

  const countByTier: Record<string, number> = {}
  for (const s of subCounts ?? []) {
    countByTier[s.service_tier_id] = (countByTier[s.service_tier_id] ?? 0) + 1
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <Caption as="p" className="text-muted-foreground mb-1">Settings</Caption>
          <H1>Service Tiers</H1>
        </div>
        {isTestMode && (
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-1.5">
            Stripe test mode active
          </div>
        )}
      </div>

      <TierList tiers={tiers ?? []} subscriberCounts={countByTier} />
    </div>
  )
}
