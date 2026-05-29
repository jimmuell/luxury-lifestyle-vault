import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSignedUrls } from '@/lib/storage/server'
import { H1 } from '@/components/ui/typography'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { OutfitEditForm } from '@/components/client/outfit-edit-form'

export default async function OutfitEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: outfitId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [outfitResult, itemsResult] = await Promise.all([
    supabase
      .from('outfits')
      .select('id, name, notes, outfit_items(item_id, sort_order)')
      .eq('id', outfitId)
      .eq('client_id', user!.id)
      .single(),
    supabase
      .from('items')
      .select('id, name, brand, category, color, status, item_photos(storage_path, sort_order)')
      .eq('client_id', user!.id)
      .order('name', { ascending: true }),
  ])

  if (!outfitResult.data) notFound()

  const outfit = outfitResult.data
  const items = itemsResult.data ?? []

  // Build photo map
  const paths: string[] = []
  const pathToItemId: Record<string, string> = {}
  for (const item of items) {
    const photos = ((item.item_photos ?? []) as { storage_path: string; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order)
    if (photos.length > 0) {
      paths.push(photos[0].storage_path)
      pathToItemId[photos[0].storage_path] = item.id
    }
  }

  const urlMap = paths.length > 0 ? await getSignedUrls(paths) : {}
  const photoMap: Record<string, string> = {}
  for (const [path, url] of Object.entries(urlMap)) {
    if (pathToItemId[path]) photoMap[pathToItemId[path]] = url
  }

  const currentItemIds = [...(outfit.outfit_items ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(oi => oi.item_id)

  const itemList = items.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    color: item.color,
    status: item.status,
    photoUrl: photoMap[item.id] ?? null,
  }))

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href={`/client/outfits/${outfitId}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {outfit.name}
        </Link>
        <H1 className="font-light">Edit outfit</H1>
      </div>

      <OutfitEditForm
        outfitId={outfitId}
        initialName={outfit.name}
        initialNotes={outfit.notes ?? ''}
        initialItemIds={currentItemIds}
        items={itemList}
      />
    </div>
  )
}
