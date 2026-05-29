'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { CorridorCreateForm } from './corridor-create-form'

interface Corridor {
  id: string
  slug: string
  display_name: string
  origin_region_code: string
  destination_region_code: string
  active: boolean
  sort_order: number
}

export function CorridorList({ corridors }: { corridors: Corridor[] }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      {showCreate && <CorridorCreateForm onClose={() => setShowCreate(false)} />}

      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New corridor
          </button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
          {corridors.map(c => (
            <Link
              key={c.id}
              href={`/admin/settings/corridors/${c.id}`}
              className="flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{c.display_name}</p>
                  {!c.active && (
                    <span className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  {c.origin_region_code} ↔ {c.destination_region_code}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
          {corridors.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No corridors configured.</p>
          )}
        </div>
      </div>
    </>
  )
}
