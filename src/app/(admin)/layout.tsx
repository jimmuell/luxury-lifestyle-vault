import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AuthWatcher } from '@/components/shared/auth-watcher'
import { AdminNav } from '@/components/admin/admin-nav'
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
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar flex-shrink-0">
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-8 px-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              LLV Admin
            </p>
          </div>
          <nav className="flex-1">
            <AdminNav />
          </nav>
          <div className="mt-auto pt-6 border-t border-border flex items-center gap-1 px-1">
            <ThemeToggle />
            <form action={signOut} className="flex-1">
              <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
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
