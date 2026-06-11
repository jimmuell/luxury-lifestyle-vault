import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut, UserCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AuthWatcher } from '@/components/shared/auth-watcher'
import { InvestorNav } from '@/components/investor/investor-nav'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, investor_tier')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'investor' && profile?.role !== 'admin') redirect('/')

  const tier = (profile?.investor_tier ?? 'prospect') as 'prospect' | 'investor' | 'board'

  const displayName = profile?.full_name?.trim() || user.email || ''
  const showEmail = displayName !== user.email

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar flex-shrink-0">
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-8 px-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              LLV Investor Room
            </p>
          </div>
          <nav className="flex-1">
            <InvestorNav tier={tier} />
          </nav>
          <div className="mt-auto pt-6 border-t border-border space-y-3">
            <div className="flex items-start gap-2 px-1">
              <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{displayName}</p>
                {showEmail && (
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 px-1">
              <ThemeToggle />
              <form action={signOut} className="flex-1">
                <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-2 text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
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
