import { createAdminClient } from '@/lib/supabase/admin'
import { subDays, startOfMonth, format } from 'date-fns'

export async function getReportKpis() {
  const db = createAdminClient()
  const now = new Date()

  const [clientsResult, revenueResult, ordersResult, activeClientsResult] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
    db.from('billing_history_cache').select('amount_cents').eq('status', 'paid'),
    db.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
    db.from('client_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const totalRevenueCents = (revenueResult.data ?? []).reduce((sum, r) => sum + r.amount_cents, 0)

  // Revenue this month
  const monthStart = startOfMonth(now).toISOString()
  const { data: thisMonthRevenue } = await db
    .from('billing_history_cache')
    .select('amount_cents')
    .eq('status', 'paid')
    .gte('invoice_date', monthStart)
  const thisMonthCents = (thisMonthRevenue ?? []).reduce((sum, r) => sum + r.amount_cents, 0)

  return {
    totalClients: clientsResult.count ?? 0,
    activeSubscriptions: activeClientsResult.count ?? 0,
    totalOrders: ordersResult.count ?? 0,
    totalRevenueCents,
    thisMonthRevenueCents: thisMonthCents,
  }
}

export async function getClientsByTier() {
  const db = createAdminClient()
  const { data } = await db
    .from('client_subscriptions')
    .select('service_tier_id, service_tiers(name)')
    .eq('status', 'active')

  const tally: Record<string, { name: string; count: number }> = {}
  for (const row of data ?? []) {
    const tier = row.service_tiers as { name: string } | null
    const name = tier?.name ?? 'Unknown'
    const key = row.service_tier_id
    tally[key] = { name, count: (tally[key]?.count ?? 0) + 1 }
  }

  return Object.values(tally).sort((a, b) => b.count - a.count)
}

export async function getRevenueTrend(months = 6) {
  const db = createAdminClient()
  const start = subDays(new Date(), months * 30).toISOString()

  const { data } = await db
    .from('billing_history_cache')
    .select('amount_cents, invoice_date')
    .eq('status', 'paid')
    .gte('invoice_date', start)
    .order('invoice_date')

  const buckets: Record<string, number> = {}
  for (const row of data ?? []) {
    const month = format(new Date(row.invoice_date), 'MMM yyyy')
    buckets[month] = (buckets[month] ?? 0) + row.amount_cents
  }

  return Object.entries(buckets).map(([month, cents]) => ({ month, cents }))
}

export async function getFulfillmentMetrics() {
  const db = createAdminClient()
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const { data: orders } = await db
    .from('orders')
    .select('status, created_at, confirmed_delivery_date')
    .gte('created_at', thirtyDaysAgo)
    .neq('status', 'cancelled')

  const total = orders?.length ?? 0
  const delivered = orders?.filter(o => ['delivered', 'return_initiated', 'return_received'].includes(o.status)).length ?? 0
  const inFlight = orders?.filter(o => ['confirmed', 'dispatched_to_provider', 'in_preparation', 'shipped'].includes(o.status)).length ?? 0
  const requested = orders?.filter(o => o.status === 'requested').length ?? 0

  return { total, delivered, inFlight, requested, deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0 }
}

export async function getProviderPerformance() {
  const db = createAdminClient()

  const { data } = await db
    .from('provider_order_assignments')
    .select('provider_id, provider_response, providers(business_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const stats: Record<string, { name: string; total: number; accepted: number; declined: number }> = {}
  for (const row of data ?? []) {
    const name = (row.providers as { business_name: string } | null)?.business_name ?? 'Unknown'
    const key = row.provider_id
    if (!stats[key]) stats[key] = { name, total: 0, accepted: 0, declined: 0 }
    stats[key].total++
    if (row.provider_response === 'accepted') stats[key].accepted++
    if (row.provider_response === 'declined') stats[key].declined++
  }

  return Object.values(stats).sort((a, b) => b.total - a.total)
}
