import type { ItemCategory } from '@/types/app'

type GlyphFC = (props: { className?: string }) => React.ReactElement

const props = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.3',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const NecktieGlyph: GlyphFC = ({ className }) => (
  <svg {...props} className={className}>
    <path d="M22 13 L26 13 L25.5 17 L22.5 17 Z"/>
    <path d="M22.5 17 L21 35 L24 40 L27 35 L25.5 17"/>
  </svg>
)

const BowTieGlyph: GlyphFC = ({ className }) => (
  <svg {...props} className={className}>
    <path d="M15 17 L24 24 L15 31 Z"/>
    <path d="M33 17 L24 24 L33 31 Z"/>
    <rect x="21.5" y="21" width="5" height="6" rx="1"/>
  </svg>
)

const NecklaceGlyph: GlyphFC = ({ className }) => (
  <svg {...props} className={className}>
    <path d="M13 15 C16 31 32 31 35 15"/>
    <path d="M24 31 L21.5 35 L24 39 L26.5 35 Z"/>
  </svg>
)

const ScarfGlyph: GlyphFC = ({ className }) => (
  <svg {...props} className={className}>
    <path d="M19 13 L29 13 L29 36 L19 36 Z"/>
    <path d="M24 13 L24 36"/>
    <path d="M20 36 L20 39 M22.5 36 L22.5 39 M25.5 36 L25.5 39 M28 36 L28 39"/>
  </svg>
)

const WatchGlyph: GlyphFC = ({ className }) => (
  <svg {...props} className={className}>
    <circle cx="24" cy="24" r="6.5"/>
    <path d="M19 19 L20 12 L28 12 L29 19"/>
    <path d="M19 29 L20 36 L28 36 L29 29"/>
    <path d="M24 24 L24 20 M24 24 L27.5 25.5"/>
  </svg>
)

const GemGlyph: GlyphFC = ({ className }) => (
  <svg {...props} className={className}>
    <path d="M16 20 L32 20 L24 41 Z"/>
    <path d="M16 20 L20 27 L28 27 L32 20"/>
    <path d="M20 27 L24 41 M28 27 L24 41"/>
  </svg>
)

export const CATEGORY_GLYPHS: Record<ItemCategory, GlyphFC> = {
  eveningwear: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M20 9 L22.5 16 M28 9 L25.5 16"/>
      <path d="M22.5 16 L19 30 L15 44 L33 44 L29 30 L25.5 16 Z"/>
      <path d="M19 30 L29 30"/>
    </svg>
  ),
  suiting: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M16 10 L24 22 L32 10"/>
      <path d="M16 10 L14 44 L24 40 L34 44 L32 10"/>
      <path d="M24 22 L24 40"/>
      <circle cx="24" cy="29" r="0.9" fill="currentColor"/>
      <circle cx="24" cy="34" r="0.9" fill="currentColor"/>
    </svg>
  ),
  handbags: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M14 20 L34 20 L31 40 L17 40 Z"/>
      <path d="M19 20 C19 12 29 12 29 20"/>
    </svg>
  ),
  footwear: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M14 31 C21 31 27 29 32 25 L35 25 C37 28 35 31 31 31 Z"/>
      <path d="M31 31 L32 40 L35 40"/>
    </svg>
  ),
  outerwear: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M18 10 L24 16 L30 10 L34 14 L31 44 L17 44 L14 14 Z"/>
      <path d="M24 16 L24 44"/>
      <path d="M14 27 L17 27 M31 27 L34 27"/>
    </svg>
  ),
  accessories: GemGlyph,
  shirts_blouses: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M17 10 L14 14 L14 28 L17 28 L17 44 L31 44 L31 28 L34 28 L34 14 L31 10"/>
      <path d="M17 10 L24 17 L31 10"/>
      <circle cx="24" cy="28" r="0.9" fill="currentColor"/>
      <circle cx="24" cy="33" r="0.9" fill="currentColor"/>
      <circle cx="24" cy="38" r="0.9" fill="currentColor"/>
    </svg>
  ),
  trousers_skirts: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M14 10 L34 10 L34 14 L14 14 Z"/>
      <path d="M14 14 L16 44 L22 44 L24 28 L26 44 L32 44 L34 14"/>
    </svg>
  ),
  dresses: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M18 10 L14 44 L34 44 L30 10 Z"/>
      <path d="M18 10 C20 7 28 7 30 10"/>
      <path d="M16 26 L32 26"/>
    </svg>
  ),
  knitwear: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M18 10 L14 14 L14 28 L17 28 L17 44 L31 44 L31 28 L34 28 L34 14 L30 10"/>
      <path d="M18 10 C20 7.5 28 7.5 30 10"/>
      <path d="M14 24 L17 24 M31 24 L34 24"/>
      <path d="M17 41 L31 41"/>
    </svg>
  ),
  activewear: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M19 10 L14 16 L14 44 L34 44 L34 16 L29 10"/>
      <path d="M19 10 L21 14 L24 10 L27 14 L29 10"/>
    </svg>
  ),
  swimwear: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M19 10 L29 10 L33 22 L30 44 L18 44 L15 22 Z"/>
      <path d="M19 10 C21 7 27 7 29 10"/>
      <path d="M15 22 L33 22"/>
    </svg>
  ),
  lingerie: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M20 12 L17 44 L31 44 L28 12"/>
      <path d="M20 12 C21 9 27 9 28 12"/>
      <path d="M18 9 L20 12 M28 12 L30 9"/>
    </svg>
  ),
  other: ({ className }) => (
    <svg {...props} className={className}>
      <path d="M24 10 C26 10 27 12 27 14 C27 16 25 17 24 17"/>
      <path d="M24 17 L13 31 L35 31"/>
      <path d="M13 31 L13 33 C13 34 14 34 15 34 L33 34 C34 34 35 33 35 33 L35 31"/>
    </svg>
  ),
}

const ACCESSORY_GLYPH_RULES: { keywords: string[]; glyph: GlyphFC }[] = [
  { keywords: ['bow tie', 'bowtie', 'bow-tie'], glyph: BowTieGlyph },
  { keywords: ['necktie', 'neck tie', 'tie'],   glyph: NecktieGlyph },
  { keywords: ['necklace', 'pendant', 'strand'], glyph: NecklaceGlyph },
  { keywords: ['scarf', 'shawl', 'wrap', 'stole'], glyph: ScarfGlyph },
  { keywords: ['watch', 'timepiece'], glyph: WatchGlyph },
]

export function resolveGlyph(
  category: ItemCategory,
  name: string | null | undefined,
  className?: string,
): React.ReactElement {
  if (category === 'accessories' && name) {
    const lower = name.toLowerCase()
    for (const rule of ACCESSORY_GLYPH_RULES) {
      if (rule.keywords.some(kw => lower.includes(kw))) {
        return rule.glyph({ className })
      }
    }
  }
  return CATEGORY_GLYPHS[category]({ className })
}
