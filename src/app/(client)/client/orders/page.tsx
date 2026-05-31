import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { CategoryArtCard } from '@/components/wardrobe/category-art-card'
import { ORDER_TYPE_LABELS } from '@/types/app'
import type { OrderStatus, OrderType, ItemCategory } from '@/types/app'
import { format, subDays, startOfYear } from 'date-fns'
import { ArrowRight, Plus, RotateCcw, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

type TypeFilter = 'all' | OrderType
type StatusFilter = 'all' | 'active' | 'shipped' | 'delivered' | 'cancelled'
type RangeFilter = 'all' | '30d' | '90d' | '1y'

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'seasonal_rotation', label: 'Seasonal' },
  { value: 'on_demand_item', label: 'On-Demand' },
  { value: 'return', label: 'Returns' },
]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const RANGE_FILTERS: { value: RangeFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: 'This year' },
]

const ACTIVE_STATUSES: OrderStatus[] = [
  'requested', 'confirmed', 'dispatched_to_provider', 'in_preparation',
]
const DELIVERED_STATUSES: OrderStatus[] = [
  'delivered', 'return_initiated', 'return_received',
]

type PhotoRow = { public_url: string | null; sort_order: number }
type ItemRow = { id: string; name: string; brand: string | null; category: string; item_photos: PhotoRow[] } | null
type OrderItemRow = { items: ItemRow }
type OrderRow = {
  id: string
  order_type: string
  status: string
  total_cents: number | null
  requested_delivery_date: string | null
  confirmed_delivery_date: string | null
  created_at: string
  is_rush: boolean
  order_items: OrderItemRow[]
}

function getOrderThumbnails(order: OrderRow, max = 3): string[] {
  const photos: string[] = []
  for (const oi of order.order_items) {
    if (!oi.items?.item_photos) continue
    const sorted = [...oi.items.item_photos].sort((a, b) => a.sort_order - b.sort_order)
    const url = sorted[0]?.public_url
    if (url) photos.push(url)
    if (photos.length >= max) break
  }
  return photos
}

function buildFilterUrl(
  base: Record<string, string>,
  overrides: Record<string, string>,
): string {
  const params = new URLSearchParams()
  const merged = { ...base, ...overrides }
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== 'all') params.set(k, v)
  }
  const qs = params.toString()
  return `/client/orders${qs ? `?${qs}` : ''}`
}

