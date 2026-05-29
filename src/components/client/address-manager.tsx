'use client'

import { useState, useTransition } from 'react'
import { createAddress, updateAddress, deleteAddress, setPrimaryAddress } from '@/actions/addresses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Address } from '@/types/app'
import { toast } from 'sonner'

interface AddressFormFields {
  label: string
  line1: string
  line2: string
  city: string
  state: string
  postal_code: string
  country: string
  delivery_instructions: string
}

const EMPTY_FORM: AddressFormFields = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  delivery_instructions: '',
}

function AddressForm({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  submitLabel = 'Save address',
}: {
  initial?: AddressFormFields
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}) {
  const [pending, startTransition] = useTransition()
  const [fields, setFields] = useState<AddressFormFields>(initial)

  function set(key: keyof AddressFormFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields(prev => ({ ...prev, [key]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => onSubmit(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Address label</Label>
        <Input
          id="label"
          name="label"
          value={fields.label}
          onChange={set('label')}
          placeholder="e.g. Scottsdale winter, Brookfield primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line1">Street address *</Label>
        <Input
          id="line1"
          name="line1"
          value={fields.line1}
          onChange={set('line1')}
          placeholder="123 Main Street"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2">Apt, suite, unit</Label>
        <Input
          id="line2"
          name="line2"
          value={fields.line2}
          onChange={set('line2')}
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={fields.city}
            onChange={set('city')}
            placeholder="Scottsdale"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            name="state"
            value={fields.state}
            onChange={set('state')}
            placeholder="AZ"
            maxLength={2}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code *</Label>
          <Input
            id="postal_code"
            name="postal_code"
            value={fields.postal_code}
            onChange={set('postal_code')}
            placeholder="85251"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={fields.country}
            onChange={set('country')}
            placeholder="US"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery_instructions">Delivery instructions</Label>
        <Textarea
          id="delivery_instructions"
          name="delivery_instructions"
          value={fields.delivery_instructions}
          onChange={set('delivery_instructions')}
          placeholder="Gate code, concierge desk instructions, etc."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleCreate(formData: FormData) {
    const result = await createAddress(formData)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Address saved.')
      setShowAdd(false)
    }
  }

  async function handleUpdate(addressId: string, formData: FormData) {
    const result = await updateAddress(addressId, formData)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Address updated.')
      setEditingId(null)
    }
  }

  function handleDelete(addressId: string) {
    startTransition(async () => {
      const result = await deleteAddress(addressId)
      if ('error' in result) toast.error(result.error)
      else toast.success('Address removed.')
    })
  }

  function handleSetPrimary(addressId: string) {
    startTransition(async () => {
      const result = await setPrimaryAddress(addressId)
      if ('error' in result) toast.error(result.error)
      else toast.success('Primary address updated.')
    })
  }

  return (
    <div className="space-y-6">
      {addresses.length === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-border text-center space-y-3">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
          <Button type="button" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add address
          </Button>
        </div>
      )}

      {addresses.map(addr => (
        <div key={addr.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
          {editingId === addr.id ? (
            <AddressForm
              initial={{
                label: addr.label ?? '',
                line1: addr.line1,
                line2: addr.line2 ?? '',
                city: addr.city,
                state: addr.state,
                postal_code: addr.postal_code,
                country: addr.country,
                delivery_instructions: addr.delivery_instructions ?? '',
              }}
              onSubmit={formData => handleUpdate(addr.id, formData)}
              onCancel={() => setEditingId(null)}
              submitLabel="Update address"
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{addr.label || 'Address'}</p>
                    {addr.is_primary && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
                  {addr.delivery_instructions && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{addr.delivery_instructions}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!addr.is_primary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleSetPrimary(addr.id)}
                      title="Set as primary"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingId(addr.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(addr.id)}
                    className={cn(!addr.is_primary && 'text-destructive hover:text-destructive')}
                    disabled={addr.is_primary}
                    title={addr.is_primary ? 'Cannot delete primary address' : 'Delete address'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium mb-4">New address</p>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      ) : addresses.length > 0 ? (
        <Button type="button" variant="outline" onClick={() => setShowAdd(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add another address
        </Button>
      ) : null}
    </div>
  )
}
