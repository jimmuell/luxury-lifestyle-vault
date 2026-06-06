# Public /terms and /privacy Pages — Design Spec

**Date:** 2026-06-06
**Requirement:** A2P 10DLC — carriers require publicly reachable Terms + Privacy URLs
**Status:** Approved for implementation

---

## Problem

`/terms` and `/privacy` are linked from the SMS consent disclosure in onboarding and settings, but the routes don't exist. The proxy currently redirects all non-auth, non-webhook paths to `/auth/login`, so unauthenticated visitors (carriers, users) can't load them.

---

## Scope

1. **Proxy** — exempt `/terms` and `/privacy` from auth redirect
2. **Legal pages** — server-rendered, statically cached, branded
3. **Markdown parser** — zero-dependency custom utility for simple legal markdown
4. **SiteFooter** — minimal footer with Terms + Privacy links
5. **Auth pages** — footer added to login + signup

---

## 1. Proxy Change

**File:** `src/proxy.ts`

Change:
```typescript
const PUBLIC_PREFIXES = ['/auth', '/api/webhooks', '/api/inngest']
```

To:
```typescript
const PUBLIC_PREFIXES = ['/auth', '/api/webhooks', '/api/inngest', '/terms', '/privacy']
```

---

## 2. File Structure

```
src/app/(legal)/
  layout.tsx                        — branded wrapper + SiteFooter
  terms/page.tsx                    — reads ToS, renders
  privacy/page.tsx                  — reads Privacy, renders

src/components/shared/
  site-footer.tsx                   — © + Terms + Privacy links

src/lib/legal/
  parse-markdown.ts                 — typed node parser (zero deps)
  render-legal-content.tsx          — styled JSX renderer

docs/legal/
  llv_terms_of_service_2026-06-06.md   — source (read-only)
  llv_privacy_policy_2026-06-06.md     — source (read-only)
```

---

## 3. Markdown Parser (`src/lib/legal/parse-markdown.ts`)

Zero dependencies. Reads the source `.md` file and returns `LegalNode[]`.

**Node types:**
```typescript
type LegalNodeType =
  | 'draft-notice'    // lines starting with "**DRAFT —"
  | 'heading1'        // "# ..."
  | 'heading2'        // "## ..."
  | 'heading3'        // "### ..."
  | 'hr'              // "---"
  | 'list-item'       // "- ..." or "* ..."
  | 'paragraph'       // everything else (non-empty lines after grouping)

interface LegalNode {
  type: LegalNodeType
  text: string        // raw text including any **bold** markers
}
```

**Inline formatting:** `**text**` → `<strong>`, `[text](url)` → `<a href>`, `\`code\`` → `<code>`. A shared `renderInline(text)` helper handles these.

**Parser logic:**
1. Split file content on `\n`
2. Skip blank lines between blocks (collapse whitespace)
3. Classify each non-empty line by its prefix
4. Return array of LegalNode

---

## 4. Legal Content Renderer (`src/lib/legal/render-legal-content.tsx`)

Server component (no `'use client'`). Props: `nodes: LegalNode[]`.

**Visual mapping:**

| Node type | Style |
|---|---|
| `draft-notice` | `rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800` |
| `heading1` | `font-serif text-3xl font-light mt-0 mb-2` (H1 is the doc title — shown large) |
| `heading2` | `font-serif text-xl font-normal mt-8 mb-2 border-b border-border pb-1` |
| `heading3` | `font-serif text-base font-medium mt-4 mb-1 text-muted-foreground` |
| `hr` | `my-6 border-border` |
| `list-item` | inside a `<ul className="list-disc pl-5 space-y-1 text-sm">` |
| `paragraph` | `text-sm leading-relaxed text-foreground` |

Adjacent `list-item` nodes are grouped into a single `<ul>`. All other nodes are rendered individually.

**`renderInline(text: string)`:** replaces `**text**` with `<strong>`, `[label](url)` with `<Link href={url}>`, `` `code` `` with `<code className="text-xs font-mono bg-muted px-1 rounded">`.

---

## 5. (legal) Layout (`src/app/(legal)/layout.tsx`)

Simple server component. No auth check.

```tsx
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
```

---

## 6. Page Components

**`src/app/(legal)/terms/page.tsx`:**
- `export const dynamic = 'force-static'`
- Reads `docs/legal/llv_terms_of_service_2026-06-06.md` with `fs.readFileSync`
- Parses with `parseLegalMarkdown`
- Renders with `<LegalContent nodes={...} />`
- `generateMetadata` → title `Terms of Service — Luxury Lifestyle Vault`, description `Review the Terms of Service for Luxury Lifestyle Vault.`

**`src/app/(legal)/privacy/page.tsx`:**
- Same pattern
- Reads `docs/legal/llv_privacy_policy_2026-06-06.md`
- `generateMetadata` → title `Privacy Policy — Luxury Lifestyle Vault`, description `Review the Privacy Policy for Luxury Lifestyle Vault.`

Both use `path.join(process.cwd(), 'docs/legal/...')` to locate the file.

---

## 7. SiteFooter (`src/components/shared/site-footer.tsx`)

```tsx
<footer className="border-t border-border px-6 py-6 text-center">
  <p className="text-xs text-muted-foreground space-x-4">
    <span>© 2026 Luxury Lifestyle Vault</span>
    <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
  </p>
</footer>
```

Used in:
- `(legal)` layout
- Auth login page bottom
- Auth signup page bottom

---

## 8. Auth Pages Update

`src/app/(auth)/auth/login/page.tsx` and `src/app/(auth)/auth/signup/page.tsx`:
Import `SiteFooter` and add it below the existing `<div className="w-full max-w-md">` form container.

---

## Acceptance Criteria

- `/terms` and `/privacy` return 200 for a logged-out visitor
- Pages render the full markdown content with brand typography
- Draft notice callout is visible (amber, clearly labeled DRAFT)
- `SiteFooter` with Terms + Privacy links appears on legal pages and auth pages
- `npm run verify` clean
- Pages are statically rendered (`force-static`)

## Placeholder Notice

The live pages will contain `[PLACEHOLDER]` text and an attorney-review draft notice until the founder completes the legal review. **Do not publicize these URLs until placeholders are filled and an attorney has approved the content.**

---

## No New Dependencies

Zero new npm packages. The markdown parser handles the specific subset of markdown in these two documents.
