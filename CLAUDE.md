# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Luxury Lifestyle Vault — AI-assisted concierge logistics platform for luxury wardrobe management (storage, cleaning, seasonal delivery). Targeting affluent clients in Scottsdale. October 2026 soft launch.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run verify       # Lint + type check (run before every commit)
npm run lint         # ESLint only
npx tsc --noEmit     # TypeScript type check only

# Supabase
npx supabase db push                                              # Deploy migrations
npx supabase gen types typescript --linked > src/types/database.ts  # Regenerate types after schema changes

# Inngest (background jobs, local dev)
npx inngest-cli@latest dev
```

## Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **UI**: Tailwind CSS v4 + Shadcn/UI (Base UI components — no `asChild` prop, use `buttonVariants` on `<Link>` instead)
- **Database + Auth + Storage**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Background jobs**: Inngest (`/api/inngest` route)
- **Email**: Resend | **SMS**: Twilio | **Payments**: Stripe | **AI**: Anthropic Claude API

## Architecture

### Auth & Routing

`src/middleware.ts` is the load-bearing auth file. It:
1. Allows public routes (`/auth/*`, `/api/webhooks/*`, `/api/inngest`)
2. Redirects unauthenticated users to `/auth/login`
3. Enforces role-based path prefixes: `/client`, `/provider`, `/admin`

Three route groups: `(auth)`, `(client)`, `(provider)`, `(admin)` — each has its own layout with server-side role verification.

### Supabase Client Pattern

Three client factories in `src/lib/supabase/`:
- `client.ts` — browser client for Client Components
- `server.ts` — async server client (Next.js cookies) for Server Components + Server Actions
- `admin.ts` — service role client, server-only

**All Server Actions must re-verify the user session:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')
// derive client_id from user.id, never from form data
```

### Database Schema

6 migrations in `supabase/migrations/`. Key tables:
- `profiles` — extends Supabase auth (role: client/provider/admin)
- `client_profiles` — per-client metadata, Stripe customer ID
- `items` — wardrobe inventory with auto-generated SKU (`LLV-000001`)
- `item_photos` — storage paths + AI analysis results (jsonb)
- `item_conditions` — condition audit log per item
- `addresses`, `providers`

RLS is enforced at the DB layer. Clients cannot see other clients' items or change item status. All `item_status` transitions are admin-only via `src/actions/items.ts`.

### TypeScript Types

`src/types/database.ts` — manually maintained (run `supabase gen types` to regenerate from real schema). Each table **must** include `Relationships: []` or Supabase's generic inference breaks and returns `never`.

`src/types/app.ts` — app-level type aliases + label maps + valid status transition map.

### Shadcn/UI v4 Note

This project uses Shadcn with Base UI (not Radix). The `Button` component does **not** support `asChild`. Use `buttonVariants` for link-buttons:
```tsx
import { buttonVariants } from '@/components/ui/button'
<Link href="/somewhere" className={buttonVariants({ variant: 'outline' })}>Label</Link>
```

### Design System

Obsidian & Ivory palette with gold accent. CSS variables in `src/app/globals.css`. Fonts: Cormorant Garamond (serif, headings) + Inter (sans, body) loaded via `next/font` in root layout.

### Icons

**Use Lucide React icons (`lucide-react`) exclusively — no emoji in UI.** Emoji rendering varies by OS/browser/font and breaks the luxury brand voice. Examples:
- ✓ `import { Sun, Moon, Monitor } from 'lucide-react'`
- ✗ `<span>☀️</span>` or `<span>🌙</span>` in any user-facing component

Exception: dialog body copy and error messages CAN reference emoji for emphasis if absolutely necessary, but always prefer Lucide icons. Doc files (`.md`) and code comments are unrestricted — this rule is for the rendered UI only.

If you need an icon Lucide doesn't ship, propose adding `@radix-ui/react-icons` or a single-purpose SVG to `public/icons/` rather than reaching for emoji.
