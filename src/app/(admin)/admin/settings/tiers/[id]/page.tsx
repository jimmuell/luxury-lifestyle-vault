import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { H1, Caption } from '@/components/ui/typography'
import { TierEditForm } from '@/components/admin/tier-edit-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminTierEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tier } = await supabase
    .from('service_tiers')
    .select('*')
    .eq('id', id)
    .single()

  if (!tier) notFound()

  // Subscriber counts per Stripe price ID
  const { data: subscriptions } = await supabase
    .from('client_subscriptions')
    .select('stripe_price_id, status')
    .eq('service_tier_id', id)
    .eq('status', 'active')

  const priceSubCounts: Record<string, number> = {}
  for (const s of subscriptions ?? []) {
    priceSubCounts[s.stripe_price_id] = (priceSubCounts[s.stripe_price_id] ?? 0) + 1
  }

  // Recent pricing changes
  const { data: pricingLog } = await supabase
    .from('pricing_change_log')
    .select('id, field, before_value, after_value, created_at, actor_profile_id')
    .eq('service_tier_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          href="/admin/settings/tiers"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tiers
        </Link>
        <Caption as="p" className="text-muted-foreground mb-1">Settings › Service Tiers</Caption>
        <H1>{tier.name}</H1>
      </div>

      <TierEditForm tier={tier} priceSubCounts={priceSubCounts} pricingLog={pricingLog ?? []} />
    </div>
  )
}
