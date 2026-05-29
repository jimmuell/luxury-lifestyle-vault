import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllItemStatusCounts, getRecentItems } from '@/lib/queries/items'
import { StatusBadge } from '@/components/shared/status-badge'
import type { ItemStatus } from '@/types/app'
import { ITEM_STATUS_LABELS } from '@/types/app'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_DISPLAY: ItemStatus[] = ['intake_pending', 'received', 'in_cleaning', 'cleaning_complete', 'stored', 'delivery_scheduled']

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: awaitingOnboarding },
    statusCounts,
    recentItems,
    { count: openMessages },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .eq('onboarding_complete', false),
    getAllItemStatusCounts(),
    getRecentItems(8),
    supabase
      .from('concierge_messages')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
  ])

  const totalItems = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const activeItems = (statusCounts['received'] ?? 0) + (statusCounts['in_cleaning'] ?? 0) + (statusCounts['delivery_scheduled'] ?? 0)

  // Fetch profile names for recent items
  const clientIds = [...new Set(recentItems.map(i => i.client_id))]
  const { data: clientNames } = clientIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email').in('id', clientIds)
    : { data: [] }

  const nameMap: Record<string, string> = {}
  for (const p of clientNames ?? []) {
    nameMap[p.id] = p.full_name ?? p.email
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-light">Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeItems} item{activeItems !== 1 ? 's' : ''} in active care · {totalClients ?? 0} client{(totalClients ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/clients" className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/30 transition-colors">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Clients</p>
          <p className="font-serif text-4xl font-light mt-2">{totalClients ?? 0}</p>
          {(awaitingOnboarding ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{awaitingOnboarding} awaiting onboarding</p>
          )}
        </Link>

        <Link href="/admin/inventory" className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/30 transition-colors">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Total items</p>
          <p className="font-serif text-4xl font-light mt-2">{totalItems}</p>
          <p className="text-xs text-muted-foreground mt-1">{activeItems} in active care</p>
        </Link>

        <Link href="/admin/inventory?status=intake_pending" className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/30 transition-colors">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Pending intake</p>
          <p className="font-serif text-4xl font-light mt-2">{statusCounts['intake_pending'] ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">awaiting receipt</p>
        </Link>

        <Link href="/admin/providers" className="group rounded-lg border border-border bg-card p-5 hover:border-foreground/30 transition-colors">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Providers</p>
          <p className="font-serif text-4xl font-light mt-2">—</p>
          <p className="text-xs text-muted-foreground mt-1">manage partners</p>
        </Link>
      </div>

      {/* Status breakdown */}
      <div className="space-y-3">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Inventory by status</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {STATUS_DISPLAY.map(status => (
            <Link
              key={status}
              href={`/admin/inventory?status=${status}`}
              className="rounded-lg border border-border bg-card p-3 hover:border-foreground/30 transition-colors text-center"
            >
              <p className="text-2xl font-light tabular-nums">{statusCounts[status] ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{ITEM_STATUS_LABELS[status]}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Concierge queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Concierge queue</h2>
          <Link href="/admin/concierge" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        <Link
          href="/admin/concierge"
          className="rounded-lg border border-border bg-card p-5 flex items-center gap-4 hover:border-foreground/30 transition-colors"
        >
          <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-2xl font-light tabular-nums">{openMessages ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(openMessages ?? 0) === 0 ? 'No open messages' : `open message${(openMessages ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
        </Link>
      </div>

      {/* Recent items */}
      {recentItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Recent submissions</h2>
            <Link href="/admin/inventory" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
            {recentItems.map(item => (
              <Link
                key={item.id}
                href={`/admin/inventory/${item.id}`}
                className="flex items-center justify-between px-5 py-3 bg-card hover:bg-muted/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    <StatusBadge status={item.status as ItemStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{item.sku}</span>
                    {nameMap[item.client_id] && <> · {nameMap[item.client_id]}</>}
                    {' · '}{format(new Date(item.created_at), 'MMM d')}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
