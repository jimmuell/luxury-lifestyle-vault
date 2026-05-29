import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { ORDER_TYPE_LABELS } from '@/types/app'
import type { OrderStatus, OrderType } from '@/types/app'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched_to_provider', label: 'At Provider' },
  { value: 'in_preparation', label: 'Preparing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'return_initiated', label: 'Return' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status, type } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('id, order_type, status, total_cents, requested_delivery_date, confirmed_delivery_date, created_at, client_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') query = query.eq('status', status as OrderStatus)
  if (type) query = query.eq('order_type', type as 'seasonal_rotation' | 'on_demand_item' | 'return')

  const { data: orders } = await query

  // Fetch client names in batch
  const clientIds = [...new Set((orders ?? []).map(o => o.client_id))]
  const clientNames: Record<string, string> = {}
  if (clientIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', clientIds)
    for (const p of profiles ?? []) {
      clientNames[p.id] = p.full_name ?? p.email ?? p.id.slice(0, 8)
    }
  }

  const activeStatus = status ?? 'all'
  const pendingCount = (orders ?? []).filter(
    o => ['requested', 'confirmed'].includes(o.status)
  ).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl font-light">Orders</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTER_TABS.map(tab => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/admin/orders' : `/admin/orders?status=${tab.value}`}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors',
              activeStatus === tab.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!orders?.length ? (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-muted-foreground italic">No orders found</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {orders.map(order => {
            const deliveryDate = order.confirmed_delivery_date ?? order.requested_delivery_date
            const clientName = clientNames[order.client_id]
            const needsAction = ['requested', 'confirmed'].includes(order.status)

            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors group',
                  needsAction ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/60' : 'bg-card hover:bg-muted/40'
                )}
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {ORDER_TYPE_LABELS[order.order_type as OrderType]}
                    </span>
                    {clientName && (
                      <span className="text-xs text-muted-foreground">· {clientName}</span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                    {deliveryDate && (
                      <span className="text-xs text-muted-foreground">
                        Delivery: {format(new Date(deliveryDate), 'MMM d')}
                      </span>
                    )}
                    {order.total_cents != null && (
                      <span className="text-xs text-muted-foreground">
                        ${(order.total_cents / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status as OrderStatus} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
