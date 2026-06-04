# patches/

This directory holds `patch-package` patch files. They are applied automatically on every `npm install` via the `"postinstall": "patch-package"` script in `package.json`.

If a patch fails to apply (e.g. after upgrading Next.js), `patch-package` will print a loud warning and exit non-zero — fix by regenerating the patch against the new version or removing the workaround if it is no longer needed.

---

## `next+16.2.6.patch`

Patches four files inside `node_modules/next/dist/` to prevent `next dev` from hanging or taking 2–3 minutes to become responsive. All four changes are dev-server only and have no effect on production builds (`next build`).

### Patch 1 — `dist/bin/next`: lazy-load `next-test.js`

`next/dist/bin/next` unconditionally `require()`s `../cli/next-test.js` at startup. That file pulls in a deep dependency chain (`config.js → config-shared → …`) that takes several seconds to load even when the `experimental-test` command is never used. The patch replaces the eager `require` with a lightweight stub object; the real module is loaded lazily only if `next experimental-test` is actually invoked.

Also adds a `null` guard on `SUPPORTED_TEST_RUNNERS_LIST.join` (belt-and-suspenders against the stub returning `undefined`).

### Patch 2 — `dist/server/dev/hot-reloader-shared-utils.js`: fetch timeout on version check

`getVersionInfo()` fetches `https://registry.npmjs.org/-/package/next/dist-tags` with no timeout to check for a newer Next.js version. On a slow or filtered network this hangs indefinitely, blocking `hotReloader.start()` (Webpack path) and preventing `handlersReady()` from ever being called. The patch wraps the fetch in an `AbortController` with a 5-second timeout.

### Patch 3 — `dist/server/dev/on-demand-entry-handler.js`: stub MCP module requires

`on-demand-entry-handler.js` unconditionally requires two MCP dev-tooling modules at the top level:
- `../mcp/tools/get-errors`
- `../mcp/tools/get-page-metadata`

On a cold Node module cache these take ~165 seconds to load (network/IPC setup in `browser-communication.js` and `mcp-telemetry-tracker.js`), blocking `handlersReady()` and causing every browser request to hang for 2–3 minutes after "Ready" is printed. The patch replaces both requires with no-op stub objects.

### Patch 4 — `dist/server/dev/hot-reloader-turbopack.js`: stub MCP module requires

Same top-level MCP requires as Patch 3, but on the Turbopack path. The Turbopack IIFE in `setup-dev-bundler.js` lazily requires `hot-reloader-turbopack.js`, so without this patch the Turbopack startup path also hangs. Five modules stubbed:
- `../mcp/get-mcp-middleware`
- `../mcp/tools/get-errors`
- `../mcp/tools/get-page-metadata`
- `../mcp/tools/utils/format-errors`
- `../mcp/mcp-telemetry-tracker`

---

### Regenerating after a Next.js upgrade

```bash
# 1. Apply the current patch so node_modules reflects the intended state
npx patch-package next --reverse   # undo, then re-apply manually if needed

# 2. Make your edits to node_modules/next/dist/... by hand (or run the old script logic)

# 3. Regenerate
npx patch-package next
# → overwrites patches/next+<version>.patch

# 4. Rename the old patch file if the version changed, delete the old one
# 5. Commit
```
