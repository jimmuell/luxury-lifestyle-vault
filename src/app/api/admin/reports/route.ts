import { createClient } from '@/lib/supabase/server'
import { objectsToCsv, csvResponse } from '@/lib/csv/export'
import { format } from 'date-fns'
import { getRevenueTrend, getClientsByTier, getProviderPerformance } from '@/lib/queries/reports'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const url = new URL(request.url)
  const report = url.searchParams.get('report') ?? 'revenue'

  let rows: Record<string, unknown>[] = []
  let filename = `llv-report-${format(new Date(), 'yyyy-MM-dd')}.csv`

  if (report === 'revenue') {
    const trend = await getRevenueTrend(12)
    rows = trend.map(r => ({ month: r.month, revenue_usd: (r.cents / 100).toFixed(2) }))
    filename = `llv-revenue-trend-${format(new Date(), 'yyyy-MM-dd')}.csv`
  } else if (report === 'clients_by_tier') {
    const tiers = await getClientsByTier()
    rows = tiers.map(t => ({ tier: t.name, active_clients: t.count }))
    filename = `llv-clients-by-tier-${format(new Date(), 'yyyy-MM-dd')}.csv`
  } else if (report === 'providers') {
    const providers = await getProviderPerformance()
    rows = providers.map(p => ({
      provider: p.name,
      total_assignments: p.total,
      accepted: p.accepted,
      declined: p.declined,
      acceptance_rate: p.total > 0 ? `${Math.round((p.accepted / p.total) * 100)}%` : '—',
    }))
    filename = `llv-provider-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`
  }

  return csvResponse(objectsToCsv(rows), filename)
}
