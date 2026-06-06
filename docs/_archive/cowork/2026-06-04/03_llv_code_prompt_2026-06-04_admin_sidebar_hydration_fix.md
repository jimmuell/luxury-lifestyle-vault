# Code Prompt — Admin sidebar: fix hydration mismatch (useSyncExternalStore)

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Context:** Follow-up to the collapsible admin sidebar (`src/components/admin/admin-nav.tsx`, commit `8898abb`). The current implementation reads collapsed-group state from `localStorage` inside a lazy `useState` initializer. That makes the server render every group open while a returning user's first client render shows a group collapsed → a React hydration mismatch (console warning + subtree re-render). The in-code comment acknowledges this. Fix it properly with `useSyncExternalStore`, which is built for reading external (localStorage) state in an SSR-safe way **and** doesn't trip the no-`setState`-in-`useEffect` lint rule that the lazy-initializer approach was working around.

Functionality and UI must stay identical — this is an internal state-management refactor only.

---

## The fix

Refactor `admin-nav.tsx` so the collapsed set comes from a tiny external store backed by `localStorage`, read via `useSyncExternalStore`. Remove the `useState` + lazy `readCollapsedFromStorage` initializer entirely.

### 1. External store helpers (module scope, replace the current `readCollapsedFromStorage` / `writeCollapsedToStorage`)

```tsx
const LS_KEY = 'llv.adminNav.collapsed'

const storeListeners = new Set<() => void>()

function emitChange() {
  storeListeners.forEach(l => l())
}

function subscribe(cb: () => void) {
  storeListeners.add(cb)
  if (typeof window !== 'undefined') window.addEventListener('storage', cb)
  return () => {
    storeListeners.delete(cb)
    if (typeof window !== 'undefined') window.removeEventListener('storage', cb)
  }
}

// Snapshot MUST be a stable primitive (the raw stored string), not a new Set/array
// each call — useSyncExternalStore compares with Object.is and will loop on a fresh
// object reference. Derive the Set from this string with useMemo in the component.
function getSnapshot(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(LS_KEY) ?? ''
  } catch {
    return ''
  }
}

function getServerSnapshot(): string {
  return ''
}

function setCollapsedInStorage(next: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...next]))
  } catch {}
  emitChange() // same-tab notify (the native 'storage' event only fires in other tabs)
}
```

### 2. In the `AdminNav` component

Replace the `useState`/`setCollapsed` block with:

```tsx
const storedRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

const collapsed = useMemo<Set<string>>(() => {
  if (!storedRaw) return new Set()
  try {
    return new Set(JSON.parse(storedRaw) as string[])
  } catch {
    return new Set()
  }
}, [storedRaw])
```

Keep `getActiveGroupLabel`, `activeLabel`, and the `openGroups` `useMemo` exactly as they are.

Update `toggle` to write through the store instead of calling `setCollapsed`:

```tsx
function toggle(label: string) {
  if (label === activeLabel) return // never collapse the active group
  const next = new Set(collapsed)
  if (next.has(label)) {
    next.delete(label)
  } else {
    next.add(label)
  }
  setCollapsedInStorage(next)
}
```

Update the React import: `import { useSyncExternalStore, useMemo } from 'react'` (drop `useState`).

Everything else — `NAV_GROUPS`, the Base UI `Collapsible.Root/Trigger/Panel` markup, the chevron, `linkClass`, the standalone Overview branch — stays unchanged.

## Why this removes the warning

During SSR and the initial hydration render, React uses `getServerSnapshot` (`''` → all groups open), so the client's first render matches the server HTML — no mismatch. Immediately after hydration, React reads `getSnapshot` and re-renders with the persisted state. React intentionally does **not** warn on `useSyncExternalStore` server/client differences — that's the hook's purpose. No `useEffect`, so the no-`setState`-in-`useEffect` rule is not involved.

## Acceptance criteria

- Behavior is unchanged from the user's view: all groups start expanded; collapsing a group persists across reload and navigation; the active group is always open; clicking the active group's header is a no-op.
- Loading `/admin/billing`-class pages (any admin route) after having collapsed a group produces **no hydration warning** in the browser console (test: collapse a non-active group, navigate to another admin page, hard-reload — clean console).
- Collapsed groups still aren't keyboard-focusable; light and dark mode both correct.
- No new dependencies; `useState` no longer imported in this file.
- `npm run verify` (ESLint + tsc) clean.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do **NOT** run `npm run dev` / `next dev` or `pkill`/`kill` Next processes. Verify with `npm run verify`; the founder will exercise the running app.
- Run under **Node 20.19.5** (`.nvmrc`). **Never hand-edit `node_modules`.**
- Lucide icons only — no emoji in the UI.

## Report back

- File changed, the `npm run verify` result, and a one-line confirmation that the console is clean on reload after collapsing a group.
