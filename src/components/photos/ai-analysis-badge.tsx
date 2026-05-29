'use client'

import { Badge } from '@/components/ui/badge'
import type { Json } from '@/types/database'

interface AiAnalysis {
  suggestedCategory?: string
  suggestedName?: string
  detectedBrand?: string | null
  detectedColor?: string | null
  conditionFlags?: string[]
  confidence?: number
}

export function AiAnalysisBadge({ analysis }: { analysis: Json | null }) {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return null

  const a = analysis as AiAnalysis
  const flags = a.conditionFlags ?? []

  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">AI analysis</p>
      <div className="flex flex-wrap gap-1.5">
        {a.suggestedName && (
          <Badge variant="secondary" className="text-xs">
            {a.suggestedName}
          </Badge>
        )}
        {a.detectedColor && (
          <Badge variant="secondary" className="text-xs">{a.detectedColor}</Badge>
        )}
        {a.detectedBrand && (
          <Badge variant="secondary" className="text-xs">{a.detectedBrand}</Badge>
        )}
        {flags.map((flag, i) => (
          <Badge key={i} variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            {flag}
          </Badge>
        ))}
        {a.confidence !== undefined && (
          <span className="text-xs text-muted-foreground self-center">
            {Math.round((a.confidence ?? 0) * 100)}% confident
          </span>
        )}
      </div>
    </div>
  )
}
