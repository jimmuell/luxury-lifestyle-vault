import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientNav } from '@/components/client/client-nav'
import { NotificationBell } from '@/components/client/notification-bell'
import { AuthWatcher } from '@/components/shared/auth-watcher'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [profileResult, notificationsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, avatar_url, role, onboarding_complete')
      .eq('id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('id, type, title, snippet, link_target, read_at, created_at')
      .eq('recipient_profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileResult.data
  if (profile?.role !== 'client') redirect('/')

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientNav profile={profile!} />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
          <div className="fixed top-4 right-6 z-50 hidden md:block">
            <NotificationBell
              initialNotifications={notificationsResult.data ?? []}
              profileId={user.id}
            />
          </div>
          <AuthWatcher />
          {children}
        </div>
      </main>
    </div>
  )
}
