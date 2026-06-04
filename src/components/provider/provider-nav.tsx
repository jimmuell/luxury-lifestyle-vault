'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ProviderNav() {
  const pathname = usePathname()

  const ordersActive = pathname === '/provider' || pathname.startsWith('/provider/orders')
  const helpActive = pathname.startsWith('/provider/help')

  const active = 'text-sm text-foreground font-medium'
  const inactive = 'text-sm text-muted-foreground hover:text-foreground transition-colors'

  return (
    <nav className="flex items-center gap-6">
      <Link href="/provider" className={ordersActive ? active : inactive}>
        Orders
      </Link>
      <Link href="/provider/help" className={helpActive ? active : inactive}>
        Reference guide
      </Link>
    </nav>
  )
}
