import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { H1, Caption } from '@/components/ui/typography'
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'


export default async function ProviderDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: provider } = await supabase
    .from('providers')
    .select('id, business_name, contact_name')
    .eq('profile_id', user!.id)
    .single()

  if (!provider) {
    return (
      <div className="max-w-2xl py-20 text-center">
        <p className="font-serif text-2xl text-muted-foreground">Provider profile not found.</p>
        <p className="text-sm text-muted-foreground mt-2">Contact your LLV administrator.</p>
      </div>
    )
  }

  const { data: assignments } = await supabase
    .from('provider_order_assignments')
    .select(`
      id,
      order_id,
      provider_response,
      pickup_window_start,
      pickup_window_end,
      delivery_deadline,
      created_at,
      orders (
        id,
        order_type,
        status,
        to_address_id,
        order_items (id)
      )
    `)
    .eq('provider_id', provider.id)
    .not('provider_response', 'eq', 'declined')
    .order('delivery_deadline', { ascending: true })

  const pendingAssignments = assignments?.filter(a => a.provider_response === 'pending') ?? []
  const activeAssignments = assignments?.filter(a => a.provider_response === 'accepted') ?? []

  const displayName = provider.contact_name ?? provider.business_name

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <Caption as="p" className="text-muted-foreground mb-1">Provider Portal</Caption>
        <H1 className="font-light">Welcome, {displayName}.</H1>
      </div>

      {pendingAssignments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-medium">Awaiting your response ({pendingAssignments.length})</h2>
          </div>
          <div className="divide-y divide-border rounded-lg border border-amber-200 overflow-hidden">
            {pendingAssignments.map(a => (
              <Link
                key={a.id}
                href={`/provider/orders/${a.order_id}`}
                className="flex items-center justify-between px-5 py-4 bg-amber-50/40 hover:bg-amber-50/80 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {(a.orders as { order_type: string } | null)?.order_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Order'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(a.orders as { order_items: { id: string }[] } | null)?.order_items?.length ?? 0} item(s)
                    {a.delivery_deadline && ` · Due ${format(new Date(a.delivery_deadline), 'MMM d')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1">
                    Respond
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeAssignments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-medium">Active orders ({activeAssignments.length})</h2>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {activeAssignments.map(a => {
              const orderStatus = (a.orders as { status: string } | null)?.status ?? ''
              const itemCount = (a.orders as { order_items: { id: string }[] } | null)?.order_items?.length ?? 0

              return (
                <Link
                  key={a.id}
                  href={`/provider/orders/${a.order_id}`}
                  className="flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {(a.orders as { order_type: string } | null)?.order_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Order'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                      {a.delivery_deadline && ` · Due ${format(new Date(a.delivery_deadline), 'MMM d')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs rounded-full px-2.5 py-1 border',
                      orderStatus === 'in_preparation'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-border text-muted-foreground'
                    )}>
                      {orderStatus.replace(/_/g, ' ')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {(!assignments || assignments.length === 0) && (
        <div className="py-16 text-center rounded-lg border border-dashed border-border">
          <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-serif text-lg text-muted-foreground italic">No active assignments.</p>
          <p className="text-sm text-muted-foreground mt-1">New assignments will appear here when dispatched by LLV.</p>
        </div>
      )}
    </div>
  )
}
