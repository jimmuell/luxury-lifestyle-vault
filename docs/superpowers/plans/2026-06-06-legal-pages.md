# Public /terms and /privacy Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish publicly accessible `/terms` and `/privacy` pages with brand styling, exempt them from the auth proxy redirect, and wire them into the site footer and auth pages.

**Architecture:** Six tasks in dependency order: proxy exemption → markdown parser → footer component → content renderer → legal pages → auth footer. Zero new npm packages: a custom 80-line markdown parser handles the specific subset of markdown used in the two legal docs (H1/H2/H3, bold, bullets, links, HR, paragraphs). Pages are server components that read local `.md` files at build time.

**Tech Stack:** Next.js App Router (server components), `fs.readFileSync`, Tailwind CSS v4, TypeScript, no new dependencies

---

## File Map

| File | Action |
|---|---|
| `src/proxy.ts` | Modify — add `/terms`, `/privacy` to `PUBLIC_PREFIXES` |
| `src/lib/legal/parse-markdown.ts` | Create — typed node parser |
| `src/components/shared/site-footer.tsx` | Create — footer with Terms + Privacy links |
| `src/lib/legal/render-legal-content.tsx` | Create — styled JSX renderer |
| `src/app/(legal)/layout.tsx` | Create — branded wrapper layout |
| `src/app/(legal)/terms/page.tsx` | Create — Terms of Service page |
| `src/app/(legal)/privacy/page.tsx` | Create — Privacy Policy page |
| `src/app/(auth)/auth/login/page.tsx` | Modify — add SiteFooter |
| `src/app/(auth)/auth/signup/page.tsx` | Modify — add SiteFooter |

---

### Task 1: Proxy Exemption

**Files:**
- Modify: `src/proxy.ts` (line 12)

- [ ] **Step 1: Add /terms and /privacy to PUBLIC_PREFIXES**

In `src/proxy.ts`, find line 12:
```typescript
const PUBLIC_PREFIXES = ['/auth', '/api/webhooks', '/api/inngest']
```

Replace with:
```typescript
const PUBLIC_PREFIXES = ['/auth', '/api/webhooks', '/api/inngest', '/terms', '/privacy']
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat(legal): exempt /terms and /privacy from auth redirect"
```

---

### Task 2: Markdown Parser

**Files:**
- Create: `src/lib/legal/parse-markdown.ts`

- [ ] **Step 1: Create the parser module**

Create `src/lib/legal/parse-markdown.ts`:

```typescript
export type LegalNodeType =
  | 'draft-notice'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'hr'
  | 'list-item'
  | 'paragraph'

export interface LegalNode {
  type: LegalNodeType
  text: string
}

export function parseLegalMarkdown(content: string): LegalNode[] {
  const nodes: LegalNode[] = []

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('**DRAFT') || line.startsWith('Prepared by Cowork')) {
      nodes.push({ type: 'draft-notice', text: line })
    } else if (line.startsWith('### ')) {
      nodes.push({ type: 'heading3', text: line.slice(4) })
    } else if (line.startsWith('## ')) {
      nodes.push({ type: 'heading2', text: line.slice(3) })
    } else if (line.startsWith('# ')) {
      nodes.push({ type: 'heading1', text: line.slice(2) })
    } else if (line === '---') {
      nodes.push({ type: 'hr', text: '' })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push({ type: 'list-item', text: line.slice(2) })
    } else {
      nodes.push({ type: 'paragraph', text: line })
    }
  }

  return nodes
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/legal/parse-markdown.ts
git commit -m "feat(legal): add zero-dependency markdown parser for legal docs"
```

---

### Task 3: SiteFooter Component

**Files:**
- Create: `src/components/shared/site-footer.tsx`

- [ ] **Step 1: Create the footer component**

Create `src/components/shared/site-footer.tsx`:

```tsx
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-6">
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-4 flex-wrap">
        <span>© 2026 Luxury Lifestyle Vault</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
      </p>
    </footer>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/site-footer.tsx
git commit -m "feat(legal): add SiteFooter component with Terms and Privacy links"
```

---

### Task 4: LegalContent Renderer

**Files:**
- Create: `src/lib/legal/render-legal-content.tsx`

