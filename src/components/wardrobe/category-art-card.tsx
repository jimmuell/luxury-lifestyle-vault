import type { ItemCategory } from '@/types/app'
import { ITEM_CATEGORY_LABELS } from '@/types/app'
import { CATEGORY_GLYPHS } from './category-glyphs'
import { cn } from '@/lib/utils'

interface CategoryArtCardProps {
  category: ItemCategory
  name?: string
  brand?: string | null
  className?: string
  size?: 'grid' | 'list' | 'detail'
}

const GLYPH_PX: Record<'grid' | 'list' | 'detail', number> = {
  grid: 46,
  list: 22,
  detail: 64,
}

export function CategoryArtCard({
  category,
  name,
  brand,
  className,
  size = 'grid',
}: CategoryArtCardProps) {
  const Glyph = CATEGORY_GLYPHS[category]
  const glyphPx = GLYPH_PX[size]
  const showText = size !== 'list'

  return (
    <div className={cn('relative bg-card overflow-hidden flex flex-col items-center justify-center', className)}>
      {/* Hairline inset frame */}
      <div className="absolute inset-[9px] border border-accent/40 rounded-[3px] pointer-events-none" aria-hidden="true" />

      {/* LLV monogram — top-left */}
      {showText && (
        <span
          className="absolute top-3.5 left-3.5 text-[9px] tracking-[0.34em] text-accent font-sans leading-none select-none"
          aria-hidden="true"
        >
          LLV
        </span>
      )}

      {/* Glyph + labels */}
      <div className="flex flex-col items-center gap-1.5 text-accent relative z-10 px-3 text-center">
        <div style={{ width: glyphPx, height: glyphPx }} className="flex-shrink-0">
          <Glyph className="w-full h-full" />
        </div>

        {showText && (
          <>
            <span className="text-[9px] tracking-[0.32em] uppercase font-sans leading-none">
              {ITEM_CATEGORY_LABELS[category]}
            </span>
            {brand && (
              <span className="text-[8.5px] tracking-[0.26em] uppercase text-muted-foreground font-sans leading-none truncate max-w-full">
                {brand}
              </span>
            )}
            {name && (
              <span
                className={cn(
                  'font-serif text-foreground leading-tight line-clamp-2',
                  size === 'detail' ? 'text-sm' : 'text-[10px]',
                )}
              >
                {name}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
