'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminUpdateShipping, adminMarkShipmentDelivered } from '@/actions/shipping'
import { CARRIERS } from '@/lib/shipping/carriers'
import { format } from 'date-fns'
import { Package, CheckCircle } from 'lucide-react'

interface Shipment {
  id: string
  direction: string
  carrier: string
  carrier_other: string | null
  tracking_number: string | null
  label_url: string | null
  shipped_at: string | null
  expected_delivery_at: string | null
  delivered_at: string | null
  shipping_cost_cents: number | null
  notes: string | null
}

interface ShippingPanelProps {
  orderId: string
  orderStatus: string
  shipments: Shipment[]
}

function ShipmentForm({
  orderId,
  direction,
  existingShipment,
  onDone,
}: {
  orderId: string
  direction: 'outbound' | 'return'
  existingShipment?: Shipment
  onDone: () => void
}) {
  const [carrier, setCarrier] = useState(existingShipment?.carrier ?? 'ups')
  const [carrierOther, setCarrierOther] = useState(existingShipment?.carrier_other ?? '')
  const [trackingNumber, setTrackingNumber] = useState(existingShipment?.tracking_number ?? '')
  const [labelUrl, setLabelUrl] = useState(existingShipment?.label_url ?? '')
  const [shippedAt, setShippedAt] = useState(
    existingShipment?.shipped_at ? existingShipment.shipped_at.slice(0, 16) : new Date().toISOString().slice(0, 16)
  )
  const [expectedAt, setExpectedAt] = useState(existingShipment?.expected_delivery_at?.slice(0, 16) ?? '')
  const [notes, setNotes] = useState(existingShipment?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    setSaving(true)
    startTransition(async () => {
      try {
        await adminUpdateShipping({
          orderId,
          shipmentId: existingShipment?.id,
          direction,
          carrier,
          carrierOther: carrier === 'other' ? carrierOther : undefined,
          trackingNumber,
          labelUrl: labelUrl || undefined,
          shippedAt: shippedAt || undefined,
          expectedDeliveryAt: expectedAt || undefined,
          notes: notes || undefined,
        })
        toast.success('Shipment saved')
        router.refresh()
        onDone()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save shipment')
        setSaving(false)
      }
    })
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Carrier</label>
          <select
            value={carrier}
            onChange={e => setCarrier(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          >
            {CARRIERS.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Tracking #</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder="1Z999AA10123456784"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
        </div>
      </div>

      {carrier === 'other' && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Carrier name</label>
          <input
            type="text"
            value={carrierOther}
            onChange={e => setCarrierOther(e.target.value)}
            placeholder="Carrier name"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Shipped at</label>
          <input
            type="datetime-local"
            value={shippedAt}
            onChange={e => setShippedAt(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Expected delivery</label>
          <input
            type="datetime-local"
            value={expectedAt}
            onChange={e => setExpectedAt(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-widest">
          Label URL <span className="normal-case">(optional)</span>
        </label>
        <input
          type="url"
          value={labelUrl}
          onChange={e => setLabelUrl(e.target.value)}
          placeholder="https://…"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-widest">
          Notes <span className="normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Internal shipping notes…"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : existingShipment ? 'Update shipment' : 'Save shipment'}
        </button>
        <button
          onClick={onDone}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function ShippingPanel({ orderId, orderStatus, shipments }: ShippingPanelProps) {
  const [showOutboundForm, setShowOutboundForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const outbound = shipments.find(s => s.direction === 'outbound')
  const returnShipment = shipments.find(s => s.direction === 'return')

  const showShippingPanel = ['in_preparation', 'shipped', 'delivered', 'return_initiated', 'return_received'].includes(orderStatus)

  if (!showShippingPanel) return null

  function handleMarkDelivered(shipmentId: string) {
    setMarkingDelivered(shipmentId)
    startTransition(async () => {
      try {
        await adminMarkShipmentDelivered(shipmentId, orderId)
        toast.success('Shipment marked as delivered')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to mark delivered')
      } finally {
        setMarkingDelivered(null)
      }
    })
  }

  return (
    <div className="space-y-3 p-5 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">Shipping</p>
      </div>

      {/* Outbound shipment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Outbound</p>
          {!showOutboundForm && (
            <button
              onClick={() => setShowOutboundForm(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {outbound ? 'Edit' : '+ Add shipment'}
            </button>
          )}
        </div>

        {outbound && !showOutboundForm && (
          <div className="text-sm space-y-1 pl-3 border-l-2 border-border">
            <p className="font-medium">
              {CARRIERS.find(c => c.code === outbound.carrier)?.label ?? outbound.carrier}
              {outbound.carrier === 'other' && outbound.carrier_other && ` (${outbound.carrier_other})`}
            </p>
            {outbound.tracking_number && (
              <p className="font-mono text-xs text-muted-foreground">{outbound.tracking_number}</p>
            )}
            {outbound.shipped_at && (
              <p className="text-xs text-muted-foreground">
                Shipped {format(new Date(outbound.shipped_at), 'MMM d, yyyy')}
              </p>
            )}
            {outbound.expected_delivery_at && (
              <p className="text-xs text-muted-foreground">
                Expected {format(new Date(outbound.expected_delivery_at), 'MMM d, yyyy')}
              </p>
            )}
            {outbound.delivered_at ? (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Delivered {format(new Date(outbound.delivered_at), 'MMM d, yyyy')}
              </p>
            ) : (
              <button
                onClick={() => handleMarkDelivered(outbound.id)}
                disabled={markingDelivered === outbound.id}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {markingDelivered === outbound.id ? 'Marking…' : 'Mark delivered'}
              </button>
            )}
          </div>
        )}

        {showOutboundForm && (
          <ShipmentForm
            orderId={orderId}
            direction="outbound"
            existingShipment={outbound}
            onDone={() => setShowOutboundForm(false)}
          />
        )}

        {!outbound && !showOutboundForm && (
          <p className="text-xs text-muted-foreground pl-2">No outbound shipment recorded.</p>
        )}
      </div>

      {/* Return shipment (only when relevant) */}
      {['return_initiated', 'return_received'].includes(orderStatus) && (
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Return</p>
            {!showReturnForm && (
              <button
                onClick={() => setShowReturnForm(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {returnShipment ? 'Edit' : '+ Add return'}
              </button>
            )}
          </div>

          {returnShipment && !showReturnForm && (
            <div className="text-sm space-y-1 pl-3 border-l-2 border-border">
              <p className="font-medium">
                {CARRIERS.find(c => c.code === returnShipment.carrier)?.label ?? returnShipment.carrier}
              </p>
              {returnShipment.tracking_number && (
                <p className="font-mono text-xs text-muted-foreground">{returnShipment.tracking_number}</p>
              )}
              {returnShipment.delivered_at ? (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Received {format(new Date(returnShipment.delivered_at), 'MMM d, yyyy')}
                </p>
              ) : (
                <button
                  onClick={() => handleMarkDelivered(returnShipment.id)}
                  disabled={markingDelivered === returnShipment.id}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {markingDelivered === returnShipment.id ? 'Marking…' : 'Mark received'}
                </button>
              )}
            </div>
          )}

          {showReturnForm && (
            <ShipmentForm
              orderId={orderId}
              direction="return"
              existingShipment={returnShipment}
              onDone={() => setShowReturnForm(false)}
            />
          )}

          {!returnShipment && !showReturnForm && (
            <p className="text-xs text-muted-foreground pl-2">No return shipment recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}
