import type Stripe from 'stripe'
import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/server'
import { createNotification } from '@/lib/notifications'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

export const billOnDemandOrder = inngest.createFunction(
  {
    id: 'bill-on-demand-order',
    triggers: [{ event: 'order/delivered' as never }],
    retries: 3,
  },
  async ({ event }: { event: { data: { orderId: string; clientId: string } } }) => {
    return withSentryCapture(async () => {
      const { orderId, clientId } = event.data
      const adminClient = createAdminClient()

      const { data: order } = await adminClient
        .from('orders')
        .select('id, order_type, is_rush, paid_at, stripe_invoice_id, order_items(id, unit_price_cents)')
        .eq('id', orderId)
        .single()

      if (!order) return { skipped: 'order not found' }
      if (order.order_type !== 'on_demand_item') return { skipped: 'not on_demand_item' }
      if (order.paid_at) return { skipped: 'already billed' }

      const { data: clientProfile } = await adminClient
        .from('client_profiles')
        .select('stripe_customer_id, founding_member')
        .eq('profile_id', clientId)
        .single()

      if (!clientProfile?.stripe_customer_id) return { skipped: 'no stripe customer' }

      const { data: sub } = await adminClient
        .from('client_subscriptions')
        .select('service_tier_id')
        .eq('client_id', clientId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: tier } = sub
        ? await adminClient.from('service_tiers').select('per_request_base_cents, per_item_surcharge_cents, rush_premium_pct, founding_member_discount_pct').eq('id', sub.service_tier_id).single()
        : { data: null }

      const baseCents = tier?.per_request_base_cents ?? 7500
      const perItemCents = tier?.per_item_surcharge_cents ?? 1500
      const rushPremiumPct = tier?.rush_premium_pct ?? 50
      const discountPct = (clientProfile.founding_member && tier?.founding_member_discount_pct) ? tier.founding_member_discount_pct : 0

      const orderItems = (order.order_items as Array<{ id: string }> | null) ?? []
      const itemCount = orderItems.length

      let subtotal = baseCents + perItemCents * itemCount
      if (order.is_rush) subtotal = Math.round(subtotal * (1 + rushPremiumPct / 100))
      const totalCents = Math.round(subtotal * (1 - discountPct / 100))

      // Create invoice items then the invoice
      const invoiceItemParams: Stripe.InvoiceItemCreateParams[] = [
        { customer: clientProfile.stripe_customer_id, amount: baseCents, currency: 'usd', description: 'On-demand request — base fee', metadata: { order_id: orderId } },
      ]
      if (itemCount > 0) {
        invoiceItemParams.push({
          customer: clientProfile.stripe_customer_id,
          amount: perItemCents * itemCount,
          currency: 'usd',
          description: `Per-item surcharge (${itemCount} item${itemCount !== 1 ? 's' : ''})`,
          metadata: { order_id: orderId },
        })
      }
      if (order.is_rush) {
        const rushAdder = Math.round(subtotal - (baseCents + perItemCents * itemCount))
        invoiceItemParams.push({
          customer: clientProfile.stripe_customer_id,
          amount: rushAdder,
          currency: 'usd',
          description: `Rush delivery premium (${rushPremiumPct}%)`,
          metadata: { order_id: orderId },
        })
      }

      for (const params of invoiceItemParams) {
        await getStripe().invoiceItems.create(params)
      }

      const invoice = await getStripe().invoices.create({
        customer: clientProfile.stripe_customer_id,
        auto_advance: true,
        metadata: { order_id: orderId },
        ...(discountPct > 0 ? { discounts: [{ coupon: `founding_member_${discountPct}pct` }] } : {}),
      })

      const finalized = await getStripe().invoices.finalizeInvoice(invoice.id)
      await getStripe().invoices.pay(finalized.id)

      await adminClient.from('orders').update({
        stripe_invoice_id: invoice.id,
        paid_at: new Date().toISOString(),
        total_cents: totalCents,
      }).eq('id', orderId)

      try {
        await createNotification({
          recipientProfileId: clientId,
          type: 'payment_succeeded',
          title: 'Payment received',
          snippet: `$${(totalCents / 100).toFixed(2)} charged for your recent delivery.`,
          linkTarget: `/client/orders/${orderId}`,
          metadata: { orderId, invoiceId: invoice.id } as Record<string, string>,
        })
      } catch { /* non-blocking */ }

      return { invoiceId: invoice.id, totalCents }
    }, 'bill-on-demand-order')
  }
)
