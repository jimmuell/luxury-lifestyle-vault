'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
  return { user }
}

export async function adminUpdateShipping(data: {
  orderId: string
  shipmentId?: string
  direction: 'outbound' | 'return'
  carrier: string
  carrierOther?: string
  trackingNumber: string
  labelUrl?: string
  shippedAt?: string
  expectedDeliveryAt?: string
  shippingCostCents?: number
  notes?: string
}) {
  await requireAdmin()
  const adminClient = createAdminClient()

  // Verify order exists
  const { data: order } = await adminClient
    .from('orders')
    .select('id, status')
    .eq('id', data.orderId)
    .single()

  if (!order) throw new Error('Order not found')

  if (data.shipmentId) {
    // Update existing shipment
    const { error } = await adminClient
      .from('order_shipments')
      .update({
        carrier: data.carrier as never,
        carrier_other: data.carrierOther || null,
        tracking_number: data.trackingNumber || null,
        label_url: data.labelUrl || null,
        shipped_at: data.shippedAt || null,
        expected_delivery_at: data.expectedDeliveryAt || null,
        shipping_cost_cents: data.shippingCostCents ?? null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.shipmentId)
      .eq('order_id', data.orderId)

    if (error) throw new Error(error.message)
  } else {
    // Create new shipment
    const { error } = await adminClient
      .from('order_shipments')
      .insert({
        order_id: data.orderId,
        direction: data.direction as never,
        carrier: data.carrier as never,
        carrier_other: data.carrierOther || null,
        tracking_number: data.trackingNumber || null,
        label_url: data.labelUrl || null,
        shipped_at: data.shippedAt || null,
        expected_delivery_at: data.expectedDeliveryAt || null,
        shipping_cost_cents: data.shippingCostCents ?? null,
        notes: data.notes || null,
      })

    if (error) throw new Error(error.message)

    // Auto-transition in_preparation → shipped when outbound shipment with tracking is saved
    if (
      data.direction === 'outbound' &&
      data.trackingNumber &&
      order.status === 'in_preparation'
    ) {
      await adminClient
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', data.orderId)

      await adminClient.from('order_status_history').insert({
        order_id: data.orderId,
        status: 'shipped',
        notes: `Shipped via ${data.carrier.toUpperCase()}${data.trackingNumber ? ` — ${data.trackingNumber}` : ''}`,
      })
    }
  }

  revalidatePath(`/admin/orders/${data.orderId}`)
  revalidatePath(`/client/orders/${data.orderId}`)
  return { success: true }
}

export async function adminMarkShipmentDelivered(shipmentId: string, orderId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  await adminClient
    .from('order_shipments')
    .update({ delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', shipmentId)
    .eq('order_id', orderId)

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath(`/client/orders/${orderId}`)
  return { success: true }
}