export default async function ClientOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string
    status?: string
    range?: string
    cursor?: string
  }>
}) {
  const sp = await searchParams
  const type = (sp.type ?? 'all') as TypeFilter
  const status = (sp.status ?? 'all') as StatusFilter
  const range = (sp.range ?? 'all') as RangeFilter
  const cursor = sp.cursor

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('orders')
    .select(`
      id, order_type, status, total_cents,
      requested_delivery_date, confirmed_delivery_date,
      created_at, is_rush,
      order_items(
        items(id, name, brand, category, item_photos(public_url, sort_order))
      )
    `)
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  // Type filter
  if (type !== 'all') {
    query = query.eq('order_type', type)
  }

  // Status filter
  if (status === 'active') {
    query = query.in('status', ACTIVE_STATUSES)
  } else if (status === 'shipped') {
    query = query.eq('status', 'shipped')
  } else if (status === 'delivered') {
    query = query.in('status', DELIVERED_STATUSES)
  } else if (status === 'cancelled') {
    query = query.eq('status', 'cancelled')
  } else {
    // Default: hide cancelled
    query = query.neq('status', 'cancelled')
  }

  // Date range filter
  const now = new Date()
  if (range === '30d') {
    query = query.gte('created_at', subDays(now, 30).toISOString())
  } else if (range === '90d') {
    query = query.gte('created_at', subDays(now, 90).toISOString())
  } else if (range === '1y') {
    query = query.gte('created_at', startOfYear(now).toISOString())
  }

  // Cursor for pagination
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data } = await query
  const rawOrders = (data ?? []) as unknown as OrderRow[]
  const hasMore = rawOrders.length > PAGE_SIZE
  const orders = hasMore ? rawOrders.slice(0, PAGE_SIZE) : rawOrders
  const nextCursor = hasMore ? orders[orders.length - 1].created_at : null

  const currentBase = { type, status, range }
  const isFirstPage = !cursor

  return (
    <div className="space-y-6 print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-light">Orders</h1>
        <div className="flex items-center gap-3">
          <Link href="/client/rotations/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Seasonal rotation
          </Link>
          <Link href="/client/orders/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4 mr-2" />
            Request item
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Type */}
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <Link
              key={f.value}
              href={buildFilterUrl(currentBase, { type: f.value, cursor: '' })}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-colors',
                type === f.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <Link
              key={f.value}
              href={buildFilterUrl(currentBase, { status: f.value, cursor: '' })}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-colors',
                status === f.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Date range */}
        <div className="flex gap-1 flex-wrap">
          {RANGE_FILTERS.map(f => (
            <Link
              key={f.value}
              href={buildFilterUrl(currentBase, { range: f.value, cursor: '' })}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-colors',
                range === f.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Pagination context */}
      {!isFirstPage && (
        <p className="text-xs text-muted-foreground">
          Showing older orders —{' '}
          <Link href={buildFilterUrl(currentBase, { cursor: '' })} className="underline underline-offset-2 hover:text-foreground">
            Back to latest
          </Link>
        </p>
      )}

      {/* Orders list */}
      {!orders.length ? (
        <div className="py-20 text-center space-y-4">
          <p className="font-serif text-xl font-light text-muted-foreground italic">No orders found</p>
          {type === 'all' && status === 'all' && isFirstPage && (
            <div className="flex items-center justify-center gap-3">
              <Link href="/client/rotations/new" className={buttonVariants({ variant: 'outline' })}>
                Request a rotation
              </Link>
              <Link href="/client/orders/new" className={buttonVariants()}>
                Request an item
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {orders.map(order => {
            const deliveryDate = order.confirmed_delivery_date ?? order.requested_delivery_date
            const thumbnails = getOrderThumbnails(order)
            const itemCount = order.order_items.length

            return (
              <Link
                key={order.id}
                href={`/client/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/40 transition-colors group"
              >
                {/* Thumbnails */}
                <div className="hidden sm:flex items-center gap-1 w-[100px] shrink-0">
                  {thumbnails.length > 0 ? (
                    thumbnails.map((url, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded border border-border overflow-hidden bg-muted shrink-0"
                        style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: thumbnails.length - i }}
                      >
                        <Image src={url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                      </div>
                    ))
                  ) : (() => {
                    const firstItem = order.order_items[0]?.items
                    return firstItem ? (
                      <div className="w-8 h-8 rounded border border-border overflow-hidden shrink-0">
                        <CategoryArtCard category={firstItem.category as ItemCategory} name={firstItem.name} brand={firstItem.brand} size="list" className="w-8 h-8" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded border border-border bg-muted flex items-center justify-center shrink-0">
                        <span className="text-[9px] text-muted-foreground font-medium">—</span>
                      </div>
                    )
                  })()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {ORDER_TYPE_LABELS[order.order_type as OrderType]}
                    </span>
                    {order.is_rush && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium uppercase tracking-wider">
                        <Zap className="h-2.5 w-2.5" />
                        Rush
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                    {deliveryDate && (
                      <span className="text-xs text-muted-foreground">
                        Delivery {format(new Date(deliveryDate), 'MMM d')}
                      </span>
                    )}
                    {order.total_cents != null && (
                      <span className="text-xs text-muted-foreground">
                        ${(order.total_cents / 100).toFixed(0)}
                      </span>
                    )}
                    {itemCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + arrow */}
                <div className="flex items-center gap-3 shrink-0">
                  <OrderStatusBadge status={order.status as OrderStatus} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Next page */}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Link
            href={buildFilterUrl(currentBase, { cursor: nextCursor })}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            Next {PAGE_SIZE} orders
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
