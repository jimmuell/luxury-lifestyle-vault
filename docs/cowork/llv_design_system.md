# LLV — Design System Reference

**Author:** Claude Cowork
**Date:** May 24, 2026
**Source documents:** `docs/strategy/llv_technology_architecture_blueprint.docx` (Section 2.3 Design Principles), live codebase (`src/app/globals.css`, `src/app/layout.tsx`, `components.json`, `src/components/ui/*`).
**Consumer:** Claude Code (building UI), future contractors or designers reviewing the system, founder QA.
**Scope:** Reference for the design tokens, component primitives, and conventions currently in use. This is descriptive (what's there), not prescriptive (what should be). Where the codebase has chosen something the blueprint doesn't ratify, that's noted.

---

## Status of this document

The palette, typography, and component framework described here exist in the codebase but have **not been ratified by Claude Chat in the blueprint**. They were established by Claude Code during the initial scaffold. Per `llv_needs_chat_review.md`:

- **[CR-7]** Shadcn/UI on Base UI — chosen in code, not in blueprint
- **[CR-10]** Design system (Obsidian & Ivory palette, Cormorant + Inter pairing) — chosen in code, not in blueprint

Once Chat ratifies (or revises) these decisions, this document should be updated to match. Until then, this is the working reference and Claude Code should continue building against it.

---

## 1. Brand vision (from blueprint Section 2.3)

The platform must communicate luxury, trust, and effortlessness — the experience of a private concierge service, not logistics software.

1. **Minimal, clean interface** with generous whitespace and elegant typography.
2. **Photography-forward design** showcasing the client's items beautifully.
3. **Maximum three taps** to accomplish any core task.
4. **Dark mode and light mode** with a luxury color palette.
5. **Proactive notifications** rather than requiring the client to check status.

Every component, layout, and copy decision should be evaluated against these five principles before being shipped.

---

## 2. Color palette

The palette is named **Obsidian & Ivory with gold accent**. It is intentionally restrained — two near-monochrome neutrals with a single warm accent. Photography is the color in this system; chrome stays out of the way.

All colors are defined in OKLCH in `src/app/globals.css`. Hex equivalents below are approximate, for designer/print reference only — **the codebase is the source of truth**.

### Light mode (`:root`)

| Role | CSS variable | OKLCH | Approx hex | Usage |
|---|---|---|---|---|
| Background | `--background` | `oklch(0.97 0.01 80)` | #F8F4EE (ivory) | Page background |
| Foreground | `--foreground` | `oklch(0.07 0 0)` | #0A0A0A (obsidian) | Body text |
| Card | `--card` | `oklch(0.98 0.005 80)` | near-white | Card surfaces |
| Primary | `--primary` | `oklch(0.07 0 0)` | obsidian | Primary actions, brand surfaces |
| Primary FG | `--primary-foreground` | `oklch(0.97 0.01 80)` | ivory | Text on primary |
| Secondary / Muted | `--secondary`, `--muted` | `oklch(0.92 0.008 80)` | #E8E4DE (mist) | Subtle surfaces, chips, secondary buttons |
| Muted FG | `--muted-foreground` | `oklch(0.46 0 0)` | #6B6B6B (stone) | Secondary text, captions |
| Accent | `--accent` | `oklch(0.73 0.10 75)` | #C9A96E (gold) | Selective emphasis — links, focus rings, brand moments |
| Accent FG | `--accent-foreground` | `oklch(0.07 0 0)` | obsidian | Text on gold |
| Destructive | `--destructive` | `oklch(0.54 0.19 22)` | warm error red | Destructive actions, error states |
| Border | `--border` | `oklch(0.88 0.008 80)` | warm light gray | All borders |
| Input | `--input` | `oklch(0.88 0.008 80)` | matches border | Input field borders |
| Ring | `--ring` | `oklch(0.73 0.10 75)` | gold | Focus rings |

### Dark mode (`.dark`)

| Role | CSS variable | OKLCH | Approx hex |
|---|---|---|---|
| Background | `--background` | `oklch(0.07 0 0)` | #0A0A0A (obsidian) |
| Foreground | `--foreground` | `oklch(0.97 0.01 80)` | #F8F4EE (ivory) |
| Card | `--card` | `oklch(0.14 0 0)` | #1A1A1A (charcoal) |
| Primary | `--primary` | `oklch(0.97 0.01 80)` | ivory |
| Secondary / Muted | `--secondary`, `--muted` | `oklch(0.21 0 0)` | #2A2A2A (graphite) |
| Muted FG | `--muted-foreground` | `oklch(0.74 0 0)` | #B8B8B8 (fog) |
| Accent | `--accent` | `oklch(0.73 0.10 75)` | gold (unchanged) |
| Destructive | `--destructive` | `oklch(0.65 0.19 22)` | brighter red for contrast |
| Border | `--border` | `oklch(1 0 0 / 10%)` | white at 10% |
| Input | `--input` | `oklch(1 0 0 / 15%)` | white at 15% |

### Palette rules

- **Gold is for emphasis, not decoration.** It marks the focus ring, the active state, brand moments, and key calls to action. If gold appears in three places on a screen, two are too many.
- **Obsidian is the brand color.** Primary buttons, brand surfaces, and the highest-density text use it. In dark mode, ivory takes its place.
- **The destructive color does not pair with gold.** Destructive surfaces should be visually quiet — error red on muted background, never red + gold.
- **No hex literals in components.** Every color goes through a CSS variable. If a needed color isn't in the variable set, add it to `globals.css` rather than hard-coding.
- **No saturated colors outside the palette.** Charts (`--chart-1` through `--chart-5`) are defined but not yet used; when they are, they should derive from the existing palette (gold variants, neutral steps), not from a generic chart library default.

---

## 3. Typography

Three font families, all loaded via `next/font/google` in `src/app/layout.tsx` with `display: swap` and exposed as CSS variables.

| Family | Variable | Use | Weights loaded |
|---|---|---|---|
| **Cormorant Garamond** | `--font-serif` (also aliased to `--font-heading`) | Headings, brand moments, editorial copy | 300, 400, 500 — normal and italic |
| **Inter** | `--font-sans` | Body text, UI labels, controls (the default — `html { font-sans }`) | Default variable font weights |
| **Geist Mono** | `--font-geist-mono` (aliased to `--font-mono` via `@theme inline`) | Code, SKUs, numerical references | Default |

### Typography rules

- **Headings use Cormorant Garamond.** Tailwind utility: `font-serif` or `font-heading` (both resolve to the same variable). Default weight 400; 300 for large display, 500 for compact heading contexts.
- **Body uses Inter.** Default for everything that isn't a heading. No utility class needed (set on `html`).
- **Italic Cormorant is the signature voice.** Use sparingly for tone — a tagline, a section opening, a concierge message. Not for UI labels.
- **Geist Mono is the data voice.** SKUs (`LLV-000001`), dollar amounts in dense tables, item dimensions, timestamps in technical contexts. Never for body copy.
- **Anti-aliasing is on globally** (`antialiased` on `<html>`). Don't disable per-element.
- **Line-height is generous by default.** Use Tailwind's `leading-relaxed` (1.625) for body copy by default; tighten to `leading-snug` (1.375) only for headings.

### Type scale — enforced via `<Typography>` primitives in `src/components/ui/typography.tsx`

All eight levels are exported as named React components from `src/components/ui/typography.tsx`. Import and use them instead of raw Tailwind utility strings for all heading and body text. A visual reference is at `/admin/styleguide`.

| Level | Component | Size | Family | Weight | Use |
|---|---|---|---|---|---|
| Display | `<Display>` | `text-5xl` | Cormorant | 300 | Marketing surfaces, hero |
| H1 | `<H1>` | `text-4xl` | Cormorant | 400 | Page titles |
| H2 | `<H2>` | `text-2xl` | Cormorant | 400 | Section titles |
| H3 | `<H3>` | `text-xl` | Cormorant | 500 | Subsection titles |
| Body | `<Body>` | `text-base` | Inter | 400 | Default paragraphs |
| Body small | `<BodySmall>` | `text-sm` | Inter | 400 | Dense data, helper text |
| Caption | `<Caption>` | `text-xs` | Inter | 500 (uppercase, tracked) | Eyebrows, table headers, badges |
| Mono | `<Mono>` | `text-sm` | Geist Mono | 400 | SKUs, amounts, timestamps |

**Polymorphic `as` prop:** each component renders its default HTML element but accepts `as` to change the tag while keeping the typographic treatment. Example: `<H2 as="h1">` renders an `<h1>` tag with H2 styling.

**`italic` prop:** available on the four serif components (`Display`, `H1`, `H2`, `H3`). Italic Cormorant is the signature voice — use sparingly for tone (concierge messages, empty states, taglines).

---

## 4. Spacing, radius, and elevation

### Spacing

Use Tailwind's default spacing scale (4px increments). The blueprint's "generous whitespace" principle translates to:

- **Section padding:** prefer `py-12` (48px) and above between major content blocks on client surfaces.
- **Card padding:** `p-6` (24px) baseline. Tighten to `p-4` (16px) only for dense data contexts (admin tables).
- **Form spacing:** `space-y-6` (24px) between labeled fields; `gap-2` (8px) between label and input.
- **Gutters:** `gap-6` or `gap-8` in grids on client surfaces; `gap-4` in admin tables.

### Radius

Defined in `globals.css` via `--radius: 0.375rem` (6px) as the base, with a scaled set:

| Token | Multiplier | Approx |
|---|---|---|
| `--radius-sm` | 0.6× | 3.6px |
| `--radius-md` | 0.8× | 4.8px |
| `--radius-lg` | 1× | 6px (base) |
| `--radius-xl` | 1.4× | 8.4px |
| `--radius-2xl` | 1.8× | 10.8px |
| `--radius-3xl` | 2.2× | 13.2px |
| `--radius-4xl` | 2.6× | 15.6px |

Use Tailwind's `rounded-{token}` utilities. Default button radius is `rounded-lg`. Cards default to `rounded-lg`. Avoid `rounded-full` except for avatars and pill badges. The system reads "elegantly squared," not "playful and round."

### Elevation

No shadow tokens are defined. The system relies on contrast and border, not drop shadow, for depth. If a shadow is genuinely needed, use Tailwind's `shadow-sm` (subtle separation) or `shadow-md` (modal/dialog only). Never `shadow-lg` or larger.

---

## 5. Component primitives — Shadcn on Base UI

**This project uses Shadcn UI on top of Base UI (`@base-ui/react`), not Radix.** This is the most important implementation detail in the document.

- **`components.json` style:** `"base-nova"` (the Base UI variant)
- **Component imports:** from `@base-ui/react/{component}`, not `@radix-ui/react-*`
- **Slot import** (`@radix-ui/react-slot`) is present in `package.json` for compatibility with a small number of Shadcn primitives that still depend on it, but new components built directly against Base UI should not introduce it.

### The `asChild` gotcha

The Shadcn `Button` in this codebase **does not support `asChild`** — it has no Radix Slot wrapper. The component signature is:

```ts
ButtonPrimitive.Props & VariantProps<typeof buttonVariants>
```

To render a link styled as a button, use `buttonVariants` directly on `<Link>`:

```tsx
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

<Link href="/client/wardrobe" className={buttonVariants({ variant: 'outline' })}>
  Browse my wardrobe
</Link>
```

This pattern applies anywhere a Shadcn primitive in this codebase was written without `asChild`. When in doubt, read the component file before reaching for `asChild`.

### Button variants and sizes

From `src/components/ui/button.tsx`:

**Variants:** `default` (obsidian), `outline`, `secondary`, `ghost`, `destructive`, `link`.

**Sizes:** `xs`, `sm`, `default` (h-8), `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

**Behaviors built in:**
- Active state nudges down 1px (`active:translate-y-px`) — keep it; it's a subtle tactile detail.
- Focus-visible uses the gold ring (`--ring`) at 3px with 50% opacity.
- Disabled state is `opacity-50 pointer-events-none`.
- `aria-invalid` triggers destructive border and ring.
- Icon sizing is automatic when SVG children are passed.

### The `cn()` helper

Class composition is via `src/lib/utils.ts`:

```ts
import { cn } from '@/lib/utils'
```

Always merge classNames through `cn()` to get `tailwind-merge` deduplication. Direct string concatenation of Tailwind classes will produce specificity bugs in dark mode.

---

## 6. Component inventory

Seventeen Shadcn components are installed in `src/components/ui/`:

| Component | File | Use |
|---|---|---|
| Avatar | `avatar.tsx` | Profile photos, initials fallback |
| Badge | `badge.tsx` | Status pills, category tags |
| Button | `button.tsx` | All actions — see Section 5 for the `asChild` note |
| Card | `card.tsx` | Surface containers |
| Dialog | `dialog.tsx` | Modal forms, confirmations |
| Dropdown Menu | `dropdown-menu.tsx` | Contextual menus, table row actions |
| Input | `input.tsx` | Text inputs |
| Label | `label.tsx` | Form labels — always pair with inputs |
| Navigation Menu | `navigation-menu.tsx` | Top nav, mega-menu structures |
| Progress | `progress.tsx` | Inline progress indicators, multi-step forms |
| Select | `select.tsx` | Dropdown selects |
| Separator | `separator.tsx` | Visual section dividers |
| Sheet | `sheet.tsx` | Side panels (filters, item quick-view, mobile nav) |
| Skeleton | `skeleton.tsx` | Loading placeholders — use generously, photo-shaped |
| Sonner | `sonner.tsx` | Toast notifications (see Section 7) |
| Tabs | `tabs.tsx` | In-page sectioning |
| Textarea | `textarea.tsx` | Multi-line input |

When a new primitive is needed, add it via Shadcn's CLI with the `base-nova` style — do not paste Radix-based Shadcn snippets directly.

### App-level components already in place

| Path | Use |
|---|---|
| `src/components/auth/login-form.tsx` | Email/password login |
| `src/components/auth/signup-form.tsx` | New account creation |
| `src/components/auth/demo-login.tsx` | Demo account fast-path (likely dev-only) |
| `src/components/client/client-nav.tsx` | Client portal navigation |
| `src/components/client/intake-form.tsx` | Item intake form scaffold |
| `src/components/shared/status-badge.tsx` | Renders an `ItemStatus` with consistent color/label |
| `src/components/shared/theme-toggle.tsx` | Light/dark/system toggle |

---

## 7. Notifications — Sonner

Toast notifications go through `sonner`, mounted once in `src/app/layout.tsx`:

```tsx
<Toaster position="bottom-right" />
```

### Toast rules

- **Position is fixed bottom-right.** Don't reposition per page.
- **Success messages are short.** "Item saved." not "The item has been saved successfully to your wardrobe."
- **Use semantic variants** — `toast.success()`, `toast.error()`, `toast.info()` — so styling is consistent.
- **Toasts confirm, they don't inform.** A toast is for "you just did a thing and it worked." For status communication, use proactive in-app notifications (per blueprint Section 2.3 principle 5) or email. Don't use toasts for things the user didn't initiate.
- **No toasts at page load** unless reacting to a redirect param (e.g., `?signed_out=1`).

---

## 8. Theme switching

Theme is managed by `next-themes`, set up in `src/app/layout.tsx`:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

### Theme rules

- **Default is system.** Respect the user's OS setting on first load.
- **The toggle UI** (`src/components/shared/theme-toggle.tsx`) exposes light, dark, and system. Don't ship a UI that only toggles between light and dark.
- **`disableTransitionOnChange` is intentional.** It prevents a color-flash on theme switch. Leave it enabled.
- **`suppressHydrationWarning`** is set on `<html>` because next-themes sets the class on hydration. This is correct; don't remove it.
- **Every new component must work in both modes.** Test with the toggle before considering a component done. Photography-forward surfaces especially need dark-mode QA because gold-on-obsidian behaves differently than gold-on-ivory.

---

## 9. Iconography

- **Library:** `lucide-react` (configured in `components.json`).
- **Sizing:** Buttons handle icon size automatically via `[&_svg:not([class*='size-'])]:size-4`. Outside buttons, default to `size-4` (16px) inline with text, `size-5` (20px) standalone, `size-6` (24px) for prominent affordances.
- **Use a small set.** Lucide has hundreds of icons; the brand reads more luxe with a restrained set. When unsure between two icons for the same idea, pick the more geometric one.
- **Decorative icons should be `aria-hidden`.** Functional icons must have an accessible label (visible or `sr-only`).

---

## 10. Layout conventions

These are conventions, not enforced by tooling — but Claude Code should default to them.

- **Container widths.** Client portal content uses `max-w-6xl mx-auto` for primary content areas, `max-w-2xl` for forms. Admin tables can go full-width.
- **Header zone.** Each route group has its own layout (`(client)/layout.tsx`, `(admin)/layout.tsx`, `(provider)/layout.tsx`). Navigation, theme toggle, and user menu live in the header.
- **Footer.** Concierge contact entry point (per CX-7 in `llv_phase_a_task_breakdown.md`) lives in the client footer. Admin and provider surfaces have no footer.
- **Mobile-first.** Tailwind's mobile-first cascade is the convention. Don't reach for `lg:` overrides until the base mobile layout is correct.
- **Three-tap rule.** Per blueprint Section 2.3, any core client task should be reachable within three interactions from `/client`. If a flow requires four taps, restructure.

---

## 11. Accessibility floor

All UI must meet WCAG 2.1 AA at minimum.

- **Color contrast:** the palette is calibrated for AA on body text. Don't pair gold-on-ivory for text smaller than 18pt — gold-on-obsidian only.
- **Focus visibility:** all interactive elements show the gold focus ring on `:focus-visible`. Don't disable this.
- **Form labels:** every input pairs with a `<Label>`. Never use placeholder text as a label.
- **Keyboard navigation:** every dialog, sheet, dropdown, and menu must be operable by keyboard alone. Base UI provides the keyboard interactions; preserve them.
- **Reduced motion:** respect `prefers-reduced-motion` if introducing custom animations. The existing `active:translate-y-px` is below the threshold of concern.
- **Image alt text:** every item photo carries the item name as `alt`. Decorative imagery uses `alt=""`.

---

## 12. Implementation rules and gotchas

Curated list of things easy to get wrong:

1. **`asChild` is not available on Button.** Use `buttonVariants` on `<Link>`. (See Section 5.)
2. **Always merge classes through `cn()`.** String concatenation loses `tailwind-merge` deduplication.
3. **Don't hard-code hex colors.** Add a CSS variable to `globals.css` first.
4. **Don't use `shadow-lg` or larger.** This system relies on contrast and border for depth.
5. **Don't use saturated chart colors.** Use the `--chart-1` through `--chart-5` variables (currently undefined — define before use, deriving from the palette).
6. **Don't disable the gold focus ring.** It's part of the brand.
7. **Don't ship a Cormorant heading without testing italic.** The italic glyph is more distinctive than the roman; it's worth seeing both.
8. **Don't use toasts for status updates the user didn't initiate.** Use proactive in-app messaging or email.
9. **Don't add a new Shadcn component without checking which Base UI version is being installed.** Pasting a Radix-based snippet will introduce a parallel primitive system.
10. **Don't break the three-tap rule** to add a feature. Restructure the navigation instead.

---

## 13. Open questions (for Chat ratification)

Things this document records but the blueprint has not formally approved. To be resolved through `llv_needs_chat_review.md`:

- **Brand color choice — Obsidian & Ivory with gold accent.** [CR-10] Does the founder approve this palette as the official brand identity? Once confirmed, the blueprint should be updated to record it, and any future palette changes should go through Chat.
- **Font pairing — Cormorant Garamond + Inter + Geist Mono.** [CR-10] Same question. Cormorant in particular is a meaningful brand commitment because it sets the editorial voice.
- **Shadcn UI on Base UI as the component framework.** [CR-7] Does the founder approve this over alternatives (raw Tailwind, a paid component library, Radix-based Shadcn)? The codebase has committed to it; ratification keeps the source of truth honest.
- **Logo / wordmark.** Not yet present in the codebase or any document. When the brand identity is finalized in Chat, a logo treatment should be added and referenced here.
- **Photography style guidelines.** The "photography-forward" principle implies a house photography style (lighting, background, framing, retouching). Not yet defined. Should be addressed before intake operations begin so that founder/daughter shoot consistently.
- **Iconography customization.** Lucide is the library; whether LLV needs any custom icons (e.g., the SKU-tag mark, the corridor mark) is open.

---

*End of design system reference. Cowork will revise as Chat ratifies the open questions and as Code introduces new tokens or components.*
