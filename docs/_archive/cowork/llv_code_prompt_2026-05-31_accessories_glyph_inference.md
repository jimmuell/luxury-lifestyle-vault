# Code Prompt — Accessories: infer glyph from item name (necktie / bow tie / necklace / scarf / watch + gem fallback)

**Date:** 2026-05-31
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**Follows:** Bug Fix Cycle #23 (Category Art Cards). This is a refinement of the accessories glyph only.
**Bug Fix Cycle:** add entry after shipping (template at end).

## Context

The shipped Category Art Cards use a single glyph per category. For **accessories** the single bow-tie glyph reads poorly: (1) it renders visually smaller than the garment glyphs, and (2) a bow tie is a bad fit for the bucket's real contents (necklaces, scarves, shawls, bracelets, watches). Founder-approved fix (Jim, May 31): for accessories, **infer the glyph from keywords in the item name**, with a faceted **gem** as the fallback. Deterministic, no schema change, no AI. Scoped to accessories only for now (the other 13 categories keep their single glyph; the mechanism should be easy to extend to e.g. footwear later).

The item `name` is already passed into `CategoryArtCard` everywhere it renders, so the inference has what it needs. Card layout is unchanged (category → brand → item name); do **not** add an extra accessory-name line — the item name already identifies the piece.

## Files

- `src/components/wardrobe/category-glyphs.tsx`
- `src/components/wardrobe/category-art-card.tsx`

## Implementation

### 1. Add the accessory glyphs to `category-glyphs.tsx`

Add these as glyph components in the same style as the existing set (`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">`, inherits gold from the parent). **Sizing note:** these paths intentionally span ~y12–41 / ~x13–35 so they fill the same optical band as the garment glyphs — this also resolves the "bow tie too small" issue. Keep them at that scale.

```tsx
// necktie
<path d="M22 13 L26 13 L25.5 17 L22.5 17 Z"/><path d="M22.5 17 L21 35 L24 40 L27 35 L25.5 17"/>

// bow tie (enlarged to match the set)
<path d="M15 17 L24 24 L15 31 Z"/><path d="M33 17 L24 24 L33 31 Z"/><rect x="21.5" y="21" width="5" height="6" rx="1"/>

// necklace (pendant on a chain)
<path d="M13 15 C16 31 32 31 35 15"/><path d="M24 31 L21.5 35 L24 39 L26.5 35 Z"/>

// scarf (fringed)
<path d="M19 13 L29 13 L29 36 L19 36 Z"/><path d="M24 13 L24 36"/><path d="M20 36 L20 39 M22.5 36 L22.5 39 M25.5 36 L25.5 39 M28 36 L28 39"/>

// watch
<circle cx="24" cy="24" r="6.5"/><path d="M19 19 L20 12 L28 12 L29 19"/><path d="M19 29 L20 36 L28 36 L29 29"/><path d="M24 24 L24 20 M24 24 L27.5 25.5"/>

// gem (faceted — the accessories fallback)
<path d="M16 20 L32 20 L24 41 Z"/><path d="M16 20 L20 27 L28 27 L32 20"/><path d="M20 27 L24 41 M28 27 L24 41"/>
```

The previous standalone accessories glyph (the small bow tie) is replaced by this set — the **gem** becomes the accessories entry in `CATEGORY_GLYPHS` (the fallback), and the others are selected by inference.

### 2. Add the inference + a resolver

In `category-glyphs.tsx`, add an ordered keyword rule set and a `resolveGlyph(category, name)` helper:

```tsx
// Order matters: 'bow tie' must be tested before 'tie'.
const ACCESSORY_GLYPH_RULES: { keywords: string[]; glyph: React.FC<{ className?: string }> }[] = [
  { keywords: ['bow tie', 'bowtie', 'bow-tie'], glyph: BowTieGlyph },
  { keywords: ['necktie', 'neck tie', 'tie'],   glyph: NecktieGlyph },
  { keywords: ['necklace', 'pendant', 'strand'], glyph: NecklaceGlyph },
  { keywords: ['scarf', 'shawl', 'wrap', 'stole'], glyph: ScarfGlyph },
  { keywords: ['watch', 'timepiece'], glyph: WatchGlyph },
]

export function resolveGlyph(category: ItemCategory, name?: string | null): React.FC<{ className?: string }> {
  if (category === 'accessories') {
    const n = (name ?? '').toLowerCase()
    for (const rule of ACCESSORY_GLYPH_RULES) {
      if (rule.keywords.some(k => n.includes(k))) return rule.glyph
    }
    return GemGlyph // fallback: bracelets, rings, earrings, cufflinks, brooches, gloves, belts, sunglasses, etc.
  }
  return CATEGORY_GLYPHS[category]
}
```

Keep `CATEGORY_GLYPHS` as the source of truth for the other 13 categories; `accessories` in that map should point at `GemGlyph` (the fallback), since `resolveGlyph` handles the accessory branch.

### 3. Use the resolver in `category-art-card.tsx`

Replace the direct `CATEGORY_GLYPHS[category]` lookup with `resolveGlyph(category, name)`. No other layout changes. The component stays server-safe (pure, no hooks).

## Verification

1. `npm run verify` clean.
2. Seed wardrobe (a client with accessories — e.g. Margaret/Richard personas): confirm per-item glyphs — "…Necktie" → necktie, "…Bow Tie" → bow tie, "…Necklace"/"Pearl Strand…" → pendant, "…Scarf"/"…Shawl" → scarf, "…Watch" → watch, and "Diamond Tennis Bracelet"/anything unmatched → gem.
3. The accessories glyphs now match the optical size/weight of the garment glyphs (no more shrunken bow tie). Check grid, list, and detail sizes, light + dark.
4. A non-accessories item is unaffected (still uses its single category glyph).

## Bug Fix Cycle entry

> | NN | 2026-05-31 | Low | Wardrobe UX | Accessories art-card glyph is now inferred from the item name — necktie, bow tie, necklace, scarf, and watch glyphs selected by keyword (bow-tie tested before tie), with a faceted gem fallback for everything else (bracelets, rings, etc.). Added a `resolveGlyph(category, name)` helper; `CategoryArtCard` uses it. Also enlarged the accessory glyphs to match the optical weight of the garment glyphs (fixes the undersized bow tie). Scoped to accessories; mechanism extensible to other categories later. | ✅ FIXED |
