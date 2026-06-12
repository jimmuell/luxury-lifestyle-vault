# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Document source of truth

LLV docs live in three systems. Before creating or trusting a document, know which is canonical:

- **Drive vault** ("Luxury Lifestyle Vault") — business/strategy/brand/investor/operations/legal docs. Governed by the Master Document Standard. Not in this repo.
- **Notion** ("LLV Launch — Project Tracker") — launch task status + operational runbooks (e.g., Founder Dashboard Verifications). The single task board — do NOT keep parallel task lists or status docs in this repo.
- **This repo** — source code; developer docs under `docs/`; and `docs/legal/*.md`, which render the live /terms and /privacy pages (canonical here).

**One-canonical-copy rule:** when the same content exists in more than one system, exactly one copy is canonical and every other copy carries a banner at the top naming the canonical location. A repo doc that duplicates canonical Drive/Notion content gets a `> **⚠️ SUPERSEDED — …**` banner pointing to the canonical home (and may be renamed `*.SUPERSEDED.md`). Never silently maintain a second live copy.

The authority for this convention is the Drive vault doc "LLV Source-of-Truth Map" (00 CoWork / 01 Master Document Spec).

**Repo-local rules:**
- **`docs/_archive/` is historical only — never treat it as current.** Do not infer requirements from anything there.
- This repo keeps local only what's needed to build: this file, `AGENTS.md`, `README.md`, the local-dev runbook (`docs/cowork/llv_local_dev_troubleshooting.md`), the design system (`docs/cowork/llv_design_system.md`), and any open Code-prompt handed to you. Business/strategy/brand docs live in Drive, which you cannot read directly.
- If you need document or spec context you can't get from this file or the code, **stop and ask the founder** — they will consult Cowork/Drive and, if needed, drop a current working copy into the repo for the task. Never act on a stale local doc in preference to the Drive source.

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

There are no automated tests — `npm run verify` (ESLint + TypeScript) is the only CI gate.

### Local dev server — ownership & known recurring failure (read before debugging)

**Who runs the local dev server: the founder, exclusively.** Claude Code must NOT run `npm run dev` / `next dev`, and must NOT `pkill`/`kill` Next processes — a second server collides on port 3000 and has repeatedly broken local dev. To verify your work, run `npm run verify` (ESLint + TypeScript; no server required) and ask the founder to exercise the running app for any manual/UI checks. The commands in this section are the founder's recovery procedure, not a step for you to run.

If the app won't run locally — `next dev` reaches "Ready" then dies, hangs at `○ Compiling proxy ...`, blank page, or webpack throws `loadProjectInfo is not a function` — **do NOT debug the proxy.** The cause is a corrupted `node_modules/next` (usually from in-place edits/instrumentation of Next internals or half-applied patches); the hang and the `loadProjectInfo` crash are symptoms, not a `proxy.ts` bug. Canonical fix:

```bash
pkill -f next-server; pkill -f "next dev"   # only one next dev may run at a time
node -v                                      # must be 20.19.5 (.nvmrc); else: nvm use
rm -rf .next node_modules && npm install && npm run dev
```

