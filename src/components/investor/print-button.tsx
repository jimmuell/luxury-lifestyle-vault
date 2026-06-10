'use client'

import { Printer } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-2'}
    >
      <Printer className="h-4 w-4" />
      Print
    </button>
  )
}
