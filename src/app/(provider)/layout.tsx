import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { AuthWatcher } from '@/components/shared/auth-watcher'
import { ProviderNav } from '@/components/provider/provider-nav'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'provider') redirect('/')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 flex items-center justify-between h-14">
          <Link
            href="/provider"
            className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Luxury Lifestyle Vault
          </Link>
          <ProviderNav />
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit" className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main>
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
          <AuthWatcher />
          {children}
        </div>
      </main>
    </div>
  )
}
