import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleSubscriptionEvent } from '@/lib/stripe/webhooks/handle-subscription'
import { handleInvoiceEvent } from '@/lib/stripe/webhooks/handle-invoice'
import { handleSetupIntentSucceeded } from '@/lib/stripe/webhooks/handle-setup-intent'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency check — deduplicate by Stripe event ID
  const { data: existing } = await supabase
    .from('stripe_webhook_events')
    .select('id, processed_at')
    .eq('id', event.id)
    .single()

  if (existing?.processed_at) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Record the event (upsert to handle concurrent delivery)
  await supabase.from('stripe_webhook_events').upsert({
    id: event.id,
    type: event.type,
    payload: event as never,
  })

  let processingError: string | null = null

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event)
        break

      case 'invoice.paid':
      case 'invoice.payment_failed':
        await handleInvoiceEvent(event)
        break

      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event)
        break

      default:
        // All other events acknowledged but not processed
        break
    }
  } catch (err) {
    processingError = err instanceof Error ? err.message : String(err)
    console.error(`Stripe webhook handler error for ${event.type}:`, processingError)
  }

  await supabase
    .from('stripe_webhook_events')
    .update({
      processed_at: new Date().toISOString(),
      processing_error: processingError,
    })
    .eq('id', event.id)

  if (processingError) {
    return NextResponse.json({ error: processingError }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
