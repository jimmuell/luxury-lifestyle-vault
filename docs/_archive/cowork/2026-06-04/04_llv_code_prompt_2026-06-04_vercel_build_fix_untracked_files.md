# Code Prompt — Fix failed Vercel build: commit untracked Next 15→16 rename + build-critical files

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Priority:** HIGH — production deploy is currently failing.

## What happened

The last push (22 commits) built fine locally but **failed on Vercel** with:

```
./src/app/(provider)/layout.tsx:4:1
Module not found: Can't resolve '@/components/shared/auth-watcher'
(also ./src/app/(admin)/layout.tsx:5:1)
```

Root cause: a set of build-critical files exist on the local disk but were **never committed to git**, so Vercel's checkout doesn't have them. Local `next build` / `tsc` / dev pass because the files are physically present; git and Vercel never received them. This was the first push in 22 commits, so it's the first build to expose the gap.

The core of it is an **uncommitted Next.js 15→16 middleware→proxy rename**, plus a few related files. Specifically (from `git status`):

| File | Git state | Action needed |
|---|---|---|
| `src/proxy.ts` | untracked | **add** — this is the current auth/routing gate (Next 16 renamed middleware→proxy). Clean, has its `config` matcher. |
| `src/middleware.ts` | tracked, deleted on disk | **commit the deletion** — the old Next 15 name, superseded by proxy.ts. |
| `src/components/shared/auth-watcher.tsx` | untracked | **add** — imported by the admin/provider/client layouts (the build error). |
| `src/app/(client)/layout.tsx` | modified, uncommitted | **commit** — adds the `AuthWatcher` import + `<AuthWatcher />` (matches admin/provider layouts already pushed). |
| `package.json` | modified, uncommitted | **commit** — adds `postinstall: node scripts/patch-next-bin.js`, deps `chalk` + `patch-package`, and a `date-fns` bump. Without this, Vercel installs the old dep set and can fail on missing `chalk`. |
| `package-lock.json` | modified, uncommitted | **commit together with package.json** so the lockfile matches. |
| `src/proxy.ts.bak` | untracked | **do NOT commit — delete it.** Leftover backup from dev-server work. |

`scripts/patch-next-bin.js` is already committed (good), so the new `postinstall` hook will resolve.

## Do this

From the repo root:

```bash
# 1. Remove the junk backup (do not commit it)
rm -f src/proxy.ts.bak

# 2. Stage ONLY the build-critical set
git add src/proxy.ts \
        src/components/shared/auth-watcher.tsx \
        "src/app/(client)/layout.tsx" \
        package.json package-lock.json
git rm src/middleware.ts        # stage the deletion (file already gone on disk; use `git rm --cached src/middleware.ts` if it errors)

# 3. (optional, recommended) prevent future .bak commits
echo "*.bak" >> .gitignore && git add .gitignore

# 4. Verify, commit, push
npm run verify
git commit -m "fix(build): commit Next 16 proxy rename, AuthWatcher, and deps (fixes Vercel build)"
git push origin main
```

## Important scoping note

**Do NOT `git add -A` / commit everything.** The working tree also has a large, unrelated set of changes — the June-3 docs reorganization (many `docs/**` deletions + `docs/_archive/` additions + `CLAUDE.md` / handoff edits) and several editor/agent config dirs (`.claude/`, `.continue/`, `.junie/`, `.kiro/`, `.agents/`, `.nvmrc`, `skills-lock.json`). Those are **not** build-critical and should be handled in a **separate** commit after this deploy fix lands. Keep this commit focused on the files in the table above so the fix is clean and easy to verify.

## Heads-up (no action needed now)

The new `postinstall` runs `scripts/patch-next-bin.js` on **every** install, including Vercel's. That script patches `node_modules/next` in place (dev-server hang workarounds). The patches are guarded (`if (src.includes(needle))`) so they no-op when the target strings aren't present, and they target dev-server runtime paths, so a production `next build` should be unaffected. If the Vercel build behaves oddly post-merge, this hook is the first thing to check. (Separately, converting these in-place patches to a real `patch-package` patch is the durable fix — `patch-package` is now a dep, so that migration is set up but not yet done.)

## Acceptance criteria

- `npm run verify` clean.
- New commit contains exactly: `src/proxy.ts` (added), `src/components/shared/auth-watcher.tsx` (added), `src/middleware.ts` (deleted), `src/app/(client)/layout.tsx` (modified), `package.json` + `package-lock.json` (modified), and optionally `.gitignore`. Nothing from `docs/**` or the config dirs.
- `src/proxy.ts.bak` is gone, not committed.
- Pushed to `origin/main`; Vercel build succeeds (the `auth-watcher` module-not-found error is resolved).

## Report back

- The commit hash, `npm run verify` result, confirmation the push went up, and the Vercel build status (green/red). If red, paste the new error.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do NOT run `npm run dev` / `next dev` or `pkill`/`kill` Next. Verify with `npm run verify`.
- Run under **Node 20.19.5** (`.nvmrc`). Never hand-edit `node_modules`.
