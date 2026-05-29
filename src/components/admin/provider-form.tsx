'use client'

import { useState, useTransition } from 'react'
import { createProvider, updateProvider, deactivateProvider, reactivateProvider } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Provider, ServiceType } from '@/types/app'

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'dry_cleaning', label: 'Dry Cleaning' },
  { value: 'wet_cleaning', label: 'Wet Cleaning' },
  { value: 'hand_wash', label: 'Hand Wash' },
  { value: 'pressing_steaming', label: 'Pressing / Steaming' },
  { value: 'alterations', label: 'Alterations' },
  { value: 'repair', label: 'Repair' },
  { value: 'storage', label: 'Storage' },
  { value: 'shoe_care', label: 'Shoe Care' },
  { value: 'leather_care', label: 'Leather Care' },
]

interface ProviderFormProps {
  provider?: Provider
  onClose: () => void
  onSuccess: () => void
}

export function ProviderForm({ provider, onClose, onSuccess }: ProviderFormProps) {
  const isEdit = !!provider
  const [pending, startTransition] = useTransition()
  const [services, setServices] = useState<ServiceType[]>(
    (provider?.services ?? []) as ServiceType[]
  )

  function toggleService(svc: ServiceType) {
    setServices(prev =>
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Append selected services (checkboxes aren't in formData since they're controlled)
    services.forEach(s => formData.append('services', s))

    startTransition(async () => {
      const result = isEdit
        ? await updateProvider(provider.id, formData)
        : await createProvider(formData)

      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? 'Provider updated.' : 'Provider added.')
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="business_name">Business name *</Label>
          <Input id="business_name" name="business_name" defaultValue={provider?.business_name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact name *</Label>
          <Input id="contact_name" name="contact_name" defaultValue={provider?.contact_name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={provider?.phone} required />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" defaultValue={provider?.email} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Services offered</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleService(value)}
              className={cn(
                'px-3 py-1.5 rounded-md border text-xs transition-colors',
                services.includes(value)
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40 text-muted-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity_per_week">Capacity / wk</Label>
          <Input id="capacity_per_week" name="capacity_per_week" type="number" min="0" defaultValue={provider?.capacity_per_week ?? ''} placeholder="50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="turnaround_days_min">Min turnaround</Label>
          <Input id="turnaround_days_min" name="turnaround_days_min" type="number" min="0" defaultValue={provider?.turnaround_days_min ?? ''} placeholder="3" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="turnaround_days_max">Max turnaround</Label>
          <Input id="turnaround_days_max" name="turnaround_days_max" type="number" min="0" defaultValue={provider?.turnaround_days_max ?? ''} placeholder="7" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address_line1">Street address</Label>
          <Input id="address_line1" name="address_line1" defaultValue={provider?.address_line1 ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={provider?.city ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={provider?.state ?? ''} placeholder="WI" maxLength={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code</Label>
          <Input id="postal_code" name="postal_code" defaultValue={provider?.postal_code ?? ''} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={provider?.notes ?? ''} rows={2} placeholder="Specializations, contact preferences, pickup/drop-off logistics…" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={pending}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Update provider' : 'Add provider'}
        </Button>
      </div>
    </form>
  )
}

export function ProviderActions({ provider, onEdit }: { provider: Provider; onEdit: () => void }) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const result = provider.is_active
        ? await deactivateProvider(provider.id)
        : await reactivateProvider(provider.id)
      if (result && 'error' in result) toast.error(result.error)
      else toast.success(provider.is_active ? 'Provider deactivated.' : 'Provider reactivated.')
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>Edit</Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={pending}
        className={cn(provider.is_active ? 'text-destructive hover:text-destructive' : '')}
      >
        {pending ? '…' : provider.is_active ? 'Deactivate' : 'Reactivate'}
      </Button>
    </div>
  )
}
