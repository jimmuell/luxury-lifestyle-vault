'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/server'
import { revalidatePath } from 'next/cache'
import { ORDER_STATUS_TRANSITIONS, CLIENT_CANCELLABLE_STATUSES } from '@/types/app'
import type { OrderStatus } from '@/types/app'
import { inngest } from '@/lib/inngest/client'
import { createNotification } from '@/lib/notifications'
import { orderConfirmationEmail } from '@/lib/resend/emails/order-confirmation'
import { orderStatusChangedEmail } from '@/lib/resend/emails/order-status-changed'
import { recordAuditEntry } from '@/lib/audit'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

async function requireAdmin() {
  const { supabase, user } = await getAuthenticatedUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
  return { supabase, user }
}

// ── Client actions ──────────────────────────────────────────────────────────

export async function createRotationRequest(data: {
  itemIds: string[]
  toAddressId: string
  requestedDeliveryDate: string
  notes?: string
}) {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: user.id,
      order_type: 'seasonal_rotation',
      status: 'requested',
      to_address_id: data.toAddressId,
      requested_delivery_date: data.requestedDeliveryDate,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (orderError) throw new Error(orderError.message)

  const orderItems = data.itemIds.map(itemId => ({
    order_id: order.id,
    item_id: itemId,
    unit_price_cents: null,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw new Error(itemsError.message)

  // Insert initial status history entry
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: 'requested',
    actor_profile_id: user.id,
    notes: 'Order created by client.',
  })

  revalidatePath('/client/orders')
  return { orderId: order.id }
}

export async function createOnDemandRequest(data: {
  itemIds: string[]
  toAddressId: string
  requestedDeliveryDate: string
  notes?: string
  isRush?: boolean
}) {
  const { supabase, user } = await getAuthenticatedUser()

  // Compute total from service tier (Tier 3: On-Demand)
  const { data: tier } = await supabase
    .from('service_tiers')
    .select('per_request_base_cents, per_item_surcharge_cents, rush_premium_pct, founding_member_discount_pct')
    .eq('name', 'On-Demand Occasion')
    .eq('active', true)
    .maybeSingle()

  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('founding_member')
    .eq('profile_id', user.id)
    .maybeSingle()

  let totalCents: number | null = null
  if (tier?.per_request_base_cents != null) {
    const base = tier.per_request_base_cents
    const perItem = tier.per_item_surcharge_cents ?? 0
    const additionalItems = Math.max(0, data.itemIds.length - 1)
    let subtotal = base + additionalItems * perItem

    if (data.isRush && tier.rush_premium_pct) {
      subtotal = Math.round(subtotal * (1 + Number(tier.rush_premium_pct) / 100))
    }
    if (clientProfile?.founding_member && tier.founding_member_discount_pct) {
      subtotal = Math.round(subtotal * (1 - Number(tier.founding_member_discount_pct) / 100))
    }
    totalCents = subtotal
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: user.id,
      order_type: 'on_demand_item',
      status: 'requested',
      to_address_id: data.toAddressId,
      requested_delivery_date: data.requestedDeliveryDate,
      notes: data.notes ?? null,
      total_cents: totalCents,
    })
    .select('id')
    .single()

  if (orderError) throw new Error(orderError.message)

  const orderItems = data.itemIds.map(itemId => ({
    order_id: order.id,
    item_id: itemId,
    unit_price_cents: totalCents ? Math.round(totalCents / data.itemIds.length) : null,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw new Error(itemsError.message)

  await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: 'requested',
    actor_profile_id: user.id,
    notes: 'On-demand request submitted.',
  })

  revalidatePath('/client/orders')
  return { orderId: order.id, totalCents }
}

export async function clientCancelOrder(orderId: string) {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: order } = await supabase
    .from('orders')
    .select('status, client_id')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')
  if (order.client_id !== user.id) throw new Error('Unauthorized')
  if (!CLIENT_CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
    throw new Error(`Cannot cancel an order in status "${order.status}"`)
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
  if (error) throw new Error(error.message)

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: 'cancelled',
    actor_profile_id: user.id,
    notes: 'Order cancelled by client.',
  })

  revalidatePath(`/client/orders/${orderId}`)
  revalidatePath('/client/orders')
  return { success: true }
}

