import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { objectsToCsv, csvResponse } from '@/lib/csv/export'
import { format } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const clientId = url.searchParams.get('client_id')

  const adminClient = createAdminClient()
  let query = adminClient
    .from('billing_history_cache')
    .select('client_id, stripe_invoice_id, amount_cents, currency, status, description, invoice_date, order_id, refunded_at, refund_amount_cents, profiles(full_name, email)')
    .order('invoice_date', { ascending: false })
    .limit(5000)

  if (from) query = query.gte('invoice_date', from)
  if (to) query = query.lte('invoice_date', to)
  if (clientId) query = query.eq('client_id', clientId)

  const { data: rows } = await query

  const csvRows = (rows ?? []).map(r => {
    const profile = r.profiles as { full_name: string | null; email: string } | null
    return {
      date: format(new Date(r.invoice_date), 'yyyy-MM-dd'),
      client_name: profile?.full_name ?? '',
      client_email: profile?.email ?? '',
      amount: (r.amount_cents / 100).toFixed(2),
      currency: r.currency.toUpperCase(),
      status: r.status,
      description: r.description ?? '',
      invoice_id: r.stripe_invoice_id,
      order_id: r.order_id ?? '',
      refunded: r.refunded_at ? 'Yes' : 'No',
      refund_amount: r.refund_amount_cents ? (r.refund_amount_cents / 100).toFixed(2) : '',
    }
  })

  const filename = `llv-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
  return csvResponse(objectsToCsv(csvRows as unknown as Record<string, unknown>[]), filename)
}
