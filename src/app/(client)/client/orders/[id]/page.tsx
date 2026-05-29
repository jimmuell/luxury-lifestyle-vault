import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderStatusTimeline } from '@/components/client/order-status-timeline'
import { OrderActionButtons } from '@/components/client/order-action-buttons'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { PrintButton } from '@/components/client/print-button'
import { ReturnModal } from '@/components/client/return-modal'
import { buttonVariants } from '@/components/ui/button'
import { ORDER_TYPE_LABELS, CLIENT_CANCELLABLE_STATUSES } from '@/types/app'
import type { OrderStatus, OrderType, OrderStatusHistory } from '@/types/app'
import { CARRIERS } from '@/lib/shipping/carriers'
import { format } from 'date-fns'
import { ArrowLeft, Package, ExternalLink } from 'lucide-react'

export default async function ClientOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [orderResult, itemsResult, historyResult, shipmentsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('client_id', user!.id)
      .single(),
    supabase
      .from('order_items')
      .select('id, item_id, unit_price_cents, notes, items(id, name, brand, category, sku)')
      .eq('order_id', id),
    supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('order_shipments')
      .select('id, direction, carrier, carrier_other, tracking_number, shipped_at, expected_delivery_at, delivered_at')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data
  const orderItems = itemsResult.data ?? []
  const history = (historyResult.data ?? []) as OrderStatusHistory[]
  const shipments = shipmentsResult.data ?? []

  const canCancel = CLIENT_CANCELLABLE_STATUSES.includes(order.status as OrderStatus)
  const canReturn = order.status === 'delivered' &&
    (order.order_type === 'seasonal_rotation' || order.order_type === 'on_demand_item')

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/client/orders"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orders
          </Link>
          <PrintButton />
        </div>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block text-xs text-muted-foreground mb-2">
          Luxury Lifestyle Vault — Order Summary
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl font-light">
              {ORDER_TYPE_LABELS[order.order_type as OrderType]}
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <OrderStatusBadge status={order.status as OrderStatus} />
        </div>
      </div>

      {/* Order meta */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Placed</p>
          <p>{format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
        </div>
        {(order.confirmed_delivery_date ?? order.requested_delivery_date) && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {order.confirmed_delivery_date ? 'Confirmed delivery' : 'Requested delivery'}
            </p>
            <p>
              {format(
                new Date(order.confirmed_delivery_date ?? order.requested_delivery_date!),
                'MMMM d, yyyy'
              )}
            </p>
          </div>
        )}
        {order.total_cents != null && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Total</p>
            <p>${(order.total_cents / 100).toFixed(2)}</p>
          </div>
        )}
        {order.notes && (
          <div className="space-y-0.5 col-span-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Notes</p>
            <p className="text-muted-foreground italic">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      {orderItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Items ({orderItems.length})
          </p>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {orderItems.map(oi => {
              const item = oi.items as { id: string; name: string; brand: string | null; category: string; sku: string | null } | null
              return (
                <Link
                  key={oi.id}
                  href={item ? `/client/wardrobe/${item.id}` : '#'}
                  className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    {item?.brand && (
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{item.brand}</p>
                    )}
                    <p className="text-sm font-medium">{item?.name ?? 'Item'}</p>
                    {item?.sku && <p className="text-xs text-muted-foreground">{item.sku}</p>}
                  </div>
                  {oi.unit_price_cents != null && (
                    <p className="text-sm text-muted-foreground">${(oi.unit_price_cents / 100).toFixed(2)}</p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Tracking */}
      {shipments.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium flex items-center gap-2">
            <Package className="h-3.5 w-3.5" />
            Shipment tracking
          </p>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {shipments.map(s => {
              const carrierMeta = CARRIERS.find(c => c.code === s.carrier)
              const trackingUrl = s.tracking_number && carrierMeta
                ? carrierMeta.trackingUrl(s.tracking_number)
                : null
              return (
                <div key={s.id} className="px-5 py-4 space-y-1 bg-card">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      {s.direction === 'outbound' ? 'Outbound' : 'Return'}
                    </p>
                    {s.delivered_at && (
                      <span className="text-xs text-emerald-600 font-medium">Delivered</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {carrierMeta?.label ?? s.carrier}
                    {s.carrier === 'other' && s.carrier_other && ` (${s.carrier_other})`}
                  </p>
                  {s.tracking_number && (
                    <p className="text-xs font-mono text-muted-foreground">{s.tracking_number}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {s.shipped_at && (
                        <p>Shipped {format(new Date(s.shipped_at), 'MMM d, yyyy')}</p>
                      )}
                      {s.expected_delivery_at && !s.delivered_at && (
                        <p>Expected {format(new Date(s.expected_delivery_at), 'MMM d, yyyy')}</p>
                      )}
                      {s.delivered_at && (
                        <p>Delivered {format(new Date(s.delivered_at), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                    {trackingUrl && s.carrier !== 'other' && (
                      <Link
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Track package <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">Status history</p>
        <OrderStatusTimeline history={history} currentStatus={order.status as OrderStatus} />
      </div>

      {/* Actions */}
      <div className="print:hidden flex flex-wrap gap-3">
        <OrderActionButtons orderId={order.id} canCancel={canCancel} canReturn={false} />
        {canReturn && (
          <ReturnModal
            orderId={order.id}
            orderType={order.order_type as 'seasonal_rotation' | 'on_demand_item'}
            items={orderItems
              .map(oi => {
                const item = oi.items as { id: string; name: string; brand: string | null } | null
                return item ? { id: item.id, name: item.name, brand: item.brand } : null
              })
              .filter((i): i is { id: string; name: string; brand: string | null } => i !== null)
            }
          />
        )}
      </div>

      {order.status === 'cancelled' && (
        <p className="text-sm text-muted-foreground italic">
          This order was cancelled. {' '}
          <Link href="/client/orders/new" className="underline underline-offset-2 hover:text-foreground">
            Place a new request
          </Link>
        </p>
      )}
    </div>
  )
}
