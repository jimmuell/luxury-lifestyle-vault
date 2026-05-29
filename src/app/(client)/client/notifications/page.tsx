import { createClient } from '@/lib/supabase/server'
import { H1, Caption } from '@/components/ui/typography'
import { NotificationList } from '@/components/client/notification-list'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_profile_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Caption as="p" className="text-muted-foreground mb-1">Your account</Caption>
        <H1>Notifications</H1>
      </div>
      <NotificationList notifications={notifications ?? []} />
    </div>
  )
}
