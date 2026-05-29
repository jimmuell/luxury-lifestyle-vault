import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Download, TrendingUp } from 'lucide-react'
import {
  getReportKpis,
  getClientsByTier,
  getRevenueTrend,
  getFulfillmentMetrics,
  getProviderPerformance,
} from '@/lib/queries/reports'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const [kpis, tierData, revenueTrend, fulfillment, providers] = await Promise.all([
    getReportKpis(),
    getClientsByTier(),
    getRevenueTrend(6),
    getFulfillmentMetrics(),
    getProviderPerformance(),
  ])

  const maxRevenue = Math.max(...revenueTrend.map(r => r.cents), 1)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-light">Reports</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/api/admin/reports?report=revenue" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Download className="h-3.5 w-3.5" />
            Revenue CSV
          </Link>
          <Link href="/api/admin/reports?report=clients_by_tier" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Download className="h-3.5 w-3.5" />
            Tiers CSV
          </Link>
          <Link href="/api/admin/reports?report=providers" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Download className="h-3.5 w-3.5" />
            Providers CSV
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total clients', value: kpis.totalClients },
          { label: 'Active subs', value: kpis.activeSubscriptions },
          { label: 'Total orders', value: kpis.totalOrders },
          { label: 'Total revenue', value: `$${(kpis.totalRevenueCents / 100).toFixed(0)}` },
          { label: 'This month', value: `$${(kpis.thisMonthRevenueCents / 100).toFixed(0)}` },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
            <p className="font-serif text-2xl font-light mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 4 panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Clients by tier */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Active clients by tier
          </p>
          {tierData.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No active subscriptions.</p>
          ) : (
            <div className="space-y-2">
              {tierData.map(tier => (
                <div key={tier.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{tier.name}</span>
                      <span className="text-sm text-muted-foreground">{tier.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/70 rounded-full"
                        style={{ width: `${Math.max(4, Math.round((tier.count / (tierData[0]?.count || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue trend */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Revenue trend (6 months)
          </p>
          {revenueTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No revenue data yet.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-24">
              {revenueTrend.map(month => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1" title={`${month.month}: $${(month.cents / 100).toFixed(0)}`}>
                  <div
                    className="w-full rounded-t bg-foreground/60 min-h-[2px]"
                    style={{ height: `${Math.max(2, Math.round((month.cents / maxRevenue) * 80))}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {month.month.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fulfillment performance */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Fulfillment (last 30 days)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total orders', value: fulfillment.total },
              { label: 'Delivered', value: fulfillment.delivered },
              { label: 'In flight', value: fulfillment.inFlight },
              { label: 'Delivery rate', value: `${fulfillment.deliveryRate}%` },
            ].map(stat => (
              <div key={stat.label} className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="font-serif text-xl font-light">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Provider performance */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Provider performance
          </p>
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No assignment data yet.</p>
          ) : (
            <div className="divide-y divide-border -mx-5">
              {providers.map(p => {
                const rate = p.total > 0 ? Math.round((p.accepted / p.total) * 100) : 0
                return (
                  <div key={p.name} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-sm">{p.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span>{p.total} assigned</span>
                      <span className={rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-500'}>
                        {rate}% accepted
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
