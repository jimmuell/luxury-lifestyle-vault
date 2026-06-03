'use client'

import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HelpEscalate } from './help-escalate'

interface HelpTipPopoverProps {
  title: string
  body: string
  linkedArticleSlug: string | null
}

export function HelpTipPopover({ title, body, linkedArticleSlug }: HelpTipPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
          {linkedArticleSlug && (
            <Link
              href={`/client/help#${linkedArticleSlug}`}
              className="text-xs text-primary hover:underline block"
            >
              Learn more →
            </Link>
          )}
          <div className="pt-1 border-t border-border">
            <HelpEscalate />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
