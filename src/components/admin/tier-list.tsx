'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createTier } from '@/actions/tiers'
import { cn } from '@/lib/utils'
import { Plus, ChevronRight, Users, CheckCircle, XCircle } from 'lucide-react'

interface Tier {
  id: string
  name: string
  tier_type: string
  billing_cycle: string
  monthly_price_cents: number | null
  per_request_base_cents: number | null
  active: boolean
  sort_order: number
  stripe_price_id_current: string | null
}

export function TierList({
  tiers,
  subscriberCounts,
}: {
  tiers: Tier[]
  subscriberCounts: Record<string, number>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)

  function handleCreate() {
    setCreating(true)
    startTransition(async () => {
      try {
        const { tierId } = await createTier()
        router.push(`/admin/settings/tiers/${tierId}`)
      } finally {
        setCreating(false)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {tiers.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No tiers yet. Create the first tier below.
          </div>
        )}
        {tiers.map(tier => {
          const subs = subscriberCounts[tier.id] ?? 0
          const price = tier.tier_type === 'subscription'
            ? tier.monthly_price_cents != null
              ? `$${(tier.monthly_price_cents / 100).toFixed(0)}/mo`
              : 'No price set'
            : tier.per_request_base_cents != null
              ? `$${(tier.per_request_base_cents / 100).toFixed(0)} base`
              : 'No price set'

          return (
            <Link
              key={tier.id}
              href={`/admin/settings/tiers/${tier.id}`}
              className="group flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{tier.name}</p>
                    {tier.active ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{tier.tier_type.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{price}</span>
                    {!tier.stripe_price_id_current && tier.tier_type === 'subscription' && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-amber-600">Not synced to Stripe</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {subs}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>

      <button
        onClick={handleCreate}
        disabled={isPending || creating}
        className={cn(
          'flex items-center gap-2 text-sm px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors',
          (isPending || creating) && 'opacity-50 pointer-events-none'
        )}
      >
        <Plus className="h-4 w-4" />
        {creating ? 'Creating…' : 'New tier'}
      </button>
    </div>
  )
}
