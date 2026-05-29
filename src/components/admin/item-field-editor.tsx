'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface ItemFieldEditorProps {
  label: string
  value: string | null
  onSave: (value: string) => Promise<{ error?: string } | { success: boolean }>
  multiline?: boolean
  placeholder?: string
}

export function ItemFieldEditor({ label, value, onSave, multiline, placeholder }: ItemFieldEditorProps) {
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState(value ?? '')
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await onSave(current)
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${label} updated.`)
        setEditing(false)
      }
    })
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">{label}</p>
        {!editing && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder={placeholder}
              rows={3}
            />
          ) : (
            <Input
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder={placeholder}
            />
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              <Check className="h-3.5 w-3.5 mr-1" />
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setCurrent(value ?? ''); setEditing(false) }}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed min-h-[1.5rem]">
          {value || <span className="italic">Not set</span>}
        </p>
      )}
    </div>
  )
}
