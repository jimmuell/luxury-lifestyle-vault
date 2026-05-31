import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSignedUrls } from '@/lib/storage/server'
import { ItemPhotoCarousel } from '@/components/client/item-photo-carousel'
import { CategoryArtCard } from '@/components/wardrobe/category-art-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import type { ItemStatus, ItemCategory, ConditionLevel, OrderStatus, OrderType } from '@/types/app'
import { ITEM_CATEGORY_LABELS, CONDITION_LEVEL_LABELS, ORDER_TYPE_LABELS, ITEM_LOCATION_LABELS } from '@/types/app'
import { format } from 'date-fns'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const REQUESTABLE_STATUSES = ['stored', 'cleaning_complete']
const NON_REQUESTABLE_REASON: Record<string, string> = {
  in_transit: 'Currently in transit',
  damaged: 'Flagged for review',
  pending_intake: 'Pending intake',
  with_client: 'Already with you',
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [itemResult, conditionsResult, photosResult, orderHistoryResult] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('client_id', user!.id)
      .single(),
    supabase
      .from('item_conditions')
      .select('*')
      .eq('item_id', id)
      .order('assessed_at', { ascending: false }),
    supabase
      .from('item_photos')
      .select('id, storage_path, photo_type, caption, ai_analysis, storage_bucket')
      .eq('item_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('order_items')
      .select('id, orders(id, order_type, status, created_at, confirmed_delivery_date)')
      .eq('item_id', id)
      .order('created_at', { foreignTable: 'orders', ascending: false })
      .limit(5),
  ])

  if (!itemResult.data) notFound()

  const item = itemResult.data
  const conditions = conditionsResult.data ?? []
  const photoRows = photosResult.data ?? []

  const paths = photoRows
    .map(p => p.storage_path)
    .filter(p => !p.endsWith('seed-main.jpg'))
  const urlMap = paths.length > 0 ? await getSignedUrls(paths) : {}

  const photos = photoRows
    .map(p => ({
      id: p.id,
      signedUrl: p.storage_path.endsWith('seed-main.jpg') ? '' : (urlMap[p.storage_path] ?? ''),
      photoType: p.photo_type,
      caption: p.caption,
      aiAnalysis: p.ai_analysis as Record<string, unknown> | null,
    }))
    .filter(p => p.signedUrl)

  const orderHistory = (orderHistoryResult.data ?? [])
    .map(oi => oi.orders)
    .filter(Boolean) as Array<{ id: string; order_type: string; status: string; created_at: string; confirmed_delivery_date: string | null }>

  const canRequest = REQUESTABLE_STATUSES.includes(item.status)
  const blockReason = NON_REQUESTABLE_REASON[item.status] ?? null

  // Collect AI insights from all photos
  const aiInsights = photos
    .filter(p => p.aiAnalysis)
    .slice(0, 1) // use the primary photo's analysis
    .map(p => p.aiAnalysis!)

  const primaryAI = aiInsights[0] ?? null

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <Link
          href="/client/wardrobe"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-4 -ml-2')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          My wardrobe
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {item.brand && (
              <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-1">{item.brand}</p>
            )}
            <h1 className="font-serif text-3xl font-light">{item.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{item.sku}</p>
          </div>
          <StatusBadge status={item.status as ItemStatus} />
        </div>
      </div>

      {/* Location sentence */}
      <div className="px-5 py-3.5 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm">
          <span className="text-muted-foreground">Where is it now? </span>
          {item.location_label
            ? item.location_label
            : ITEM_LOCATION_LABELS?.[item.location_status as keyof typeof ITEM_LOCATION_LABELS] ?? item.location_status?.replace(/_/g, ' ') ?? 'Unknown location'}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: photo carousel or art card */}
        {photos.length > 0 ? (
          <ItemPhotoCarousel photos={photos} />
        ) : (
          <CategoryArtCard
            category={item.category as ItemCategory}
            name={item.name}
            brand={item.brand}
            size="detail"
            className="aspect-[3/4] rounded-lg"
          />
        )}

        {/* Right: metadata + CTA */}
        <div className="space-y-8">
          {/* Identity */}
          <div className="space-y-3">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Identity</p>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Category</dt>
                <dd>{ITEM_CATEGORY_LABELS[item.category as ItemCategory]}</dd>
              </div>
              {item.color && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Color</dt>
                  <dd>{item.color}</dd>
                </div>
              )}
              {item.size && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd>{item.size}</dd>
                </div>
              )}
              {item.season && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Season</dt>
                  <dd className="capitalize">{item.season}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Care */}
          {(item.material || item.care_instructions || item.purchase_price) && (
            <div className="space-y-3">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Care</p>
              <dl className="space-y-2">
                {item.material && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Material</dt>
                    <dd>{item.material}</dd>
                  </div>
                )}
                {item.purchase_price && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Declared value</dt>
                    <dd>${Number(item.purchase_price).toLocaleString()}</dd>
                  </div>
                )}
                {item.care_instructions && (
                  <div className="text-sm pt-1">
                    <dt className="text-muted-foreground mb-1">Care instructions</dt>
                    <dd className="text-muted-foreground leading-relaxed">{item.care_instructions}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Request CTA */}
          <div className="pt-2 border-t border-border space-y-3">
            {canRequest ? (
              <Link
                href={`/client/orders/new?item=${id}`}
                className={buttonVariants({ variant: 'default', size: 'default' })}
              >
                Request this item
              </Link>
            ) : (
              <div className="space-y-1">
                <button
                  disabled
                  className="px-4 py-2 text-sm bg-foreground/30 text-background/70 rounded-md cursor-not-allowed"
                >
                  Request this item
                </button>
                {blockReason && (
                  <p className="text-xs text-muted-foreground">{blockReason}</p>
                )}
              </div>
            )}
            <Link
              href={`/client/outfits/new?items=${id}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Save as outfit
            </Link>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {primaryAI && (
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">AI insights</p>
            <span className="text-[10px] text-muted-foreground/60 border border-border rounded px-1.5 py-0.5">AI-generated</span>
          </div>
          {(() => {
            const ai = primaryAI as Record<string, string | string[] | null | undefined>
            return (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {ai.suggestedName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Suggested name</p>
                    <p>{ai.suggestedName}</p>
                  </div>
                )}
                {ai.suggestedCategory && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Detected category</p>
                    <p className="capitalize">{String(ai.suggestedCategory).replace(/_/g, ' ')}</p>
                  </div>
                )}
                {ai.detectedBrand && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Detected brand</p>
                    <p>{ai.detectedBrand}</p>
                  </div>
                )}
                {ai.detectedColor && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Detected color</p>
                    <p className="capitalize">{ai.detectedColor}</p>
                  </div>
                )}
                {Array.isArray(ai.conditionFlags) && ai.conditionFlags.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Condition flags</p>
                    <div className="flex flex-wrap gap-1">
                      {(ai.conditionFlags as string[]).map(flag => (
                        <Badge key={flag} variant="outline" className="text-xs text-amber-700 border-amber-300">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Order history */}
      {orderHistory.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-border">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Order history</p>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {orderHistory.map(o => (
              <Link
                key={o.id}
                href={`/client/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {ORDER_TYPE_LABELS[o.order_type as OrderType] ?? o.order_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(o.created_at), 'MMMM d, yyyy')}
                    {o.confirmed_delivery_date && ` · Delivered ${format(new Date(o.confirmed_delivery_date), 'MMM d')}`}
                  </p>
                </div>
                <OrderStatusBadge status={o.status as OrderStatus} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Condition history */}
      {conditions.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-border">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Condition history</p>
          <div className="space-y-3">
            {conditions.map(c => (
              <div key={c.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {CONDITION_LEVEL_LABELS[c.condition_level as ConditionLevel]}
                  </p>
                  {c.notes && (
                    <p className="text-sm text-muted-foreground mt-0.5">{c.notes}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                  {format(new Date(c.assessed_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
