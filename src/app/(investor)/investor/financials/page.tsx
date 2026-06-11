import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tierRank } from '@/lib/investor/tiers'
import {
  FINANCIALS_META,
  PILOT_ASSUMPTIONS,
  PRICING,
  YEAR1_REVENUE,
  YEAR1_COSTS,
  BILLING_MODES,
  PROJECTION_3YR,
} from '@/lib/investor/financials'

function formatUsd(amount: number): string {
  return '$' + amount.toLocaleString('en-US')
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount}`
}

export default async function InvestorFinancialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, investor_tier')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  const tier = profile?.investor_tier ?? 'prospect'
  if (role === 'investor' && tierRank(tier) < 3) redirect('/investor/presentations')

  const totalRevenue = YEAR1_REVENUE.reduce((sum, r) => sum + r.amount, 0)
  const totalCosts = YEAR1_COSTS.reduce((sum, c) => sum + c.amount, 0)
  const maxProjectionRevenue = Math.max(...PROJECTION_3YR.map(p => p.revenue))

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-light">Financials</h1>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Year 1 revenue', value: formatCompact(PROJECTION_3YR[0].revenue) },
          { label: 'Year 1 members', value: String(PROJECTION_3YR[0].members) },
          { label: 'Year 3 revenue', value: formatCompact(PROJECTION_3YR[2].revenue) },
          { label: 'Year 3 insured value', value: formatCompact(PROJECTION_3YR[2].insuredValue) },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
            <p className="font-serif text-2xl font-light mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Revenue composition */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Year 1 revenue composition
          </p>
          <div className="space-y-3">
            {YEAR1_REVENUE.map(row => {
              const pct = totalRevenue > 0 ? (row.amount / totalRevenue) * 100 : 0
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="text-muted-foreground tabular-nums">{formatUsd(row.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/70 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Total: {formatUsd(totalRevenue)}
          </p>
        </div>

        {/* Cost stack */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Year 1 cost stack
          </p>
          <div className="space-y-3">
            {YEAR1_COSTS.map(row => {
              const pct = totalCosts > 0 ? (row.amount / totalCosts) * 100 : 0
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="text-muted-foreground tabular-nums">{formatUsd(row.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/70 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Total: {formatUsd(totalCosts)}
          </p>
        </div>

      </div>

      {/* Billing-mode comparison */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
          Billing-mode comparison
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Mode</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Revenue</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Costs</th>
                <th className="text-right py-2 pl-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {BILLING_MODES.map(row => (
                <tr key={row.mode} className={row.recommended ? 'bg-muted/50 font-medium' : ''}>
                  <td className="py-2.5 pr-4">
                    <span>{row.mode}</span>
                    {row.recommended && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1 py-0.5">
                        recommended
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{formatUsd(row.revenue)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{formatUsd(row.costs)}</td>
                  <td className={`py-2.5 pl-4 text-right tabular-nums ${row.net < 0 ? 'text-destructive' : ''}`}>
                    {formatUsd(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-year projection */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
          3-year revenue projection (illustrative)
        </p>
        <div className="flex items-end gap-4 h-32">
          {PROJECTION_3YR.map(row => {
            const heightPct = maxProjectionRevenue > 0 ? (row.revenue / maxProjectionRevenue) * 100 : 0
            return (
              <div key={row.year} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {formatCompact(row.revenue)}
                </span>
                <div
                  className="w-full rounded-t bg-foreground/60 min-h-[2px]"
                  style={{ height: `${Math.max(2, Math.round(heightPct * 0.96))}px` }}
                />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  {row.year}
                </span>
              </div>
            )
          })}
        </div>
        <div className="overflow-x-auto border-t border-border pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Year', 'Members', 'Corridors', 'Revenue', 'Insured Value'].map(h => (
                  <th key={h} className="text-left py-1.5 pr-4 last:pr-0 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PROJECTION_3YR.map(row => (
                <tr key={row.year}>
                  <td className="py-2 pr-4 text-sm">{row.year}</td>
                  <td className="py-2 pr-4 tabular-nums text-sm">{row.members}</td>
                  <td className="py-2 pr-4 tabular-nums text-sm">{row.corridors}</td>
                  <td className="py-2 pr-4 tabular-nums text-sm">{formatUsd(row.revenue)}</td>
                  <td className="py-2 tabular-nums text-sm">{formatCompact(row.insuredValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing table */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
          Founding member pricing
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Service', 'Standard', 'Founding', 'Unit'].map(h => (
                  <th key={h} className="text-left py-1.5 pr-4 last:pr-0 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PRICING.map(row => (
                <tr key={row.item}>
                  <td className="py-2.5 pr-4">{row.item}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatUsd(row.standard)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatUsd(row.founding)}</td>
                  <td className="py-2.5 text-muted-foreground">{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
          Year 1 assumptions
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Label', 'Value', 'Note'].map(h => (
                  <th key={h} className="text-left py-1.5 pr-4 last:pr-0 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PILOT_ASSUMPTIONS.map(row => (
                <tr key={row.label}>
                  <td className="py-2.5 pr-4">{row.label}</td>
                  <td className="py-2.5 pr-4 tabular-nums font-medium">{row.value}</td>
                  <td className="py-2.5 text-muted-foreground">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-xs text-muted-foreground italic pb-2">{FINANCIALS_META.note}</p>
    </div>
  )
}
