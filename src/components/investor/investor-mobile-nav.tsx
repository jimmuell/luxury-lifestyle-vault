'use client'

import { useState } from 'react'
import { Menu, UserCircle, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { InvestorNav } from '@/components/investor/investor-nav'
import { signOut } from '@/actions/auth'
import type { InvestorTier } from '@/lib/investor/tiers'

interface InvestorMobileNavProps {
  tier: InvestorTier
  displayName: string
  email: string
  showEmail: boolean
}

export function InvestorMobileNav({ tier, displayName, email, showEmail }: InvestorMobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0" showCloseButton={false}>
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-8 px-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              LLV Investor Room
            </p>
          </div>
          <nav className="flex-1">
            <InvestorNav tier={tier} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="mt-auto pt-6 border-t border-border space-y-3">
            <div className="flex items-start gap-2 px-1">
              <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{displayName}</p>
                {showEmail && (
                  <p className="text-[10px] text-muted-foreground truncate">{email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 px-1">
              <ThemeToggle />
              <form action={signOut} className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="w-full justify-start gap-2 text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
