# Code Prompt — Migrate in-place Next patching to patch-package (dev-stability durable fix)

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Priority:** High (this is the durable fix for the recurring "stale dev server / can't kill the server / `next dev` hangs" episodes).

## Why

`scripts/patch-next-bin.js` runs on every install (via `"postinstall": "node scripts/patch-next-bin.js"`) and **rewrites files inside `node_modules/next` in place** — the Next bin, `on-demand-entry-handler.js`, `hot-reloader-turbopack.js`, and `hot-reloader-shared-utils.js` (stubbing slow MCP module loads + adding a fetch timeout so `next dev` doesn't hang). This in-place mutation is exactly what the dev-stability runbook blames for corrupted-`node_modules` episodes: edits can half-apply, drift, or silently break, and there's no clean way to see what's been changed.

`patch-package` is already a devDependency. Convert the in-place script into a real, version-pinned patch file that applies **idempotently** on install and **fails loudly** (a visible warning) if Next changes version — instead of silently mutating files. The runtime effect on `next dev` must stay identical.

## Do this

1. **Make sure the intended edits are currently applied** to `node_modules/next` (the script is idempotent — it skips already-patched files):
   ```bash
   node scripts/patch-next-bin.js
   ```
   This guarantees `node_modules/next` reflects exactly the edits we want to capture.

2. **Generate the patch.** `patch-package` fetches a pristine `next@16.2.6` from the npm cache and diffs it against your edited `node_modules/next`, writing a patch file:
   ```bash
   npx patch-package next
   ```
   Expected output: a new `patches/next+16.2.6.patch` capturing all four file edits. Open it and sanity-check it contains the stub/timeout changes (the MCP module stubs, the next-test lazy stub, the `getVersionInfo` AbortController timeout).

3. **Switch the postinstall to patch-package** in `package.json`:
   ```json
   "postinstall": "patch-package"
   ```
   (no-arg `patch-package` applies every patch in `patches/` on install).

4. **Retire the old script.** Delete `scripts/patch-next-bin.js` (the postinstall no longer calls it; the patch file is now the source of truth). **Preserve its rationale** by adding `patches/README.md` that explains, in prose, what `next+16.2.6.patch` changes and why (migrate the comment blocks from the old script: the four patches and their purpose, and the note that the version is pinned so an upgrade will surface a loud patch-package warning rather than silently breaking).

5. **Verify the patch applies cleanly from scratch:**
   ```bash
   rm -rf node_modules && npm install
   ```
   - Confirm the install log shows patch-package applying it (e.g. "Applied 1 patch — next@16.2.6").
   - Confirm the edits are present, e.g.:
     ```bash
     grep -c "_nexttestStub\|handleErrorStateResponse\|AbortController" node_modules/next/dist/bin/next node_modules/next/dist/server/dev/hot-reloader-turbopack.js node_modules/next/dist/server/dev/hot-reloader-shared-utils.js
     ```
   - `npm run verify` (ESLint + tsc) clean.
   - You can't run `next dev` (the founder owns the dev server) — but report that the patch applied so the founder can confirm a clean boot.

## Acceptance criteria

- `patches/next+16.2.6.patch` exists and is committed; `package.json` postinstall is `patch-package`; `scripts/patch-next-bin.js` is deleted; `patches/README.md` documents the patch.
- A clean `rm -rf node_modules && npm install` re-applies the patch automatically (idempotent, no manual step), and the four target files contain the expected edits afterward.
- `npm run verify` clean.
- Runtime behavior of `next dev` is unchanged (same hang-prevention) — founder to confirm a clean boot.
- Commit + push. (If a future Next upgrade makes the patch not apply, that's the intended fail-loud behavior — patch-package prints a warning; note this in the README.)

## Final step — commit the loose Cowork docs (separate commit)

There are 3 untracked docs in `docs/cowork/` from today that should be tracked so the repo stays clean (docs-only, no build impact). In a **separate** commit from the patch-package change:
```bash
git add docs/cowork/llv_code_prompt_2026-06-04_provider_nav_topbar.md \
        docs/cowork/llv_code_prompt_2026-06-04_branded_404_error.md \
        docs/cowork/llv_founder_step_2026-06-04_add_card_asset.md \
        docs/cowork/llv_code_prompt_2026-06-04_patchpackage_migration.md
git commit -m "docs: add 2026-06-04 Cowork prompts (provider nav, branded 404, patch-package, card asset step)"
```
Then `git push origin main` (sends both commits). Confirm `git status` is clean afterward.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify` and the `npm install` patch-apply check above.
- Node **20.19.5** (`.nvmrc`). After this lands, `node_modules` should never be hand-edited again — the patch is the only mechanism.

## Report back

- The generated patch filename, the `npm install` patch-apply output, the grep confirmation, `npm run verify` result, both commit hashes, and confirmation the push succeeded + `git status` is clean.
