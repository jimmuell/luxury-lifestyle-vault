'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { deleteOutfit } from '@/actions/outfits'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function OutfitDetailActions({
  outfitId,
}: {
  outfitId: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    startTransition(async () => {
      try {
        await deleteOutfit(outfitId)
      } catch {
        toast.error('Failed to delete outfit')
        setDeleting(false)
        setConfirming(false)
      }
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href={`/client/outfits/${outfitId}/edit`}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        <Pencil className="h-3.5 w-3.5 mr-1.5" />
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-60',
          confirming
            ? 'border-destructive text-destructive hover:bg-destructive/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {confirming ? 'Confirm delete' : 'Delete'}
      </button>
      {confirming && (
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
