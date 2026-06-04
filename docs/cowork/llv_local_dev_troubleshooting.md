# LLV — Local Dev Troubleshooting Runbook

**Owner:** Cowork · **First written:** 2026-06-03
**Read this first** if the app won't run on the local dev server. This is a recurring issue with a known, fast fix — don't spend hours re-diagnosing it.

---

## TL;DR — the fix that works

1. **Stop Claude Code** (so it can't kill or relaunch the dev server while you work).
2. In your terminal, run:

```bash
pkill -f next-server; pkill -f "next dev"     # clear any stray servers
node -v                                        # must be v20.19.5 — if not, run: nvm use
rm -rf .next node_modules                      # throw away the corrupted install + cache
npm install                                    # reinstall clean (a few minutes)
npm run dev                                     # YOU are the only one running this
```

3. Open **http://localhost:3000** (a login screen is the expected first view).

**Confirmed-good signal in the terminal:** `✓ Ready in ~2s`, then on first load `GET /auth/login 200 … proxy.ts: ~400ms`. If you see that, it's working.

---

## Update (2026-06-04) — durable fix landed + QA browser

**The recurring corrupted-`node_modules` issue now has a durable fix.** The Next patches that used to be written into `node_modules` in-place by `scripts/patch-next-bin.js` are now a **version-pinned `patch-package` patch** (`patches/next+16.2.6.patch`, applied automatically via `"postinstall": "patch-package"`; rationale in `patches/README.md`). The old in-place script is deleted. A clean `rm -rf node_modules && npm install` now re-applies the patches cleanly and idempotently — no more half-applied/corrupted state — and a Next version bump surfaces a loud `patch-package` warning instead of silently breaking. **Never hand-edit `node_modules`; edit the patch instead (`npx patch-package next` after changing the files, then commit `patches/`).**

**Ctrl+C won't kill the server?** Ctrl+C only stops the foreground server in that terminal — if Claude Code is holding it in another shell, force-kill by port:

```bash
lsof -ti:3000 | xargs kill -9
pkill -f next-server; pkill -f "next dev"
lsof -i:3000           # should print nothing, then `npm run dev` fresh
```

## Local browser QA — use Brave, not Chrome

Browser-driven QA against `http://localhost:3000` must use the **Brave** browser, not Chrome.

- The founder's **Chrome profiles block `localhost`** (Chrome error page) — a **synced extension** intercepts the `localhost` origin (ruled out: HSTS, service worker, cached site data). Incognito works (extensions off) but can't be automated.
- **`127.0.0.1` is not a substitute** for logged-in testing: pages load, but the **Supabase auth session only sticks on the `localhost` origin**, so login won't hold on `127.0.0.1`.
- **Brave** (clean, no blocking extension) loads `localhost` and holds the session — it's the working QA browser, with the Claude in Chrome extension installed.
- Quick-login note: the dropdown fills email/password via a React `onChange` that browser automation doesn't fire — automation should set the inputs directly (native-setter + `input` event) or type the creds. Demo creds: `demo.admin@llv.dev` / `demo1234`, `demo.client@llv.dev` / `demo1234`; seeded clients/providers use `TestLLV2026!`.
- *Durable fix for the Chrome block (not yet done): binary-search-disable Chrome extensions to find the culprit (ad-blocker / privacy / VPN likeliest), then allow-list `localhost`.*

---

## Symptoms we've seen

- `next dev` reaches `✓ Ready` then **exits back to the shell prompt** (no stack trace) — it was *killed*, not crashed.
- Hangs at **`○ Compiling proxy ...`**; the browser spins / "can't connect" / blank white page.
- Webpack mode crashes with **`TypeError: (0 , _webpackconfig.loadProjectInfo) is not a function`**.
- Port 3000 held by an orphan `next-server` PID; you kill it, another appears (PID keeps changing).
- `[LLV-TRACE] …` lines in the output — these are temporary debug probes injected into Next's internals.

## Root causes (in order of how often they bite)

1. **Corrupted `node_modules/next` — the recurring one.** Caused by hand-editing/instrumenting Next's internal files (the `[LLV-TRACE]` probes) or half-applied patches. **The "Compiling proxy" hang and the `loadProjectInfo` crash are SYMPTOMS of this, not a real proxy bug** — after a clean reinstall, `proxy.ts` compiles in ~400ms and `/auth/login` returns 200. **Fix: `rm -rf .next node_modules && npm install`.**
2. **Two dev servers running at once.** Claude Code and the founder both running `next dev`. Next 16 allows only one instance; the second bounces to port 3001 then quits ("Another next dev server is already running"). Worse, Code running `pkill -f "next dev"` kills the founder's server too. **Fix: exactly one owner of the local dev server.**
3. **Node version mismatch.** Code has run under Node 22.x while the project pins **20.19.5** (`.nvmrc`). Mixed versions can leave the patched Next binary inconsistent. **Fix: everyone on 20.19.5 (`nvm use`).**

## Background — why the install is fragile

Next 16.2.6 eagerly loads its test runner (`next-test.js`) on `next dev`, which crashes startup. The repo works around it with `scripts/patch-next-bin.js`, run via a `postinstall` hook, which edits `node_modules/next/dist/bin/next`. Because the patch lives in `node_modules`, it's wiped on every reinstall and re-applied by `postinstall`. This is workable but fragile, and it's why ad-hoc edits to `node_modules` keep corrupting the install.

## Prevention (stop it recurring)

- **One dev-server owner.** While the founder runs `npm run dev`, Claude Code must **not** run its own `next dev` or `pkill` Next processes. Decide who owns it per session.
- **Never leave manual edits / instrumentation in `node_modules`.** It's not version-controlled and it corrupts the install. Remove any `[LLV-TRACE]`-style probes when done.
- **Pin Node 20.19.5 everywhere** (`nvm use`; `.nvmrc` is committed).
- **Make the `next-test` workaround durable** so `node_modules` surgery is never needed: commit a real `patch-package` patch (the dep is already installed but there's no `patches/` dir yet), or pin/upgrade Next to a version without the eager-load bug.