export async function clientInitiateReturn(orderId: string, opts?: { itemIds?: string[] }) {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: order } = await supabase
    .from('orders')
    .select('status, client_id, order_type')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')
  if (order.client_id !== user.id) throw new Error('Unauthorized')
  if (order.status !== 'delivered') throw new Error('Can only initiate return on delivered orders')
  if (!['seasonal_rotation', 'on_demand_item'].includes(order.order_type)) {
    throw new Error('Returns only available for seasonal rotations and on-demand orders')
  }

  // Create return shipment record
  const shipmentNotes = opts?.itemIds?.length
    ? `Returning item IDs: ${opts.itemIds.join(', ')}`
    : null

  await supabase.from('order_shipments').insert({
    order_id: orderId,
    direction: 'return',
    notes: shipmentNotes,
  })

  const { error } = await supabase
    .from('orders')
    .update({ status: 'return_initiated' })
    .eq('id', orderId)
  if (error) throw new Error(error.message)

  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status: 'return_initiated',
    actor_profile_id: user.id,
    notes: 'Return initiated by client.',
  })

  revalidatePath(`/client/orders/${orderId}`)
  return { success: true }
}

// ── Admin actions ────────────────────────────────────────────────────────────

export async function adminTransitionOrderStatus(data: {
  orderId: string
  toStatus: OrderStatus
  notes?: string
  confirmedDeliveryDate?: string
}) {
  const { user } = await requireAdmin()
  const adminClient = createAdminClient()

  const { data: order } = await adminClient
    .from('orders')
    .select('status')
    .eq('id', data.orderId)
    .single()

  if (!order) throw new Error('Order not found')

  const validNext = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus]
  if (!validNext.includes(data.toStatus)) {
    throw new Error(`Invalid transition from "${order.status}" to "${data.toStatus}"`)
  }

  const updatePayload = data.toStatus === 'confirmed' && data.confirmedDeliveryDate
    ? { status: data.toStatus, confirmed_delivery_date: data.confirmedDeliveryDate }
    : { status: data.toStatus }

  const { error } = await adminClient.from('orders').update(updatePayload).eq('id', data.orderId)
  if (error) throw new Error(error.message)

  await adminClient.from('order_status_history').insert({
    order_id: data.orderId,
    status: data.toStatus,
    actor_profile_id: user.id,
    notes: data.notes ?? null,
  })

  // Fetch client info for notifications (best-effort — don't fail the transition)
  try {
    const { data: orderWithClient } = await adminClient
      .from('orders')
      .select('client_id, order_type, order_items(id)')
      .eq('id', data.orderId)
      .single()

    if (orderWithClient) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', orderWithClient.client_id)
        .single()

      if (profile?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
        const itemCount = orderWithClient.order_items?.length ?? 0

        // Determine which email to send and which notification type to create
        const STATUS_EMAIL_TRIGGERS: OrderStatus[] = [
          'dispatched_to_provider', 'in_preparation', 'shipped', 'delivered', 'return_initiated', 'return_received'
        ]

        if (data.toStatus === 'confirmed') {
          const emailData = orderConfirmationEmail({
            clientName: profile.full_name ?? profile.email,
            orderId: data.orderId,
            orderType: orderWithClient.order_type,
            itemCount,
            requestedDeliveryDate: null,
            appUrl,
          })
          await inngest.send({
            name: 'email/send' as never,
            data: {
              recipientProfileId: orderWithClient.client_id,
              to: profile.email,
              template: 'order_confirmation',
              ...emailData,
            },
          })
          await createNotification({
            recipientProfileId: orderWithClient.client_id,
            type: 'order_confirmed',
            title: 'Your order has been confirmed',
            snippet: `${itemCount} item${itemCount !== 1 ? 's' : ''} — your concierge is preparing your request.`,
            linkTarget: `/client/orders/${data.orderId}`,
            metadata: { orderId: data.orderId } as Record<string, string>,
          })
        } else if (STATUS_EMAIL_TRIGGERS.includes(data.toStatus)) {
          const emailData = orderStatusChangedEmail({
            clientName: profile.full_name ?? profile.email,
            orderId: data.orderId,
            orderType: orderWithClient.order_type,
            status: data.toStatus,
            appUrl,
          })
          await inngest.send({
            name: 'email/send' as never,
            data: {
              recipientProfileId: orderWithClient.client_id,
              to: profile.email,
              template: 'order_status_changed',
              ...emailData,
            },
          })
          await createNotification({
            recipientProfileId: orderWithClient.client_id,
            type: 'order_status_changed',
            title: emailData.subject.split(' — ')[0],
            linkTarget: `/client/orders/${data.orderId}`,
            metadata: { orderId: data.orderId, status: data.toStatus } as Record<string, string>,
          })
        }
      }
    }
  } catch {
    // Notification failures don't block the status transition
  }

  // Trigger per-request billing when an on-demand order is delivered
  if (data.toStatus === 'delivered') {
    try {
      const { data: orderForBilling } = await adminClient
        .from('orders')
        .select('order_type, client_id')
        .eq('id', data.orderId)
        .single()

      if (orderForBilling?.order_type === 'on_demand_item') {
        await inngest.send({
          name: 'order/delivered' as never,
          data: { orderId: data.orderId, clientId: orderForBilling.client_id },
        })
      }
    } catch { /* non-blocking */ }
  }

  // Audit log (non-blocking)
  try {
    await recordAuditEntry({
      actorId: user.id,
      action: 'order.status_transition',
      entityType: 'orders',
      entityId: data.orderId,
      beforeState: { status: order.status },
      afterState: { status: data.toStatus },
      metadata: { notes: data.notes ?? null },
    })
  } catch { /* audit failures never block operations */ }

  revalidatePath(`/admin/orders/${data.orderId}`)
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function adminAssignProvider(orderId: string, providerId: string | null) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('orders')
    .update({ provider_id: providerId })
    .eq('id', orderId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function adminDispatchToProvider(data: {
  orderId: string
  providerId: string
  pickupWindowStart: string
  pickupWindowEnd: string
  deliveryDeadline: string
  prepInstructions?: string
  declaredValueTotalCents?: number
}) {
  const { user } = await requireAdmin()
  const adminClient = createAdminClient()

  // Validate order is in confirmed status
  const { data: order } = await adminClient
    .from('orders')
    .select('id, status, client_id, requested_delivery_date')
    .eq('id', data.orderId)
    .single()

  if (!order) throw new Error('Order not found')
  if (order.status !== 'confirmed') throw new Error('Order must be in confirmed status to dispatch')

  // Check provider exists
  const { data: provider } = await adminClient
    .from('providers')
    .select('id, business_name')
    .eq('id', data.providerId)
    .eq('is_active', true)
    .single()

  if (!provider) throw new Error('Provider not found')

  // Compute declared value from order items if not provided
  let declaredValue = data.declaredValueTotalCents
  if (declaredValue == null) {
    const { data: orderItemsForValue } = await adminClient
      .from('order_items')
      .select('items(purchase_price)')
      .eq('order_id', data.orderId)
    declaredValue = Math.round(
      (orderItemsForValue ?? []).reduce((sum, oi) => {
        const itemData = oi.items as { purchase_price: number | null } | null
        return sum + (itemData?.purchase_price ?? 0)
      }, 0) * 100
    )
  }

  // Transition order status + set provider
  await adminClient
    .from('orders')
    .update({ status: 'dispatched_to_provider', provider_id: data.providerId })
    .eq('id', data.orderId)

  await adminClient.from('order_status_history').insert({
    order_id: data.orderId,
    status: 'dispatched_to_provider',
    actor_profile_id: user.id,
    notes: `Dispatched to ${provider.business_name}`,
  })

  // Create assignment row
  const { data: assignment } = await adminClient
    .from('provider_order_assignments')
    .insert({
      order_id: data.orderId,
      provider_id: data.providerId,
      assigned_by_profile_id: user.id,
      pickup_window_start: data.pickupWindowStart,
      pickup_window_end: data.pickupWindowEnd,
      delivery_deadline: data.deliveryDeadline,
      prep_instructions: data.prepInstructions || null,
      declared_value_total_cents: declaredValue || null,
      provider_response: 'pending',
    })
    .select('id')
    .single()

  if (!assignment) throw new Error('Failed to create assignment')

  // Notify provider via Inngest (non-blocking)
  try {
    await inngest.send({
      name: 'provider/assigned' as never,
      data: {
        assignmentId: assignment.id,
        orderId: data.orderId,
        providerId: data.providerId,
        providerName: provider.business_name,
      },
    })
  } catch {
    // notification failure doesn't block dispatch
  }

  // Notify client (order status changed)
  try {
    const { data: clientProfile } = await adminClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', order.client_id)
      .single()

    if (clientProfile) {
      const emailContent = orderStatusChangedEmail({
        clientName: clientProfile.full_name ?? clientProfile.email,
        orderId: data.orderId,
        orderType: 'order',
        status: 'dispatched_to_provider',
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
      })

      await inngest.send({
        name: 'email/send' as never,
        data: {
          recipientProfileId: clientProfile.id,
          to: clientProfile.email,
          template: 'order_status_changed',
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        },
      })

      await createNotification({
        recipientProfileId: clientProfile.id,
        type: 'order_status_changed',
        title: 'Order dispatched to provider',
        snippet: `Your order has been dispatched to ${provider.business_name}.`,
        linkTarget: `/client/orders/${data.orderId}`,
        metadata: { orderId: data.orderId } as Record<string, string>,
      })
    }
  } catch {
    // notification failure doesn't block dispatch
  }

  revalidatePath(`/admin/orders/${data.orderId}`)
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function adminUpdateOrderNotes(orderId: string, adminNotes: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('orders')
    .update({ admin_notes: adminNotes || null })
    .eq('id', orderId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}

// ── Cost preview helper (server action for client use) ───────────────────────

export async function computeOrderCost(data: {
  itemCount: number
  isRush?: boolean
}) {
  const { supabase, user } = await getAuthenticatedUser()

  const [tierResult, cpResult] = await Promise.all([
    supabase
      .from('service_tiers')
      .select('per_request_base_cents, per_item_surcharge_cents, rush_premium_pct, founding_member_discount_pct, min_lead_time_hours, rush_lead_time_hours')
      .eq('name', 'On-Demand Occasion')
      .eq('active', true)
      .maybeSingle(),
    supabase
      .from('client_profiles')
      .select('founding_member')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ])

  const tier = tierResult.data
  const isFoundingMember = cpResult.data?.founding_member ?? false

  if (!tier?.per_request_base_cents) return null

  const base = tier.per_request_base_cents
  const perItem = tier.per_item_surcharge_cents ?? 0
  const additionalItems = Math.max(0, data.itemCount - 1)
  const subtotal = base + additionalItems * perItem
  const rushMultiplier = data.isRush ? (1 + Number(tier.rush_premium_pct) / 100) : 1
  const discountMultiplier = isFoundingMember ? (1 - Number(tier.founding_member_discount_pct) / 100) : 1
  const total = Math.round(subtotal * rushMultiplier * discountMultiplier)

  return {
    base,
    perItem,
    subtotal,
    rushPremium: data.isRush ? Math.round(subtotal * (Number(tier.rush_premium_pct) / 100)) : 0,
    discount: isFoundingMember ? Math.round(subtotal * rushMultiplier * (1 - discountMultiplier)) : 0,
    total,
    isFoundingMember,
    minLeadTimeHours: tier.min_lead_time_hours,
    rushLeadTimeHours: tier.rush_lead_time_hours,
  }
}

export async function adminRefundOrder(orderId: string) {
  const { user } = await requireAdmin()
  const adminClient = createAdminClient()

  const { data: order } = await adminClient
    .from('orders')
    .select('stripe_invoice_id, paid_at, refunded_at')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')
  if (!order.stripe_invoice_id) throw new Error('No invoice to refund')
  if (order.refunded_at) throw new Error('Order already refunded')
  if (!order.paid_at) throw new Error('Order not yet paid')

  const invoiceRaw = await getStripe().invoices.retrieve(order.stripe_invoice_id, {
    expand: ['payment_intent'],
  })
  const invoice = invoiceRaw as unknown as {
    payment_intent: string | { id: string } | null
  }

  const paymentIntentId =
    typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : (invoice.payment_intent as { id: string } | null)?.id

  if (!paymentIntentId) throw new Error('No payment intent on invoice')

  await getStripe().refunds.create({ payment_intent: paymentIntentId })

  await adminClient.from('orders').update({
    refunded_at: new Date().toISOString(),
  }).eq('id', orderId)

  try {
    await recordAuditEntry({
      actorId: user.id,
      action: 'order.refunded',
      entityType: 'orders',
      entityId: orderId,
      metadata: { paymentIntentId },
    })
  } catch { /* non-blocking */ }

  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}

export async function adminMarkReturnReceived(orderId: string) {
  const { user } = await requireAdmin()
  const adminClient = createAdminClient()

  const { data: order } = await adminClient
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')
  if (order.status !== 'return_initiated') throw new Error('Order is not awaiting return receipt')

  await adminClient.from('orders').update({ status: 'return_received' }).eq('id', orderId)

  await adminClient.from('order_status_history').insert({
    order_id: orderId,
    status: 'return_received',
    actor_profile_id: user.id,
    notes: 'Return received — items back at vault.',
  })

  // Mark return shipment as delivered
  await adminClient
    .from('order_shipments')
    .update({ delivered_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('direction', 'return')

  // Reset item location to intake_pending
  const { data: orderItems } = await adminClient
    .from('order_items')
    .select('item_id')
    .eq('order_id', orderId)

  if (orderItems?.length) {
    await adminClient
      .from('items')
      .update({ location_status: 'intake_pending' })
      .in('id', orderItems.map(oi => oi.item_id))
  }

  try {
    await recordAuditEntry({
      actorId: user.id,
      action: 'order.return_received',
      entityType: 'orders',
      entityId: orderId,
      metadata: { itemCount: orderItems?.length ?? 0 },
    })
  } catch { /* non-blocking */ }

  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}