Rules to avoid recurrence: never hand-edit `node_modules`; run under Node 20.19.5; only one `next dev` owner at a time (don't `pkill` Next while someone else is running it). Full details: `docs/cowork/llv_local_dev_troubleshooting.md`.

## Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **UI**: Tailwind CSS v4 + Shadcn/UI (Base UI components — no `asChild` prop, use `buttonVariants` on `<Link>` instead)
- **Database + Auth + Storage**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Background jobs**: Inngest (`/api/inngest` route)
- **Email**: Resend (React JSX templates with inline CSS — not Tailwind) | **SMS**: Twilio (env vars present, not yet wired) | **Payments**: Stripe | **AI**: Anthropic Claude API

## Architecture

### Auth & Routing

`src/proxy.ts` is the load-bearing auth file (Next.js 16 renamed middleware → proxy). It:
1. Allows public routes (`/auth/*`, `/api/webhooks/*`, `/api/inngest`)
2. Redirects unauthenticated users to `/auth/login`
3. Enforces role-based path prefixes: `/client`, `/provider`, `/admin`
4. Redirects clients who haven't completed onboarding to `/client/onboarding`

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

**Server Action return convention:** return `{ error: string }` on failure, `{ success: true }` or `{ data: ... }` on success. Never throw from an action that a form might call — throw only for auth/permission violations.

### Database Schema

27 migrations in `supabase/migrations/`. Key tables:
- `profiles` — extends Supabase auth (role: client/provider/admin, onboarding_complete flag)
- `client_profiles` — per-client metadata, Stripe customer ID
- `items` — wardrobe inventory with auto-generated SKU (`LLV-000001`)
- `item_photos` — storage paths + AI analysis results (jsonb)
- `item_conditions` — condition audit log per item
- `orders`, `order_items`, `order_status_history`
- `service_tiers`, `subscriptions`
- `concierge_messages`, `notifications`, `notification_config`
- `corridors`, `providers`, `addresses`
- `outfits`, `outfit_items`
- `stripe_webhook_events` — idempotency log (deduplicates by Stripe event ID)
- `ai_search_logs` — Claude Haiku wardrobe search usage

RLS is enforced at the DB layer. Clients cannot see other clients' items or change item status. All `item_status` transitions are admin-only via `src/actions/items.ts`.

Seeded records carry `is_seed_data = true` for cleanup targeting. Use `createAdminClient()` when writing seed or webhook code that must bypass RLS.

### TypeScript Types

`src/types/database.ts` — manually maintained (run `supabase gen types` to regenerate from real schema). Each table **must** include `Relationships: []` or Supabase's generic inference breaks and returns `never`.

`src/types/app.ts` — app-level type aliases + label maps + valid status transition map.

### Background Jobs (Inngest)

Six functions registered at `src/app/api/inngest/route.ts`, defined in `src/lib/inngest/functions/`:

| Function | Trigger |
|---|---|
| `categorize-photo` | Photo uploaded → AI analysis → stored in `item_photos.ai_analysis` (async; upload returns immediately) |
| `create-stripe-customer` | New user completes onboarding → Stripe customer created |
| `send-email` | Generic dispatch used by other functions (Resend) |
| `notify-provider-assignment` | Order assigned → email/SMS provider |
| `bill-on-demand-order` | On-demand order approved → Stripe charge |
| `seasonal-rotation-reminders` | Scheduled cron → quarterly client reminders |

Trigger jobs from Server Actions via `inngest.send(...)` — never await long-running work inline.

### AI Integration

`src/actions/search.ts` uses Claude Haiku for natural-language wardrobe search. It sends item summaries + AI analysis data as prompt context and falls back to substring matching if the Anthropic request fails. Usage logged to `ai_search_logs`.

### Stripe

Onboarding captures the payment method via SetupIntent (no charge at signup). Subscription activation charges later in a separate step. Webhook handler at `src/app/api/webhooks/stripe/route.ts` deduplicates by Stripe event ID via `stripe_webhook_events` before processing — prevents double-charging on retries.

### Shadcn/UI v4 Note

This project uses Shadcn with Base UI (not Radix). The `Button` component does **not** support `asChild`. Use `buttonVariants` for link-buttons:
```tsx
import { buttonVariants } from '@/components/ui/button'
<Link href="/somewhere" className={buttonVariants({ variant: 'outline' })}>Label</Link>
```

### Tailwind v4

No `tailwind.config.ts` — Tailwind v4 uses a flat config via `@tailwindcss/postcss`. Dark mode and CSS variables are configured directly in `src/app/globals.css`.

### Design System

Obsidian & Ivory palette with gold accent. CSS variables in `src/app/globals.css`. Fonts: Cormorant Garamond (serif, headings) + Inter (sans, body) loaded via `next/font` in root layout.

### Icons

**Use Lucide React icons (`lucide-react`) exclusively — no emoji in UI.** Emoji rendering varies by OS/browser/font and breaks the luxury brand voice. Examples:
- ✓ `import { Sun, Moon, Monitor } from 'lucide-react'`
- ✗ `<span>☀️</span>` or `<span>🌙</span>` in any user-facing component

Exception: dialog body copy and error messages CAN reference emoji for emphasis if absolutely necessary, but always prefer Lucide icons. Doc files (`.md`) and code comments are unrestricted — this rule is for the rendered UI only.

If you need an icon Lucide doesn't ship, propose adding `@radix-ui/react-icons` or a single-purpose SVG to `public/icons/` rather than reaching for emoji.

### ESLint Bans

`eslint.config.mjs` bans the browser globals `confirm()`, `alert()`, and `prompt()`. Use `useConfirm()` (custom hook pattern) for destructive confirmations and `sonner` toast for alerts.