This is a server component (no `'use client'`). It imports `LegalNode` from Task 2's module.

- [ ] **Step 1: Create the renderer**

Create `src/lib/legal/render-legal-content.tsx`:

```tsx
import type React from 'react'
import Link from 'next/link'
import type { LegalNode } from '@/lib/legal/parse-markdown'

function renderInline(text: string): React.ReactNode {
  // Matches **bold**, `code`, [label](url) — in that priority order
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={match.index} className="text-xs font-mono bg-muted px-1 rounded">
          {match[2]}
        </code>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <Link key={match.index} href={match[4]} className="underline underline-offset-2 hover:text-foreground">
          {match[3]}
        </Link>
      )
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

type GroupedBlock =
  | { kind: 'draft-notice'; items: LegalNode[] }
  | { kind: 'list'; items: LegalNode[] }
  | { kind: 'single'; node: LegalNode }

function groupNodes(nodes: LegalNode[]): GroupedBlock[] {
  const blocks: GroupedBlock[] = []
  let i = 0
  while (i < nodes.length) {
    const node = nodes[i]
    if (node.type === 'draft-notice') {
      const items: LegalNode[] = [node]
      while (i + 1 < nodes.length && nodes[i + 1].type === 'draft-notice') {
        i++
        items.push(nodes[i])
      }
      blocks.push({ kind: 'draft-notice', items })
    } else if (node.type === 'list-item') {
      const items: LegalNode[] = [node]
      while (i + 1 < nodes.length && nodes[i + 1].type === 'list-item') {
        i++
        items.push(nodes[i])
      }
      blocks.push({ kind: 'list', items })
    } else {
      blocks.push({ kind: 'single', node })
    }
    i++
  }
  return blocks
}

interface LegalContentProps {
  nodes: LegalNode[]
}

export function LegalContent({ nodes }: LegalContentProps) {
  const blocks = groupNodes(nodes)

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIdx) => {
        if (block.kind === 'draft-notice') {
          return (
            <div
              key={blockIdx}
              className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-1"
            >
              {block.items.map((item, i) => (
                <p key={i} className="text-sm text-amber-800">
                  {renderInline(item.text)}
                </p>
              ))}
            </div>
          )
        }

        if (block.kind === 'list') {
          return (
            <ul key={blockIdx} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, i) => (
                <li key={i} className="text-sm leading-relaxed text-foreground">
                  {renderInline(item.text)}
                </li>
              ))}
            </ul>
          )
        }

        // Single node
        const { node } = block

        if (node.type === 'heading1') {
          return (
            <h1 key={blockIdx} className="font-serif text-3xl font-light mb-2">
              {renderInline(node.text)}
            </h1>
          )
        }
        if (node.type === 'heading2') {
          return (
            <h2
              key={blockIdx}
              className="font-serif text-xl font-normal mt-8 mb-1 border-b border-border pb-2"
            >
              {renderInline(node.text)}
            </h2>
          )
        }
        if (node.type === 'heading3') {
          return (
            <h3 key={blockIdx} className="font-serif text-base font-medium mt-4 mb-1 text-muted-foreground">
              {renderInline(node.text)}
            </h3>
          )
        }
        if (node.type === 'hr') {
          return <hr key={blockIdx} className="my-4 border-border" />
        }
        // paragraph
        return (
          <p key={blockIdx} className="text-sm leading-relaxed text-foreground">
            {renderInline(node.text)}
          </p>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`. If TypeScript complains about `React.ReactNode` not being in scope, add `import type React from 'react'` at the top of `render-legal-content.tsx` (Next.js 16 App Router auto-imports React in JSX, but the type may need an explicit import).

- [ ] **Step 3: Commit**

```bash
git add src/lib/legal/render-legal-content.tsx
git commit -m "feat(legal): add LegalContent renderer with inline markdown support"
```

---

### Task 5: (legal) Layout and Pages

**Files:**
- Create: `src/app/(legal)/layout.tsx`
- Create: `src/app/(legal)/terms/page.tsx`
- Create: `src/app/(legal)/privacy/page.tsx`

