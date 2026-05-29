'use client'

import { useState, useTransition } from 'react'
import { updateClientNotes } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'

export function InternalNotes({ clientId, notes }: { clientId: string; notes: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(notes ?? '')
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateClientNotes(clientId, value)
      if ('error' in result) toast.error(result.error)
      else { toast.success('Notes saved.'); setEditing(false) }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Internal notes</p>
        {!editing && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Private notes visible to admin only…"
            rows={4}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              <Check className="h-3.5 w-3.5 mr-1" />
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setValue(notes ?? ''); setEditing(false) }}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed min-h-[2rem]">
          {notes || <span className="italic">No notes.</span>}
        </p>
      )}
    </div>
  )
}
