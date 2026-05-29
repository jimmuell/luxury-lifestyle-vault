import { createClient } from '@/lib/supabase/server'
import { NotificationPrefsForm } from '@/components/client/notification-prefs-form'

export default async function NotificationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cp } = await supabase
    .from('client_profiles')
    .select('email_notifications, in_app_notification_prefs')
    .eq('profile_id', user!.id)
    .single()

  const defaultPrefs = { order_updates: true, delivery_notices: true, payment: true, seasonal_reminders: true }
  const defaultInApp = { order_updates: true, delivery_notices: true, payment: true, seasonal_reminders: false }

  const emailPrefs = (cp?.email_notifications as Record<string, boolean>) ?? defaultPrefs
  const inAppPrefs = (cp?.in_app_notification_prefs as Record<string, boolean>) ?? defaultInApp

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how you receive updates about your wardrobe and orders.
      </p>
      <NotificationPrefsForm emailPrefs={emailPrefs} inAppPrefs={inAppPrefs} />
    </div>
  )
}