Note: The `(legal)` route group name is in parentheses so it doesn't appear in the URL — routes are `/terms` and `/privacy`.

- [ ] **Step 1: Create the (legal) layout**

Create `src/app/(legal)/layout.tsx`:

```tsx
import { SiteFooter } from '@/components/shared/site-footer'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground text-center">
          Luxury Lifestyle Vault
        </p>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 2: Create the Terms of Service page**

Create `src/app/(legal)/terms/page.tsx`:

```tsx
import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import { parseLegalMarkdown } from '@/lib/legal/parse-markdown'
import { LegalContent } from '@/lib/legal/render-legal-content'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Terms of Service — Luxury Lifestyle Vault',
  description: 'Review the Terms of Service for Luxury Lifestyle Vault.',
}

export default function TermsPage() {
  const filePath = path.join(process.cwd(), 'docs/legal/llv_terms_of_service_2026-06-06.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  const nodes = parseLegalMarkdown(content)
  return <LegalContent nodes={nodes} />
}
```

- [ ] **Step 3: Create the Privacy Policy page**

Create `src/app/(legal)/privacy/page.tsx`:

```tsx
import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import { parseLegalMarkdown } from '@/lib/legal/parse-markdown'
import { LegalContent } from '@/lib/legal/render-legal-content'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Privacy Policy — Luxury Lifestyle Vault',
  description: 'Review the Privacy Policy for Luxury Lifestyle Vault.',
}

export default function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'docs/legal/llv_privacy_policy_2026-06-06.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  const nodes = parseLegalMarkdown(content)
  return <LegalContent nodes={nodes} />
}
```

- [ ] **Step 4: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 5: Commit**

```bash
git add src/app/(legal)/layout.tsx src/app/(legal)/terms/page.tsx src/app/(legal)/privacy/page.tsx
git commit -m "feat(legal): add /terms and /privacy public pages with brand layout"
```

---

### Task 6: Auth Pages Footer

**Files:**
- Modify: `src/app/(auth)/auth/login/page.tsx`
- Modify: `src/app/(auth)/auth/signup/page.tsx`

- [ ] **Step 1: Update login page**

Replace the entire content of `src/app/(auth)/auth/login/page.tsx` with:

```tsx
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { DemoLogin } from '@/components/auth/demo-login'
import { SiteFooter } from '@/components/shared/site-footer'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Luxury Lifestyle Vault
            </p>
            <h1 className="font-serif text-3xl font-light">Welcome back</h1>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
            New member?{' '}
            <Link href="/auth/signup" className="underline underline-offset-4 hover:text-foreground">
              Request access
            </Link>
          </p>

          <DemoLogin />
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 2: Update signup page**

Replace the entire content of `src/app/(auth)/auth/signup/page.tsx` with:

```tsx
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'
import { SiteFooter } from '@/components/shared/site-footer'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Luxury Lifestyle Vault
            </p>
            <h1 className="font-serif text-3xl font-light">Request membership</h1>
            <p className="text-sm text-muted-foreground">
              Founding member access is by invitation.
            </p>
          </div>

          <SignupForm />

          <p className="text-center text-sm text-muted-foreground">
            Already a member?{' '}
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/auth/login/page.tsx src/app/(auth)/auth/signup/page.tsx
git commit -m "feat(legal): add site footer with Terms/Privacy links to auth pages"
```

---

## Founder Verification Steps

After all tasks complete:

1. **Logged-out access:** Open `/terms` and `/privacy` in an incognito window — both must return 200 without redirecting to `/auth/login`
2. **Content:** Confirm the full legal text renders with the amber draft-notice callout at the top, serif headings, and readable body text
3. **Footer links:** Confirm Terms and Privacy links in the footer of auth pages and legal pages navigate correctly
4. **SMS consent links:** The `/terms` and `/privacy` hrefs in the onboarding consent disclosure and `SmsConsentCard` now resolve to real pages

## Placeholder Notice

**Both live pages contain `[PLACEHOLDER]` text and an attorney-review draft notice.** Do not publicize these URLs or submit them to the A2P carrier portal until: (a) all placeholders are replaced with finalized legal text, and (b) a licensed attorney has reviewed and approved the content.
