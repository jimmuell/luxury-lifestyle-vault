import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OnDemandRequestForm } from '@/components/client/on-demand-request-form'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { HelpTip } from '@/components/help/help-tip'

const REQUESTABLE_STATUSES = ['stored', 'cleaning_complete'] as const

export default async function NewOnDemandOrderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [itemsResult, addressesResult, tierResult, cpResult] = await Promise.all([
    supabase
      .from('items')
      .select('id, name, brand, category, status, location_status, location_label')
      .eq('client_id', user!.id)
      .in('status', REQUESTABLE_STATUSES)
      .order('name', { ascending: true }),
    supabase
      .from('addresses')
      .select('id, label, line1, city, state, postal_code, is_primary')
      .eq('profile_id', user!.id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('service_tiers')
      .select('per_request_base_cents, per_item_surcharge_cents, rush_premium_pct, founding_member_discount_pct, min_lead_time_hours, rush_lead_time_hours')
      .eq('name', 'On-Demand Occasion')
      .eq('active', true)
      .maybeSingle(),
    supabase
      .from('client_profiles')
      .select('founding_member')
      .eq('profile_id', user!.id)
      .maybeSingle(),
  ])

  const tier = tierResult.data
  const isFoundingMember = cpResult.data?.founding_member ?? false

  const pricing = tier?.per_request_base_cents
    ? {
        base: tier.per_request_base_cents,
        perItem: tier.per_item_surcharge_cents ?? 0,
        rushPct: Number(tier.rush_premium_pct ?? 0),
        discountPct: Number(tier.founding_member_discount_pct ?? 0),
        isFoundingMember,
        minLeadHours: tier.min_lead_time_hours ?? 72,
        rushLeadHours: tier.rush_lead_time_hours ?? 24,
      }
    : null

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-4">
        <Link href="/client/orders" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orders
        </Link>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">On-demand request</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-serif text-3xl font-light">Request an item</h1>
            <HelpTip areaKey="client.ondemand" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Need something from your vault for an occasion? We&apos;ll have it ready for you.
          </p>
        </div>
      </div>

      <OnDemandRequestForm
        items={itemsResult.data ?? []}
        addresses={addressesResult.data ?? []}
        pricing={pricing}
      />
    </div>
  )
}
