import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSignedUrls } from '@/lib/storage/server'
import { H1, Caption } from '@/components/ui/typography'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { OutfitDetailActions } from '@/components/client/outfit-detail-actions'

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: outfitId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: outfit } = await supabase
    .from('outfits')
    .select(`
      id, name, notes, created_at,
      outfit_items (
        sort_order,
        item_id,
        items (
          id, name, brand, category, color, material, status,
          item_photos ( storage_path, public_url, sort_order )
        )
      )
    `)
    .eq('id', outfitId)
    .eq('client_id', user!.id)
    .single()

  if (!outfit) notFound()

  // Sort items by sort_order
  const sortedItems = [...(outfit.outfit_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  // Build photo map — prefer public_url (Unsplash CDN), sign storage_path as fallback.
  type RawPhoto = { storage_path: string; public_url: string | null; sort_order: number }
  type RawItem = { id: string; item_photos?: RawPhoto[] } | null

  const needSigning: string[] = []
  const pathToItemId: Record<string, string> = {}
  const photoMap: Record<string, string> = {}

  for (const oi of sortedItems) {
    const item = oi.items as RawItem
    if (!item) continue
    const photos = (item.item_photos ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
    if (photos.length === 0) continue
    const first = photos[0]
    if (first.public_url) {
      photoMap[item.id] = first.public_url
    } else {
      needSigning.push(first.storage_path)
      pathToItemId[first.storage_path] = item.id
    }
  }

  if (needSigning.length > 0) {
    const urlMap = await getSignedUrls(needSigning)
    for (const [path, url] of Object.entries(urlMap)) {
      if (pathToItemId[path]) photoMap[pathToItemId[path]] = url
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href="/client/outfits"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All outfits
        </Link>
        <Caption as="p" className="text-muted-foreground mb-1">
          {format(new Date(outfit.created_at), 'MMMM d, yyyy')}
        </Caption>
        <div className="flex items-start justify-between gap-4">
          <H1 className="font-light">{outfit.name}</H1>
          <OutfitDetailActions outfitId={outfitId} />
        </div>
        {outfit.notes && (
          <p className="text-sm text-muted-foreground mt-2">{outfit.notes}</p>
        )}
      </div>

      {/* Request outfit CTA */}
      {sortedItems.length > 0 && (
        <div className="flex items-center gap-3">
          <Link
            href={`/client/rotations/new?outfitId=${outfitId}`}
            className={buttonVariants({ size: 'sm' })}
          >
            <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
            Request this outfit
          </Link>
          <span className="text-xs text-muted-foreground">
            {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}

      {/* Item grid */}
      {sortedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sortedItems.map(oi => {
            const item = oi.items as {
              id: string
              name: string
              brand: string | null
              category: string
              color: string | null
              material: string | null
              status: string
            } | null
            if (!item) return null
            const photoUrl = photoMap[item.id]
            return (
              <Link
                key={oi.item_id}
                href={`/client/wardrobe/${item.id}`}
                className="group rounded-lg border border-border overflow-hidden hover:border-foreground/20 transition-colors"
              >
                <div className="aspect-[3/4] bg-muted overflow-hidden flex items-center justify-center">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{item.category.replace(/_/g, ' ')}</span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  {item.brand && <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{item.brand}</p>}
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.color && <p className="text-xs text-muted-foreground">{item.color}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No items in this outfit.</p>
        </div>
      )}
    </div>
  )
}
