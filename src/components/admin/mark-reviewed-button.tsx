'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { markDocumentReviewed } from '@/actions/admin-data-room'

export function MarkReviewedButton({ docId }: { docId: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const result = await markDocumentReviewed(docId)
      if ('success' in result) setDone(true)
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <Check className="h-3 w-3" /> Reviewed
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Mark reviewed
    </button>
  )
}
