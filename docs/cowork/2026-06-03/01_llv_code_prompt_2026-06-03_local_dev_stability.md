# Code Prompt — Local dev-server stability (read before resuming)

**Date:** 2026-06-03 · **For:** Claude Code · **Author:** Cowork (with the founder)

## What happened while you were debugging

The local dev server problem you were chasing is **resolved**, and the root cause was not where the debugging was pointed. Summary so you don't re-spend time on it:

- The app would not run locally: `next dev` reached "Ready" then either got killed, hung at `○ Compiling proxy ...`, or (under `--webpack`) crashed with `TypeError: (0 , _webpackconfig.loadProjectInfo) is not a function`.
- **Root cause: a corrupted `node_modules/next`**, from in-place instrumentation/edits to Next's internals (the `[LLV-TRACE]` probes) plus half-applied patches. The "Compiling proxy" hang and the `loadProjectInfo` crash were **symptoms of the corrupted install, not a real bug in `src/proxy.ts`.**
- **Fix that worked:** stop the extra dev server, then `rm -rf .next node_modules && npm install && npm run dev`. After a clean reinstall, **`proxy.ts` compiles in ~400ms and `GET /auth/login` returns 200.** The proxy is fine.

Two things also made it worse and wasted cycles:
- **Two `next dev` servers were running at once** (yours and the founder's). Next 16 allows only one; the second bounced to port 3001 and quit. Your `pkill -f "next dev"` also killed the founder's server, so it looked like the server "kept dying."
- **Node version mismatch:** you were running under Node **22.x**; the project pins **20.19.5** (`.nvmrc`). Mixed versions leave the patched Next binary inconsistent.

## What to do now

1. **Do not instrument `node_modules`.** Remove any remaining `[LLV-TRACE]` probes or hand edits inside `node_modules/next`. It's not version-controlled and it corrupts the install. If you must trace, do it in app code or via env-gated logging, and remove it after.
2. **Run under Node 20.19.5** (`nvm use` — the `.nvmrc` is committed). Don't run the dev server under Node 22.
3. **Do not run your own `next dev` (or `pkill`/`kill` Next processes) while the founder is running the local server.** One owner at a time. The founder is currently running it. If you need the server, coordinate first.
4. **The `src/proxy.ts` migration is not broken** — it compiles and serves correctly on a clean install. If your goal was to fix a proxy hang, that goal is moot; verify against a clean `node_modules` before changing proxy logic.
5. **Make the Next workaround durable** so `node_modules` surgery is never needed again. Right now `scripts/patch-next-bin.js` runs via `postinstall` to fix the Next 16.2.6 `next-test` eager-load crash, and `patch-package` is installed but unused (no `patches/` dir). Pick one:
   - Generate and **commit a real `patch-package` patch** (`patches/next+16.2.6.patch`) so it's deterministic and survives reinstalls, OR
   - **Pin/upgrade Next** to a version without the eager-load bug and drop the bin patch.
6. There are uncommitted working-tree changes (middleware→proxy migration, layouts, `package.json` postinstall + `patch-package`, deleted `src/middleware.ts`). Please **commit or cleanly revert** these so the repo isn't sitting in a half-migrated state.

## Acceptance

- A fresh `rm -rf .next node_modules && npm install && npm run dev` brings the app up clean (no `[LLV-TRACE]`, no proxy hang, `/auth/login` → 200) under Node 20.19.5.
- `npm run verify` passes.
- The `next-test` workaround survives a reinstall without manual `node_modules` editing.
- The middleware→proxy migration is committed (or reverted), not left uncommitted.

Reference: full symptoms/causes/fix in `docs/cowork/llv_local_dev_troubleshooting.md`.
