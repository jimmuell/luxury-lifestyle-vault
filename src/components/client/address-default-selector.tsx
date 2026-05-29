'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { updateDefaultDeliveryAddress } from '@/actions/settings'

interface Address {
  id: string
  label: string
  line1: string
  line2: string | null
  city: string
  state: string
  postal_code: string
  is_primary: boolean
}

interface AddressDefaultSelectorProps {
  addresses: Address[]
  defaultAddressId: string | null
}

export function AddressDefaultSelector({ addresses, defaultAddressId }: AddressDefaultSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSetDefault(addressId: string) {
    startTransition(async () => {
      try {
        await updateDefaultDeliveryAddress(addressId)
        toast.success('Default delivery address updated')
        router.refresh()
      } catch {
        toast.error('Could not update default address')
      }
    })
  }

  if (addresses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4">
        No addresses on file. Add one via your concierge.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {addresses.map(addr => {
        const isDefault = addr.id === defaultAddressId
        return (
          <div
            key={addr.id}
            className={`rounded-lg border px-5 py-4 flex items-start justify-between gap-4 ${isDefault ? 'border-foreground/40 bg-muted/30' : 'border-border bg-card'}`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{addr.label}</p>
                {addr.is_primary && (
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    Primary
                  </span>
                )}
                {isDefault && (
                  <span className="text-[10px] uppercase tracking-widest text-foreground border border-foreground/30 rounded px-1.5 py-0.5 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    Default delivery
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''} · {addr.city}, {addr.state} {addr.postal_code}
              </p>
            </div>

            {!isDefault && (
              <button
                onClick={() => handleSetDefault(addr.id)}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors shrink-0 disabled:opacity-50"
              >
                Set default
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
