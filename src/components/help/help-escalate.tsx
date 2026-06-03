'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface HelpEscalateProps {
  href?: string
}

export function HelpEscalate({ href = '/client/concierge' }: HelpEscalateProps) {
  return (
    <Link
      href={href}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
      Talk to your concierge
    </Link>
  )
}
