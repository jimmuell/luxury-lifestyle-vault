'use server'

import { inngest } from '@/lib/inngest/client'
import { createClient } from '@/lib/supabase/server'

export async function triggerPhotoAnalysis({
  photoId,
  storagePath,
  itemId,
}: {
  photoId: string
  storagePath: string
  itemId: string
}) {
  // Verify the user owns this item (security check)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: photo } = await supabase
    .from('item_photos')
    .select('id')
    .eq('id', photoId)
    .eq('item_id', itemId)
    .single()

  if (!photo) return

  await inngest.send({
    name: 'item/photo.uploaded',
    data: { photoId, storagePath, itemId },
  })
}
