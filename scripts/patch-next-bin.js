/* eslint-disable @typescript-eslint/no-require-imports */
// Patches next/dist/bin/next for Node 20/22 compatibility with Next.js 16:
//
// 1. Replaces the eager require("../cli/next-test.js") with a lightweight stub
//    so its heavy dependency chain (config.js → config-shared → ...) never loads
//    during `next dev`. The experimental-test command still registers; it just
//    lazily loads next-test when actually invoked.
//
// 2. Guards SUPPORTED_TEST_RUNNERS_LIST against null/undefined (belt-and-suspenders).
const fs = require('fs')
const path = require('path')

const binPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')
if (!fs.existsSync(binPath)) process.exit(0)

let src = fs.readFileSync(binPath, 'utf8')
let changed = false

// Patch 1 — stub out the eager require of next-test.js
const eagerRequire = 'const _nexttest = require("../cli/next-test.js");'
const lazyStub = [
  'const _nexttestStub = { SUPPORTED_TEST_RUNNERS_LIST: ["playwright"], nextTest: ()=>{ return require("../cli/next-test.js").nextTest(...arguments); } };',
  'const _nexttest = _nexttestStub;',
].join('\n')

if (src.includes(eagerRequire)) {
  src = src.replace(eagerRequire, lazyStub)
  changed = true
  console.log('patched next/dist/bin/next — next-test.js eager load replaced with stub')
}

// Patch 2 — null guard on SUPPORTED_TEST_RUNNERS_LIST.join (belt-and-suspenders)
const joinNeedle = '_nexttest.SUPPORTED_TEST_RUNNERS_LIST.join'
const joinReplacement = '(_nexttest.SUPPORTED_TEST_RUNNERS_LIST||[]).join'
if (src.includes(joinNeedle)) {
  src = src.replace(joinNeedle, joinReplacement)
  changed = true
  console.log('patched next/dist/bin/next — SUPPORTED_TEST_RUNNERS_LIST null guard applied')
}

if (changed) {
  fs.writeFileSync(binPath, src, 'utf8')
} else {
  console.log('next/dist/bin/next already patched, skipping')
}

// ─── Patch 3: stub out MCP module requires in on-demand-entry-handler.js ──────
// next/dist/server/dev/on-demand-entry-handler.js unconditionally requires two
// MCP modules at the top level. On a cold Node module cache these take ~165s to
// load (browser-communication.js + mcp-telemetry-tracker.js do network/IPC
// setup), which blocks handlersReady() and causes every browser request to hang
// for 2-3 minutes after "Ready" is printed. These stubs replace the live modules
// with no-op equivalents; the functions are only called for MCP dev tooling and
// have no effect on normal app routing.
const odehPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'server', 'dev', 'on-demand-entry-handler.js')
if (fs.existsSync(odehPath)) {
  let odehSrc = fs.readFileSync(odehPath, 'utf8')
  let odehChanged = false

  const getErrorsRequire = 'const _geterrors = require("../mcp/tools/get-errors");'
  const getErrorsStub = 'const _geterrors = { handleErrorStateResponse: () => {} };'
  if (odehSrc.includes(getErrorsRequire)) {
    odehSrc = odehSrc.replace(getErrorsRequire, getErrorsStub)
    odehChanged = true
    console.log('patched on-demand-entry-handler.js — get-errors MCP module stubbed out')
  }

  const getPageMetaRequire = 'const _getpagemetadata = require("../mcp/tools/get-page-metadata");'
  const getPageMetaStub = 'const _getpagemetadata = { handlePageMetadataResponse: () => {} };'
  if (odehSrc.includes(getPageMetaRequire)) {
    odehSrc = odehSrc.replace(getPageMetaRequire, getPageMetaStub)
    odehChanged = true
    console.log('patched on-demand-entry-handler.js — get-page-metadata MCP module stubbed out')
  }

  if (odehChanged) {
    fs.writeFileSync(odehPath, odehSrc, 'utf8')
  } else {
    console.log('on-demand-entry-handler.js already patched, skipping')
  }
}

