import type Stripe from 'stripe'
import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { paymentReceiptEmail, paymentFailedEmail } from '@/lib/resend/emails/payment-receipt'

export async function handleInvoiceEvent(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const supabase = createAdminClient()

  // Resolve client_id from the Stripe customer on the invoice
  const rawCustomer = invoice.customer as unknown as string | { id: string } | null
  const stripeCustomerId = typeof rawCustomer === 'string' ? rawCustomer : rawCustomer?.id ?? null

  let clientId: string | null = null
  if (stripeCustomerId) {
    const { data: cp } = await supabase
      .from('client_profiles')
      .select('profile_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    clientId = cp?.profile_id ?? null
  }

  // Update linked order
  if (invoice.metadata?.order_id) {
    const orderId = invoice.metadata.order_id
    if (event.type === 'invoice.paid') {
      await supabase
        .from('orders')
        .update({ stripe_invoice_id: invoice.id, paid_at: new Date().toISOString() })
        .eq('id', orderId)
    } else if (event.type === 'invoice.payment_failed') {
      await supabase
        .from('orders')
        .update({ stripe_invoice_id: invoice.id })
        .eq('id', orderId)
    }
  }

  // Populate billing_history_cache for paid invoices
  if (event.type === 'invoice.paid' && clientId && invoice.amount_paid > 0) {
    const invoiceAny = invoice as unknown as { subscription?: string | { id: string } | null }
    const rawSub = invoiceAny.subscription
    const subscriptionId = typeof rawSub === 'string' ? rawSub : rawSub?.id ?? null

    await supabase
      .from('billing_history_cache')
      .upsert({
        client_id: clientId,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        order_id: invoice.metadata?.order_id ?? null,
        amount_cents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        description: invoice.description ?? (invoice.lines.data[0]?.description ?? null),
        pdf_url: invoice.invoice_pdf ?? null,
        hosted_url: invoice.hosted_invoice_url ?? null,
        invoice_date: new Date(invoice.created * 1000).toISOString(),
        period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
        period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      }, { onConflict: 'stripe_invoice_id' })
  }

  // Send payment emails if we can resolve a client
  if (!clientId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', clientId)
    .single()

  if (!profile?.email) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const clientName = profile.full_name ?? profile.email
  const description = invoice.description ?? invoice.lines.data[0]?.description ?? 'Membership subscription'

  if (event.type === 'invoice.paid' && invoice.amount_paid > 0) {
    const emailContent = paymentReceiptEmail({
      clientName,
      amountCents: invoice.amount_paid,
      description,
      invoiceId: invoice.id,
      appUrl,
    })
    await inngest.send({
      name: 'email/send' as never,
      data: {
        recipientProfileId: clientId,
        to: profile.email,
        template: 'payment_receipt' as const,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
    })
  } else if (event.type === 'invoice.payment_failed') {
    const amountCents = invoice.amount_due
    const emailContent = paymentFailedEmail({
      clientName,
      amountCents,
      description,
      appUrl,
    })
    await inngest.send({
      name: 'email/send' as never,
      data: {
        recipientProfileId: clientId,
        to: profile.email,
        template: 'payment_failed' as const,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
    })
  }
}
