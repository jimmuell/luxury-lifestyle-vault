import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutGrid, Users, Package, Building2, MessageSquare, LogOut, FlaskConical, ShoppingBag, Settings, Route, CreditCard, BarChart2, ScrollText } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/concierge', label: 'Concierge', icon: MessageSquare },
  { href: '/admin/providers', label: 'Providers', icon: Building2 },
  { href: '/admin/settings/tiers', label: 'Service Tiers', icon: Settings },
  { href: '/admin/settings/corridors', label: 'Corridors', icon: Route },
  { href: '/admin/settings/notifications', label: 'Notifications', icon: MessageSquare },
  { href: '/admin/seed-data', label: 'Seed Data', icon: FlaskConical },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const NAV = NAV_ITEMS
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
          <nav className="flex-1 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
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
          {children}
        </div>
      </main>
    </div>
  )
}
