import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { ExternalLink, FileText, CreditCard } from 'lucide-react'
import { HelpTip } from '@/components/help/help-tip'

export default async function BillingSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [subResult, invoicesResult] = await Promise.all([
    supabase
      .from('client_subscriptions')
      .select('status, cancel_at_period_end, current_period_end, founding_member_discount_applied, created_at, service_tiers(name, monthly_price_cents)')
      .eq('client_id', user!.id)
      .in('status', ['active', 'past_due', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('billing_history_cache')
      .select('id, invoice_date, description, amount_cents, currency, status, pdf_url, hosted_url, order_id, stripe_subscription_id, refunded_at, refund_amount_cents')
      .eq('client_id', user!.id)
      .order('invoice_date', { ascending: false })
      .limit(24),
  ])

  const sub = subResult.data
  const tier = sub?.service_tiers as { name: string; monthly_price_cents: number } | null
  const invoices = invoicesResult.data ?? []

  const statusColor: Record<string, string> = {
    active: 'text-emerald-600',
    past_due: 'text-amber-600',
    trialing: 'text-sky-600',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <h1 className="font-serif text-3xl font-light">Billing</h1>
        <HelpTip areaKey="client.billing" />
      </div>
      {/* Active subscription */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Subscription</h2>
        {sub ? (
          <div className="rounded-lg border border-border divide-y divide-border">
            <div className="flex justify-between items-center px-5 py-4 text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{tier?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-4 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={statusColor[sub.status] ?? 'text-foreground'}>
                {sub.cancel_at_period_end ? 'Cancels at period end' : sub.status}
              </span>
            </div>
            {tier?.monthly_price_cents != null && (
              <div className="flex justify-between items-center px-5 py-4 text-sm">
                <span className="text-muted-foreground">Monthly rate</span>
                <span>
                  ${(tier.monthly_price_cents / 100).toFixed(0)}/mo
                  {sub.founding_member_discount_applied && (
                    <span className="ml-2 text-xs text-amber-600">Founding member rate</span>
                  )}
                </span>
              </div>
            )}
            {sub.current_period_end && (
              <div className="flex justify-between items-center px-5 py-4 text-sm">
                <span className="text-muted-foreground">
                  {sub.cancel_at_period_end ? 'Access until' : 'Renews'}
                </span>
                <span>{format(new Date(sub.current_period_end), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border px-5 py-6 text-center text-sm text-muted-foreground italic">
            No active subscription.
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Payment method</h2>
        <div className="rounded-lg border border-border px-5 py-4 flex items-center gap-3 text-sm text-muted-foreground">
          <CreditCard className="h-4 w-4 shrink-0" />
          To update your payment method, contact your concierge.
        </div>
      </div>

      {/* Invoice history */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Invoice history</h2>

        {invoices.length === 0 ? (
          <div className="rounded-lg border border-border px-5 py-6 text-center text-sm text-muted-foreground italic">
            No invoices yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {invoices.map(inv => {
              const amount = (inv.amount_cents / 100).toFixed(2)
              const isRefunded = !!inv.refunded_at
              const refundAmount = inv.refund_amount_cents ? (inv.refund_amount_cents / 100).toFixed(2) : null
              const label = inv.description
                ?? (inv.stripe_subscription_id ? 'Subscription charge' : 'On-demand charge')

              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4 bg-card">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inv.invoice_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className={`text-sm font-medium ${isRefunded ? 'line-through text-muted-foreground' : ''}`}>
                      ${amount}
                    </p>
                    {isRefunded && (
                      <p className="text-xs text-emerald-600">
                        Refunded{refundAmount ? ` $${refundAmount}` : ''}
                      </p>
                    )}
                  </div>
                  {inv.pdf_url && (
                    <Link
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Download PDF"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