// ─── Patch 4b: stub MCP modules in hot-reloader-turbopack.js ─────────────────
// hot-reloader-turbopack.js has the same top-level MCP requires as on-demand-
// entry-handler.js and is required lazily inside the Turbopack IIFE in
// setup-dev-bundler.js. Without this patch the Turbopack startup path also hangs
// on the same slow MCP module tree.
const hrTurboPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'server', 'dev', 'hot-reloader-turbopack.js')
if (fs.existsSync(hrTurboPath)) {
  let hrSrc = fs.readFileSync(hrTurboPath, 'utf8')
  let hrChanged = false

  const mcpPatches = [
    {
      needle: 'const _getmcpmiddleware = require("../mcp/get-mcp-middleware");',
      stub:   'const _getmcpmiddleware = { getMcpMiddleware: () => ((_req, _res, next) => next ? next() : undefined) };',
      label:  'get-mcp-middleware',
    },
    {
      needle: 'const _geterrors = require("../mcp/tools/get-errors");',
      stub:   'const _geterrors = { handleErrorStateResponse: () => {} };',
      label:  'get-errors',
    },
    {
      needle: 'const _getpagemetadata = require("../mcp/tools/get-page-metadata");',
      stub:   'const _getpagemetadata = { handlePageMetadataResponse: () => {} };',
      label:  'get-page-metadata',
    },
    {
      needle: 'const _formaterrors = require("../mcp/tools/utils/format-errors");',
      stub:   'const _formaterrors = { setStackFrameResolver: () => {} };',
      label:  'format-errors',
    },
    {
      needle: 'const _mcptelemetrytracker = require("../mcp/mcp-telemetry-tracker");',
      stub:   'const _mcptelemetrytracker = { recordMcpTelemetry: () => {} };',
      label:  'mcp-telemetry-tracker',
    },
  ]

  for (const { needle, stub, label } of mcpPatches) {
    if (hrSrc.includes(needle)) {
      hrSrc = hrSrc.replace(needle, stub)
      hrChanged = true
      console.log(`patched hot-reloader-turbopack.js — ${label} MCP module stubbed out`)
    }
  }

  if (hrChanged) {
    fs.writeFileSync(hrTurboPath, hrSrc, 'utf8')
  } else {
    console.log('hot-reloader-turbopack.js already patched, skipping')
  }
}

// ─── Patch 4: add 5s timeout to getVersionInfo() fetch ────────────────────────
// hot-reloader-shared-utils.js fetches npmjs.org with no timeout to check for
// the latest Next.js version. On a slow or filtered network this fetch hangs
// indefinitely, blocking hotReloader.start() (webpack path) and preventing
// handlersReady() from ever being called.
const sharedUtilsPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'server', 'dev', 'hot-reloader-shared-utils.js')
if (fs.existsSync(sharedUtilsPath)) {
  let sharedSrc = fs.readFileSync(sharedUtilsPath, 'utf8')

  const fetchNeedle = `res = await fetch('https://registry.npmjs.org/-/package/next/dist-tags');`
  const fetchReplacement = [
    `const _vc = new AbortController();`,
    `const _vt = setTimeout(() => _vc.abort(), 5000);`,
    `res = await fetch('https://registry.npmjs.org/-/package/next/dist-tags', { signal: _vc.signal }).finally(() => clearTimeout(_vt));`,
  ].join(' ')

  if (sharedSrc.includes(fetchNeedle)) {
    sharedSrc = sharedSrc.replace(fetchNeedle, fetchReplacement)
    fs.writeFileSync(sharedUtilsPath, sharedSrc, 'utf8')
    console.log('patched hot-reloader-shared-utils.js — getVersionInfo fetch gets 5s AbortController timeout')
  } else {
    console.log('hot-reloader-shared-utils.js already patched, skipping')
  }
}
