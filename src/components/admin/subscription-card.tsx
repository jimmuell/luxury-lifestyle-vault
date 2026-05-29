'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { adminSetSubscription, adminChangeTier, adminCancelSubscription } from '@/actions/stripe'
import { toast } from 'sonner'
import { CreditCard, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Tier {
  id: string
  name: string
  monthly_price_cents: number | null
  tier_type: string
  active: boolean
  stripe_price_id_current: string | null
}

interface Subscription {
  id: string
  stripe_subscription_id: string
  status: string
  cancel_at_period_end: boolean
  current_period_end: string | null
  founding_member_discount_applied: boolean
  service_tier_id: string
  tier: { name: string; monthly_price_cents: number | null } | null
}

interface SubscriptionCardProps {
  clientId: string
  subscription: Subscription | null
  tiers: Tier[]
}

export function SubscriptionCard({ clientId, subscription, tiers }: SubscriptionCardProps) {
  const [pending, startTransition] = useTransition()
  const [showTierChange, setShowTierChange] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState('')

  const eligibleTiers = tiers.filter(t => t.tier_type === 'subscription' && t.active && t.stripe_price_id_current)

  function handleSetSubscription(tierId: string) {
    startTransition(async () => {
      try {
        await adminSetSubscription(clientId, tierId)
        toast.success('Subscription created')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to create subscription')
      }
    })
  }

  function handleChangeTier() {
    if (!selectedTierId || !subscription) return
    startTransition(async () => {
      try {
        await adminChangeTier(subscription.stripe_subscription_id, selectedTierId)
        toast.success('Tier updated — proration applied')
        setShowTierChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to change tier')
      }
    })
  }

  function handleCancel(immediately: boolean) {
    if (!subscription) return
    startTransition(async () => {
      try {
        await adminCancelSubscription(subscription.stripe_subscription_id, immediately)
        toast.success(immediately ? 'Subscription cancelled' : 'Will cancel at period end')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to cancel')
      }
    })
  }

  const statusColor = {
    active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    past_due: 'text-amber-700 bg-amber-50 border-amber-200',
    canceled: 'text-muted-foreground bg-muted/40 border-border',
    unpaid: 'text-red-700 bg-red-50 border-red-200',
    trialing: 'text-blue-700 bg-blue-50 border-blue-200',
  }[subscription?.status ?? ''] ?? 'text-muted-foreground bg-muted/40 border-border'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/20">
        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">Subscription</p>
      </div>

      <div className="p-4 space-y-4">
        {subscription ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{subscription.tier?.name ?? 'Unknown tier'}</p>
                {subscription.tier?.monthly_price_cents && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${(subscription.tier.monthly_price_cents / 100).toFixed(0)}/mo
                    {subscription.founding_member_discount_applied && (
                      <span className="ml-1.5 text-amber-600">· founding member discount</span>
                    )}
                  </p>
                )}
              </div>
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize', statusColor)}>
                {subscription.cancel_at_period_end ? 'cancels at period end' : subscription.status}
              </span>
            </div>

            {subscription.current_period_end && (
              <p className="text-xs text-muted-foreground">
                {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'}{' '}
                {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                {' · '}MRR{' '}
                ${((subscription.tier?.monthly_price_cents ?? 0) / 100).toFixed(0)}
              </p>
            )}

            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setShowTierChange(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={pending}
                >
                  <ChevronDown className={cn('h-3 w-3 transition-transform', showTierChange && 'rotate-180')} />
                  Change tier
                </button>

                {showTierChange && (
                  <div className="flex gap-2">
                    <select
                      value={selectedTierId}
                      onChange={e => setSelectedTierId(e.target.value)}
                      className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background"
                    >
                      <option value="">Select tier…</option>
                      {eligibleTiers.filter(t => t.id !== subscription.service_tier_id).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.monthly_price_cents ? ` — $${(t.monthly_price_cents / 100).toFixed(0)}/mo` : ''}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={handleChangeTier} disabled={!selectedTierId || pending} className="text-xs">
                      Apply
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleCancel(false)}
                    disabled={pending}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel at period end
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    onClick={() => handleCancel(true)}
                    disabled={pending}
                    className="text-xs text-red-600 hover:text-red-700 transition-colors"
                  >
                    Cancel immediately
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No active subscription.</p>
            {eligibleTiers.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={selectedTierId}
                  onChange={e => setSelectedTierId(e.target.value)}
                  className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background"
                >
                  <option value="">Select tier…</option>
                  {eligibleTiers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.monthly_price_cents ? ` — $${(t.monthly_price_cents / 100).toFixed(0)}/mo` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => handleSetSubscription(selectedTierId)}
                  disabled={!selectedTierId || pending}
                  className="text-xs"
                >
                  Set
                </Button>
              </div>
            )}
            {eligibleTiers.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Sync tiers to Stripe first.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
