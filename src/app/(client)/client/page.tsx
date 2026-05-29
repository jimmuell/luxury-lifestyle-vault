import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getItemStatusCounts } from '@/lib/queries/items'
import { buttonVariants } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { H1, H2, BodySmall, Caption } from '@/components/ui/typography'
import type { ItemStatus, OrderStatus, OrderType } from '@/types/app'
import { ORDER_TYPE_LABELS } from '@/types/app'
import { ArrowRight, Plus, RotateCcw, MessageSquare, Star } from 'lucide-react'
import { format, isWithinInterval, addDays } from 'date-fns'

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['requested', 'confirmed', 'dispatched_to_provider', 'in_preparation', 'shipped']
const STORAGE_STATUSES: ItemStatus[] = ['stored', 'cleaning_complete']
const IN_CARE_STATUSES: ItemStatus[] = ['received', 'in_cleaning', 'delivery_scheduled']

function greeting(name: string | null): string {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${time}, ${name.split(' ')[0]}.` : `${time}.`
}

function nextSeasonalWindow(corridor: { fall_transition_start_date: string | null; spring_transition_start_date: string | null } | null | undefined): { label: string; date: string } | null {
  if (!corridor) return null
  const now = new Date()
  const upcoming = [
    corridor.fall_transition_start_date ? { label: 'fall', date: corridor.fall_transition_start_date } : null,
    corridor.spring_transition_start_date ? { label: 'spring', date: corridor.spring_transition_start_date } : null,
  ]
    .filter(Boolean)
    .filter(w => {
      const d = new Date(w!.date)
      return d > now && isWithinInterval(now, { start: now, end: addDays(d, 0) }) && d <= addDays(now, 30)
    })
    .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime())

  return upcoming[0] ?? null
}

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    profileResult,
    cpResult,
    primaryAddressResult,
    statusCounts,
    activeOrdersResult,
    notificationsResult,
    corridorResult,
    itemLocationResult,
    scheduledRotationResult,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase.from('client_profiles').select('founding_member').eq('profile_id', user!.id).maybeSingle(),
    supabase.from('addresses').select('label, city, state').eq('profile_id', user!.id).eq('is_primary', true).single(),
    getItemStatusCounts(user!.id),
    supabase
      .from('orders')
      .select('id, order_type, status, requested_delivery_date, confirmed_delivery_date, order_items(id)')
      .eq('client_id', user!.id)
      .in('status', ACTIVE_ORDER_STATUSES)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('notifications')
      .select('id, type, title, snippet, link_target, read_at, created_at')
      .eq('recipient_profile_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('corridors')
      .select('display_name, origin_region_code, destination_region_code, fall_transition_start_date, spring_transition_start_date')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('items')
      .select('location_status, location_label')
      .eq('client_id', user!.id),
    supabase
      .from('orders')
      .select('id, requested_delivery_date')
      .eq('client_id', user!.id)
      .eq('order_type', 'seasonal_rotation')
      .in('status', ['requested', 'confirmed'])
      .order('requested_delivery_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const isFoundingMember = cpResult.data?.founding_member ?? false
  const primaryAddress = primaryAddressResult.data
  const activeOrders = activeOrdersResult.data ?? []
  const notifications = notificationsResult.data ?? []
  const corridor = corridorResult.data
  const allItems = itemLocationResult.data ?? []
  const scheduledRotation = scheduledRotationResult.data

  const totalItems = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const storedCount = STORAGE_STATUSES.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0)
  const inCareCount = IN_CARE_STATUSES.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0)

  // Location breakdown for wardrobe summary
  const locationCounts: Record<string, number> = {}
  for (const item of allItems) {
    const key = item.location_label ?? item.location_status ?? 'unknown'
    locationCounts[key] = (locationCounts[key] ?? 0) + 1
  }

  const upcomingWindow = nextSeasonalWindow(corridor)

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Caption as="p" className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d')}
          </Caption>
          {isFoundingMember && (
            <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase border border-amber-300 text-amber-700 rounded-full px-2 py-0.5">
              <Star className="h-2.5 w-2.5" />
              Founding Member
            </span>
          )}
        </div>
        <H1 className="font-light">{greeting(profile?.full_name ?? null)}</H1>
        <BodySmall className="text-muted-foreground">
          {corridor && totalItems > 0
            ? `${storedCount} item${storedCount !== 1 ? 's' : ''} in ${corridor.display_name} storage${inCareCount > 0 ? `, ${inCareCount} in care` : ''}.`
            : primaryAddress
            ? `Welcome to ${primaryAddress.label ?? `${primaryAddress.city}, ${primaryAddress.state}`}.`
            : 'Your vault awaits.'}
        </BodySmall>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/client/wardrobe', label: 'Browse wardrobe', sub: `${totalItems} item${totalItems !== 1 ? 's' : ''}` },
          { href: '/client/orders/new', label: 'Request an item', sub: 'On-demand delivery' },
          { href: '/client/rotations/new', label: 'Seasonal rotation', sub: 'Move your wardrobe' },
          { href: '/client/concierge', label: 'Contact concierge', sub: 'Questions & requests' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col gap-1.5 p-4 rounded-lg border border-border bg-card hover:border-foreground/30 transition-colors"
          >
            <p className="text-sm font-medium leading-tight">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.sub}</p>
          </Link>
        ))}
      </div>

      {/* Next rotation CTA */}
      {upcomingWindow && !scheduledRotation && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {upcomingWindow.label === 'fall' ? 'Fall' : 'Spring'} rotation approaching
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transition starts {format(new Date(upcomingWindow.date), 'MMMM d')} — schedule your wardrobe move now.
            </p>
          </div>
          <Link
            href="/client/rotations/new"
            className="flex-shrink-0 ml-4 flex items-center gap-1.5 px-3.5 py-2 text-xs bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Schedule
          </Link>
        </div>
      )}

      {scheduledRotation && (
        <div className="rounded-lg border border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Seasonal rotation scheduled</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Delivery requested for {format(new Date(scheduledRotation.requested_delivery_date!), 'MMMM d, yyyy')}
            </p>
          </div>
          <Link
            href={`/client/orders/${scheduledRotation.id}`}
            className="flex-shrink-0 ml-4 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View details <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Caption as="p" className="text-muted-foreground">Active orders</Caption>
            <Link href="/client/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {activeOrders.map(order => {
              const deliveryDate = order.confirmed_delivery_date ?? order.requested_delivery_date
              const itemCount = (order.order_items as { id: string }[] | null)?.length ?? 0
              return (
                <Link
                  key={order.id}
                  href={`/client/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{ORDER_TYPE_LABELS[order.order_type as OrderType]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                      {deliveryDate && ` · ${format(new Date(deliveryDate), 'MMM d')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status as OrderStatus} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Wardrobe summary by location */}
      {Object.keys(locationCounts).length > 0 && (
        <div className="space-y-3">
          <Caption as="p" className="text-muted-foreground">Wardrobe by location</Caption>
          <div className="flex flex-wrap gap-2">
            {Object.entries(locationCounts).map(([loc, count]) => (
              <div
                key={loc}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm"
              >
                <span className="font-mono text-base font-light">{count}</span>
                <span className="text-muted-foreground text-xs capitalize">{loc.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity from notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Caption as="p" className="text-muted-foreground">Recent activity</Caption>
            <Link href="/client/notifications" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {notifications.map(n => (
              <Link
                key={n.id}
                href={n.link_target ?? '/client/notifications'}
                className="flex items-start gap-3 px-5 py-4 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />}
                    <p className="text-sm font-medium truncate">{n.title}</p>
                  </div>
                  {n.snippet && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.snippet}</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                  {format(new Date(n.created_at), 'MMM d')}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
          <H2 italic className="text-muted-foreground">Your vault awaits.</H2>
          <BodySmall className="text-muted-foreground max-w-xs">
            Begin cataloging your wardrobe and we&apos;ll take care of everything — cleaning, storage, and delivery at your request.
          </BodySmall>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/client/wardrobe/intake" className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first item
            </Link>
            <Link href="/client/concierge" className={buttonVariants({ variant: 'outline' })}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact concierge
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
