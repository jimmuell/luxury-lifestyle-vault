'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutGrid, FolderOpen, BarChart2, Presentation, Target, Mail, HelpCircle } from 'lucide-react'
import type { InvestorTier } from '@/lib/investor/tiers'

const PROSPECT_NAV_ITEMS = [
  { href: '/investor',               label: 'Overview',      icon: LayoutGrid },
  { href: '/investor/presentations', label: 'Presentations', icon: Presentation },
  { href: '/investor/faq',           label: 'FAQ',           icon: HelpCircle },
  { href: '/investor/contact',       label: 'Contact',       icon: Mail },
]

const INVESTOR_NAV_ITEMS = [
  { href: '/investor',               label: 'Overview',      icon: LayoutGrid },
  { href: '/investor/presentations', label: 'Presentations', icon: Presentation },
  { href: '/investor/documents',     label: 'Documents',     icon: FolderOpen },
  { href: '/investor/faq',           label: 'FAQ',           icon: HelpCircle },
  { href: '/investor/contact',       label: 'Contact',       icon: Mail },
]

const BOARD_NAV_ITEMS = [
  { href: '/investor',               label: 'Overview',      icon: LayoutGrid },
  { href: '/investor/presentations', label: 'Presentations', icon: Presentation },
  { href: '/investor/documents',     label: 'Documents',     icon: FolderOpen },
  { href: '/investor/financials',    label: 'Financials',    icon: BarChart2 },
  { href: '/investor/the-ask',       label: 'The Ask',       icon: Target },
  { href: '/investor/faq',           label: 'FAQ',           icon: HelpCircle },
  { href: '/investor/contact',       label: 'Contact',       icon: Mail },
]

interface InvestorNavProps {
  tier: InvestorTier
}

export function InvestorNav({ tier }: InvestorNavProps) {
  const pathname = usePathname()
  const navItems =
    tier === 'board' ? BOARD_NAV_ITEMS :
    tier === 'investor' ? INVESTOR_NAV_ITEMS :
    PROSPECT_NAV_ITEMS

  return (
    <div className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/investor' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'text-foreground bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
