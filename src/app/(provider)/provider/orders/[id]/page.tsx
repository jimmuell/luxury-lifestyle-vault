import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { H1, Caption } from '@/components/ui/typography'
import { ProviderOrderActions } from '@/components/provider/provider-order-actions'
import { ProviderItemStages } from '@/components/provider/provider-item-stages'
import { ProviderMessageForm } from '@/components/provider/provider-message-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ProviderOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify provider identity
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('profile_id', user!.id)
    .single()

  if (!provider) redirect('/provider')

  // Load assignment — provider only sees their own assignments
  const { data: assignment } = await supabase
    .from('provider_order_assignments')
    .select('id, provider_response, pickup_window_start, pickup_window_end, delivery_deadline, prep_instructions, declared_value_total_cents, decline_reason')
    .eq('order_id', orderId)
    .eq('provider_id', provider.id)
    .single()

  if (!assignment) notFound()

  // Load order details — omit client PII per AR-3
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_type,
      status,
      from_location,
      notes,
      order_items (
        id,
        item_id,
        notes,
        provider_service_stage,
        provider_notes,
        damage_flagged,
        items (
          id,
          name,
          brand,
          category,
          color,
          material,
          care_instructions,
          sku,
          item_photos (
            id,
            storage_path,
            storage_bucket,
            photo_type,
            ai_analysis
          )
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  // Load message thread for this order
  const { data: messages } = await supabase
    .from('concierge_messages')
    .select('id, subject, body, status, created_at, is_provider_message, author_profile_id')
    .eq('related_order_id', orderId)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          href="/provider"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
        </Link>
        <Caption as="p" className="text-muted-foreground mb-1">Order</Caption>
        <H1 className="font-light capitalize">
          {order.order_type.replace(/_/g, ' ')}
        </H1>
      </div>

      {/* Assignment context */}
      <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
        <div className="grid grid-cols-2 gap-0">
          {assignment.pickup_window_start && (
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Pickup window</p>
              <p className="text-sm font-medium">
                {format(new Date(assignment.pickup_window_start), 'MMM d')}
                {assignment.pickup_window_end && ` – ${format(new Date(assignment.pickup_window_end), 'MMM d')}`}
              </p>
            </div>
          )}
          {assignment.delivery_deadline && (
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Delivery deadline</p>
              <p className="text-sm font-medium">{format(new Date(assignment.delivery_deadline), 'MMMM d, yyyy')}</p>
            </div>
          )}
          {assignment.declared_value_total_cents != null && (
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Declared value</p>
              <p className="text-sm font-medium">${(assignment.declared_value_total_cents / 100).toFixed(2)}</p>
            </div>
          )}
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Corridor</p>
            <p className="text-sm font-medium capitalize">{(order.from_location ?? 'TBD').replace(/_/g, ' ')}</p>
          </div>
        </div>
        {assignment.prep_instructions && (
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Preparation instructions</p>
            <p className="text-sm text-muted-foreground">{assignment.prep_instructions}</p>
          </div>
        )}
        {order.notes && (
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Order notes</p>
            <p className="text-sm text-muted-foreground italic">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Accept / Decline (only when pending) */}
      {assignment.provider_response === 'pending' && (
        <ProviderOrderActions assignmentId={assignment.id} orderId={orderId} />
      )}

      {/* Item stage tracking (only when accepted) */}
      {assignment.provider_response === 'accepted' && (
        <ProviderItemStages
          orderId={orderId}
          orderItems={order.order_items as Parameters<typeof ProviderItemStages>[0]['orderItems']}
        />
      )}

      {/* Messaging thread */}
      {assignment.provider_response === 'accepted' && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Communications</h2>

          {messages && messages.length > 0 && (
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className="rounded-lg border border-border p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{msg.subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'MMM d · h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {msg.is_provider_message ? 'You → LLV' : 'LLV operations'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">{msg.body}</p>
                </div>
              ))}
            </div>
          )}

          <ProviderMessageForm orderId={orderId} />
        </div>
      )}
    </div>
  )
}
