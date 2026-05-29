'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SETTINGS_NAV = [
  { href: '/client/settings/billing', label: 'Billing' },
  { href: '/client/settings/notifications', label: 'Notifications' },
  { href: '/client/settings/addresses', label: 'Addresses' },
  { href: '/client/settings/account', label: 'Account' },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-0 border-b border-border">
      {SETTINGS_NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'px-4 py-2 text-sm border-b-2 -mb-px transition-colors',
            pathname.startsWith(href)
              ? 'border-foreground text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
