import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/types/database'

type NotificationType = Database['public']['Enums']['notification_type']

export async function createNotification({
  recipientProfileId,
  type,
  title,
  snippet,
  linkTarget,
  metadata,
}: {
  recipientProfileId: string
  type: NotificationType
  title: string
  snippet?: string
  linkTarget?: string
  metadata?: Json
}): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notifications').insert({
    recipient_profile_id: recipientProfileId,
    type,
    title,
    snippet: snippet ?? null,
    link_target: linkTarget ?? null,
    metadata: metadata ?? {},
  })
}
