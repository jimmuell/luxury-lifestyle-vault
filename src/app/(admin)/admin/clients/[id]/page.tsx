import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientWithAddresses } from '@/lib/queries/clients'
import { InternalNotes } from '@/components/admin/internal-notes'
import { SubscriptionCard } from '@/components/admin/subscription-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ItemStatus, ItemCategory } from '@/types/app'
import { ITEM_CATEGORY_LABELS } from '@/types/app'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [clientData, itemsResult, subscriptionResult, tiersResult] = await Promise.all([
    getClientWithAddresses(id).catch(() => null),
    supabase
      .from('items')
      .select('id, name, sku, brand, category, status, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('client_subscriptions')
      .select('id, stripe_subscription_id, status, cancel_at_period_end, current_period_end, founding_member_discount_applied, service_tier_id, service_tiers(name, monthly_price_cents)')
      .eq('client_id', id)
      .in('status', ['active', 'trialing', 'past_due', 'unpaid'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('service_tiers')
      .select('id, name, monthly_price_cents, tier_type, active, stripe_price_id_current')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
  ])

  if (!clientData) notFound()

  const { profile, clientProfile, addresses } = clientData
  const items = itemsResult.data ?? []
  const subscription = subscriptionResult.data
  const tiers = tiersResult.data ?? []

  const subscriptionForCard = subscription ? {
    id: subscription.id,
    stripe_subscription_id: subscription.stripe_subscription_id,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: subscription.current_period_end,
    founding_member_discount_applied: subscription.founding_member_discount_applied,
    service_tier_id: subscription.service_tier_id,
    tier: Array.isArray(subscription.service_tiers)
      ? (subscription.service_tiers[0] ?? null)
      : subscription.service_tiers,
  } : null

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/clients"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-light">{profile.full_name ?? 'Unnamed client'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile.email}
            {profile.phone && <> · {profile.phone}</>}
            {' · '}Joined {format(new Date(profile.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {profile.onboarding_complete ? (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Onboarding pending
            </Badge>
          )}
          {clientProfile?.founding_member && (
            <Badge variant="secondary" className="text-xs text-amber-700 border-amber-300">
              Founding member
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left column: subscription + addresses + notes */}
        <div className="space-y-8">
          <SubscriptionCard
            clientId={id}
            subscription={subscriptionForCard}
            tiers={tiers}
          />

          <div className="space-y-3">
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Addresses</h2>
            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{addr.label || 'Address'}</p>
                      {addr.is_primary && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
                    {addr.delivery_instructions && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{addr.delivery_instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No addresses saved.</p>
            )}
          </div>

          <Separator />

          <InternalNotes clientId={id} notes={clientProfile?.internal_notes ?? null} />
        </div>

        {/* Right: item list */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
              Wardrobe · {items.length} item{items.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {items.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={`/admin/inventory/${item.id}`}
                  className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      <StatusBadge status={item.status as ItemStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{item.sku}</span>
                      {' · '}{ITEM_CATEGORY_LABELS[item.category as ItemCategory]}
                      {item.brand && <> · {item.brand}</>}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">No items cataloged yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
