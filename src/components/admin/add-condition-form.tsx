'use client'

import { useState, useTransition } from 'react'
import { adminAddCondition } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ConditionLevel } from '@/types/app'
import { CONDITION_LEVEL_LABELS } from '@/types/app'
import { Plus } from 'lucide-react'

const CONDITION_LEVELS: ConditionLevel[] = ['pristine', 'excellent', 'good', 'fair', 'poor']

export function AddConditionForm({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState<ConditionLevel>('good')
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await adminAddCondition({ itemId, conditionLevel: level, notes: notes || undefined })
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Condition logged.')
        setOpen(false)
        setNotes('')
        setLevel('good')
      }
    })
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Log condition
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <p className="text-sm font-medium">New condition record</p>

      <div className="space-y-2">
        <Label className="text-xs">Condition</Label>
        <div className="flex gap-2 flex-wrap">
          {CONDITION_LEVELS.map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={cn(
                'px-3 py-1.5 rounded-md border text-xs transition-colors',
                level === lvl
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40'
              )}
            >
              {CONDITION_LEVEL_LABELS[lvl]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-condition-notes" className="text-xs">Notes</Label>
        <Textarea
          id="add-condition-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observations, issues, care notes…"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>
          {pending ? 'Saving…' : 'Save condition'}
        </Button>
      </div>
    </div>
  )
}
