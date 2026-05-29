'use client'

import { Printer } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'print:hidden')}
    >
      <Printer className="h-3.5 w-3.5 mr-1.5" />
      Print
    </button>
  )
}
