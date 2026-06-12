'use client'

import { useSyncExternalStore, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Collapsible } from '@base-ui/react/collapsible'
import {
  LayoutGrid, Users, Package, Building2, MessageSquare,
  ShoppingBag, Settings, Route, CreditCard, BarChart2,
  ScrollText, BookOpen, Mail, FlaskConical, ChevronDown, LineChart, Presentation, HelpCircle,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Overview', icon: LayoutGrid }],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/inventory', label: 'Inventory', icon: Package },
      { href: '/admin/concierge', label: 'Concierge', icon: MessageSquare },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/providers', label: 'Providers', icon: Building2 },
      { href: '/admin/investors', label: 'Investors', icon: LineChart },
      { href: '/admin/presentations', label: 'Presentations', icon: Presentation },
      { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/admin/settings/tiers', label: 'Service Tiers', icon: Settings },
      { href: '/admin/settings/corridors', label: 'Corridors', icon: Route },
      { href: '/admin/settings/notifications', label: 'Notifications', icon: MessageSquare },
      { href: '/admin/help', label: 'Help Content', icon: BookOpen },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
      { href: '/admin/email', label: 'Email', icon: Mail },
      { href: '/admin/seed-data', label: 'Seed Data', icon: FlaskConical },
    ],
  },
]

const COLLAPSIBLE_LABELS = NAV_GROUPS
  .map(g => g.label)
  .filter((l): l is string => l !== null)

const LS_KEY = 'llv.adminNav.collapsed'

const storeListeners = new Set<() => void>()

function emitChange() {
  storeListeners.forEach(l => l())
}

function subscribe(cb: () => void) {
  storeListeners.add(cb)
  if (typeof window !== 'undefined') window.addEventListener('storage', cb)
  return () => {
    storeListeners.delete(cb)
    if (typeof window !== 'undefined') window.removeEventListener('storage', cb)
  }
}

// Snapshot returns the raw stored string, not a new object — useSyncExternalStore
// compares with Object.is, so returning a fresh Set/array every call would loop.
function getSnapshot(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(LS_KEY) ?? ''
  } catch {
    return ''
  }
}

function getServerSnapshot(): string {
  return ''
}

function setCollapsedInStorage(next: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...next]))
  } catch {}
  emitChange() // same-tab notify — native 'storage' event only fires in other tabs
}

function getActiveGroupLabel(pathname: string): string | null {
  let best: { label: string; len: number } | null = null
  for (const group of NAV_GROUPS) {
    if (!group.label) continue
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        if (!best || item.href.length > best.len) {
          best = { label: group.label, len: item.href.length }
        }
      }
    }
  }
  return best?.label ?? null
}

export function AdminNav() {
  const pathname = usePathname()

  const storedRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const collapsed = useMemo<Set<string>>(() => {
    if (!storedRaw) return new Set()
    try {
      return new Set(JSON.parse(storedRaw) as string[])
    } catch {
      return new Set()
    }
  }, [storedRaw])

  const activeLabel = getActiveGroupLabel(pathname)

  // Derive open set: persisted open groups, always including the active group
  const openGroups = useMemo(() => {
    const open = new Set(COLLAPSIBLE_LABELS.filter(l => !collapsed.has(l)))
    if (activeLabel) open.add(activeLabel)
    return open
  }, [collapsed, activeLabel])

  function toggle(label: string) {
    if (label === activeLabel) return // never collapse the active group
    const next = new Set(collapsed)
    if (next.has(label)) {
      next.delete(label)
    } else {
      next.add(label)
    }
    setCollapsedInStorage(next)
  }

  const linkClass =
    'flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'

  return (
    <div>
      {NAV_GROUPS.map(group => {
        if (!group.label) {
          return (
            <div key="__overview" className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={linkClass}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          )
        }

        const isOpen = openGroups.has(group.label)
        const panelId = `admin-nav-${group.label.toLowerCase()}`

        return (
          <Collapsible.Root
            key={group.label}
            open={isOpen}
            onOpenChange={() => toggle(group.label!)}
          >
            <Collapsible.Trigger
              className="flex w-full items-center justify-between px-3 pt-5 pb-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 hover:text-foreground transition-colors"
              aria-controls={panelId}
            >
              <span>{group.label}</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`}
              />
            </Collapsible.Trigger>
            <Collapsible.Panel id={panelId}>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className={linkClass}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </Collapsible.Panel>
          </Collapsible.Root>
        )
      })}
    </div>
  )
}
