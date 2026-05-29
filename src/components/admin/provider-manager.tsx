'use client'

import { useState } from 'react'
import { ProviderForm, ProviderActions } from './provider-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import type { Provider, ServiceType } from '@/types/app'

const SERVICE_LABELS: Record<ServiceType, string> = {
  dry_cleaning: 'Dry Cleaning',
  wet_cleaning: 'Wet Cleaning',
  hand_wash: 'Hand Wash',
  pressing_steaming: 'Pressing',
  alterations: 'Alterations',
  repair: 'Repair',
  storage: 'Storage',
  shoe_care: 'Shoe Care',
  leather_care: 'Leather Care',
}

export function ProviderManager({ providers }: { providers: Provider[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{providers.length} partner{providers.length !== 1 ? 's' : ''}</span>
        <Button type="button" onClick={() => { setShowAdd(true); setEditingId(null) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add provider
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-medium mb-4">New provider</h3>
          <ProviderForm
            onClose={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {providers.map(provider => (
          <div key={provider.id} className="rounded-lg border border-border bg-card p-6 space-y-4">
            {editingId === provider.id ? (
              <>
                <h3 className="font-medium">Edit {provider.business_name}</h3>
                <ProviderForm
                  provider={provider}
                  onClose={() => setEditingId(null)}
                  onSuccess={() => setEditingId(null)}
                />
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium">{provider.business_name}</h2>
                      {provider.is_active ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {provider.contact_name} · {provider.email} · {provider.phone}
                    </p>
                    {provider.city && (
                      <p className="text-sm text-muted-foreground">
                        {provider.address_line1}{provider.address_line2 ? `, ${provider.address_line2}` : ''}{provider.address_line1 ? ', ' : ''}{provider.city}, {provider.state} {provider.postal_code}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {provider.capacity_per_week && (
                      <p className="text-sm font-medium">{provider.capacity_per_week} items/wk</p>
                    )}
                    {provider.turnaround_days_min && provider.turnaround_days_max && (
                      <p className="text-xs text-muted-foreground">
                        {provider.turnaround_days_min}–{provider.turnaround_days_max} day turnaround
                      </p>
                    )}
                  </div>
                </div>

                {provider.services && provider.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {provider.services.map(service => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {SERVICE_LABELS[service as ServiceType] ?? service}
                      </Badge>
                    ))}
                  </div>
                )}

                {provider.notes && (
                  <p className="text-sm text-muted-foreground border-t border-border pt-3">
                    {provider.notes}
                  </p>
                )}

                <div className="border-t border-border pt-3">
                  <ProviderActions
                    provider={provider}
                    onEdit={() => setEditingId(provider.id)}
                  />
                </div>
              </>
            )}
          </div>
        ))}

        {providers.length === 0 && !showAdd && (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">No providers yet. Add your first care partner.</p>
          </div>
        )}
      </div>
    </div>
  )
}
