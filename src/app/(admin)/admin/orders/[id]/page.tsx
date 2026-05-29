import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminOrderStatusPanel } from '@/components/admin/admin-order-status-panel'
import { ShippingPanel } from '@/components/admin/shipping-panel'
import { OrderStatusTimeline } from '@/components/client/order-status-timeline'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { buttonVariants } from '@/components/ui/button'
import { ORDER_TYPE_LABELS } from '@/types/app'
import type { OrderStatus, OrderType, OrderStatusHistory } from '@/types/app'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [orderResult, itemsResult, historyResult, providersResult, shipmentsResult] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),
    supabase
      .from('order_items')
      .select('id, item_id, unit_price_cents, notes, items(id, name, brand, category, sku, client_id)')
      .eq('order_id', id),
    supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('providers')
      .select('id, business_name')
      .eq('is_active', true)
      .order('business_name', { ascending: true }),
    supabase
      .from('order_shipments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (orderResult.error || !orderResult.data) notFound()

  const order = orderResult.data
  const orderItems = itemsResult.data ?? []
  const history = (historyResult.data ?? []) as OrderStatusHistory[]
  const providers = (providersResult.data ?? []) as { id: string; business_name: string }[]
  const shipments = shipmentsResult.data ?? []

  // Fetch client name
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', order.client_id)
    .single()

  const clientName = clientProfile?.full_name ?? clientProfile?.email ?? order.client_id.slice(0, 8)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href="/admin/orders" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orders
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {ORDER_TYPE_LABELS[order.order_type as OrderType]}
            </p>
            <h1 className="font-serif text-3xl font-light">{clientName}</h1>
            <p className="text-xs text-muted-foreground font-mono">
              #{order.id.slice(0, 8).toUpperCase()} · {format(new Date(order.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <OrderStatusBadge status={order.status as OrderStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: details + timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Client</p>
              <Link
                href={`/admin/clients/${order.client_id}`}
                className="hover:underline underline-offset-2 text-sm"
              >
                {clientName}
              </Link>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Placed</p>
              <p>{format(new Date(order.created_at), 'MMMM d, yyyy · h:mm a')}</p>
            </div>
            {order.requested_delivery_date && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Requested delivery</p>
                <p>{format(new Date(order.requested_delivery_date), 'MMMM d, yyyy')}</p>
              </div>
            )}
            {order.confirmed_delivery_date && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Confirmed delivery</p>
                <p>{format(new Date(order.confirmed_delivery_date), 'MMMM d, yyyy')}</p>
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
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Client notes</p>
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
                  const item = oi.items as { id: string; name: string; brand: string | null; category: string; sku: string | null; client_id: string } | null
                  return (
                    <Link
                      key={oi.id}
                      href={item ? `/admin/inventory/${item.id}` : '#'}
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

          {/* Timeline */}
          <div className="space-y-3">
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">Status history</p>
            <OrderStatusTimeline history={history} currentStatus={order.status as OrderStatus} />
          </div>
        </div>

        {/* Right: admin panel */}
        <div className="space-y-6">
          <AdminOrderStatusPanel
            orderId={order.id}
            currentStatus={order.status as OrderStatus}
            currentProviderId={order.provider_id}
            currentAdminNotes={order.admin_notes}
            providers={providers}
            requestedDeliveryDate={order.requested_delivery_date}
            orderType={order.order_type}
            paidAt={order.paid_at}
            refundedAt={order.refunded_at}
            stripeInvoiceId={order.stripe_invoice_id}
          />
          <ShippingPanel
            orderId={order.id}
            orderStatus={order.status}
            shipments={shipments as Parameters<typeof ShippingPanel>[0]['shipments']}
          />
        </div>
      </div>
    </div>
  )
}
