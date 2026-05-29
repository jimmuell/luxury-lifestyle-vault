import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import type { ItemStatus, ItemCategory } from '@/types/app'
import { ITEM_STATUS_LABELS, ITEM_CATEGORY_LABELS } from '@/types/app'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

const ALL_STATUSES = Object.keys(ITEM_STATUS_LABELS) as ItemStatus[]

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('id, name, brand, category, status, sku, client_id, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status as never)
  if (params.category) query = query.eq('category', params.category as never)
  if (params.q) query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%,brand.ilike.%${params.q}%`)

  const { data: items } = await query

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const p = { ...params, ...updates }
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')
    return `/admin/inventory${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Inventory</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <form method="GET" action="/admin/inventory" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search SKU, name, brand…"
            className="pl-9 pr-3 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring w-56"
          />
          {params.status && <input type="hidden" name="status" value={params.status} />}
          {params.category && <input type="hidden" name="category" value={params.category} />}
        </form>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={buildUrl({ status: undefined })}
            className={cn(
              'px-3 py-1.5 rounded-md border text-xs transition-colors',
              !params.status
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/40'
            )}
          >
            All
          </Link>
          {ALL_STATUSES.map(s => (
            <Link
              key={s}
              href={buildUrl({ status: s })}
              className={cn(
                'px-3 py-1.5 rounded-md border text-xs transition-colors',
                params.status === s
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40'
              )}
            >
              {ITEM_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Item</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items?.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/inventory/${item.id}`} className="hover:underline underline-offset-2">
                    <p className="font-medium">{item.name}</p>
                    {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {item.profiles?.full_name ?? item.profiles?.email ?? '—'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {ITEM_CATEGORY_LABELS[item.category as ItemCategory]}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status as ItemStatus} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!items || items.length === 0) && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {params.q ? `No items matching "${params.q}"` : 'No items found'}
          </div>
        )}
      </div>

      {items && items.length > 0 && (
        <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
