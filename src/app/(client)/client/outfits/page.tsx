import { createClient } from '@/lib/supabase/server'
import { getSignedUrls } from '@/lib/storage/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { H1 } from '@/components/ui/typography'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function OutfitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: outfits } = await supabase
    .from('outfits')
    .select(`
      id, name, notes, created_at,
      outfit_items (
        sort_order,
        item_id,
        items (
          id,
          name,
          item_photos ( storage_path, public_url, sort_order )
        )
      )
    `)
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  // Collect up to 4 photos per outfit for the collage cover.
  // Prefer public_url (Unsplash CDN); sign storage_path as fallback.
  type RawPhoto = { storage_path: string; public_url: string | null; sort_order: number }

  const outfitRawPhotos: Record<string, RawPhoto[]> = {}

  for (const outfit of outfits ?? []) {
    const collected: RawPhoto[] = []
    const sortedItems = [...(outfit.outfit_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    for (const oi of sortedItems) {
      if (collected.length >= 4) break
      const photos = ((oi.items as { item_photos?: RawPhoto[] } | null)?.item_photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
      if (photos.length > 0) collected.push(photos[0])
    }
    outfitRawPhotos[outfit.id] = collected
  }

  // Sign only the paths that have no public_url.
  const needSigning: string[] = []
  for (const photos of Object.values(outfitRawPhotos)) {
    for (const p of photos) {
      if (!p.public_url) needSigning.push(p.storage_path)
    }
  }
  const signedMap = needSigning.length > 0 ? await getSignedUrls(needSigning) : {}

  // Resolve final URL arrays per outfit.
  const outfitPhotoUrls: Record<string, string[]> = {}
  for (const [outfitId, photos] of Object.entries(outfitRawPhotos)) {
    outfitPhotoUrls[outfitId] = photos
      .map(p => p.public_url ?? signedMap[p.storage_path] ?? null)
      .filter((u): u is string => u !== null)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <H1 className="font-light">Outfits</H1>
          <p className="text-sm text-muted-foreground mt-1">Curated combinations from your vault.</p>
        </div>
        <Link href="/client/outfits/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New outfit
        </Link>
      </div>

      {outfits && outfits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {outfits.map(outfit => {
            const photoUrls = outfitPhotoUrls[outfit.id] ?? []
            const itemCount = outfit.outfit_items?.length ?? 0
            return (
              <Link
                key={outfit.id}
                href={`/client/outfits/${outfit.id}`}
                className="group rounded-xl border border-border overflow-hidden hover:border-foreground/20 transition-colors bg-card"
              >
                {/* Cover: collage if 2+ photos, single image otherwise */}
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {photoUrls.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">No items</p>
                    </div>
                  ) : photoUrls.length === 1 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrls[0]}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid grid-cols-2 gap-px bg-border">
                      {photoUrls.slice(0, 4).map((url, i) => (
                        <div key={i} className="overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 space-y-0.5">
                  <p className="font-medium text-sm truncate">{outfit.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} · {format(new Date(outfit.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3">
          <p className="text-muted-foreground text-sm">No outfits yet.</p>
          <Link href="/client/outfits/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create your first outfit
          </Link>
        </div>
      )}
    </div>
  )
}
