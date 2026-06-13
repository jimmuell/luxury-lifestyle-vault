import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AuthWatcher } from '@/components/shared/auth-watcher'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdminNavScroller } from '@/components/admin/admin-nav-scroller'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex md:flex-col h-full w-56 flex-shrink-0 border-r border-border bg-sidebar">
        <div className="shrink-0 border-b border-border px-4 py-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            LLV Admin
          </p>
        </div>
        <AdminNavScroller className="px-4 py-3">
          <AdminNav />
        </AdminNavScroller>
        <div className="shrink-0 border-t border-border px-4 py-4 flex items-center gap-1">
          <ThemeToggle />
          <form action={signOut} className="flex-1">
            <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
          <AuthWatcher />
          {children}
        </div>
      </main>
    </div>
  )
}
