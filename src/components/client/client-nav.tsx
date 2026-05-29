'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Package, MessageSquare, LogOut, Menu, ShoppingBag, Settings, Shirt } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { signOut } from '@/actions/auth'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/client', label: 'Overview', icon: LayoutGrid },
  { href: '/client/wardrobe', label: 'Wardrobe', icon: Package },
  { href: '/client/outfits', label: 'Outfits', icon: Shirt },
  { href: '/client/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/client/concierge', label: 'Concierge', icon: MessageSquare },
  { href: '/client/settings', label: 'Settings', icon: Settings },
]

interface ClientNavProps {
  profile: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-1">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === href || (href !== '/client' && pathname.startsWith(href))
              ? 'bg-accent/15 text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  )
}

export function ClientNav({ profile }: ClientNavProps) {
  const pathname = usePathname()
  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()

  const navContent = (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground px-3">
          Luxury Lifestyle Vault
        </p>
      </div>

      <NavLinks pathname={pathname} />

      <div className="mt-auto space-y-3 pt-6 border-t border-border">
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name ?? 'Member'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
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
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar flex-shrink-0">
        {navContent}
      </aside>

      {/* Mobile header + sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
          LLV
        </p>
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            {navContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile top spacing */}
      <div className="md:hidden h-14" />
    </>
  )
}
