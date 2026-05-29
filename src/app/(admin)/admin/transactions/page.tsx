import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; client_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const sp = await searchParams
  const { from, to, client_id: clientId } = sp

  const adminClient = createAdminClient()

  // Fetch billing data
  let query = adminClient
    .from('billing_history_cache')
    .select('id, client_id, stripe_invoice_id, amount_cents, currency, status, description, invoice_date, order_id, pdf_url, hosted_url, refunded_at, refund_amount_cents, profiles(full_name, email)')
    .order('invoice_date', { ascending: false })
    .limit(100)

  if (from) query = query.gte('invoice_date', from)
  if (to) query = query.lte('invoice_date', to)
  if (clientId) query = query.eq('client_id', clientId)

  const { data: rows } = await query
  const invoices = rows ?? []

  // Fetch clients for filter dropdown
  const { data: clients } = await adminClient
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'client')
    .order('full_name')

  // Stats
  const totalRevenue = invoices.reduce((sum, r) => sum + (r.status === 'paid' ? r.amount_cents : 0), 0)
  const totalRefunded = invoices.reduce((sum, r) => sum + (r.refund_amount_cents ?? 0), 0)
  const netRevenue = totalRevenue - totalRefunded

  // Build CSV download URL
  const csvParams = new URLSearchParams()
  if (from) csvParams.set('from', from)
  if (to) csvParams.set('to', to)
  if (clientId) csvParams.set('client_id', clientId)
  const csvUrl = `/api/admin/transactions?${csvParams.toString()}`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-light">Transactions</h1>
        <Link
          href={csvUrl}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total charged', value: `$${(totalRevenue / 100).toFixed(2)}` },
          { label: 'Refunded', value: `$${(totalRefunded / 100).toFixed(2)}` },
          { label: 'Net revenue', value: `$${(netRevenue / 100).toFixed(2)}` },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-border px-5 py-4 bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
            <p className="font-serif text-2xl font-light mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Client</label>
          <select name="client_id" defaultValue={clientId ?? ''} className="text-sm border border-border rounded-md px-3 py-1.5 bg-background">
            <option value="">All clients</option>
            {(clients ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.full_name ?? c.email}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">From</label>
          <input type="date" name="from" defaultValue={from ?? ''} className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">To</label>
          <input type="date" name="to" defaultValue={to ?? ''} className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <button type="submit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Apply
        </button>
        {(from || to || clientId) && (
          <Link href="/admin/transactions" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground italic">No transactions found.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">Client</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">Description</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">Amount</th>
                <th className="text-center px-4 py-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map(inv => {
                const clientProfile = inv.profiles as { full_name: string | null; email: string } | null
                const label = inv.description ?? (inv.order_id ? 'On-demand charge' : 'Subscription charge')
                const isRefunded = !!inv.refunded_at

                return (
                  <tr key={inv.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(inv.invoice_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{clientProfile?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{clientProfile?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{label}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={isRefunded ? 'line-through text-muted-foreground' : 'font-medium'}>
                        ${(inv.amount_cents / 100).toFixed(2)}
                      </span>
                      {isRefunded && (
                        <span className="block text-xs text-emerald-600">
                          Refunded {inv.refund_amount_cents ? `$${(inv.refund_amount_cents / 100).toFixed(2)}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {inv.order_id && (
                          <Link
                            href={`/admin/orders/${inv.order_id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="View order"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {inv.pdf_url && (
                          <Link
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="PDF invoice"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length === 100 && (
        <p className="text-xs text-muted-foreground text-center">Showing first 100 results. Use date filters or export CSV for full data.</p>
      )}
    </div>
  )
}
