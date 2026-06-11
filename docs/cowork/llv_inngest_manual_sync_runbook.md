# LLV — Inngest Manual Sync Runbook

**Last updated:** 2026-06-07
**Decision owner:** Founder + Cowork
**TL;DR:** We deliberately rely on **manual Inngest syncs** in production. Auto-sync can't work on our current Vercel plan without weakening security. After any deploy that **changes a function's existence, trigger, schedule, or registration config**, do a one-click **Resync** in the Inngest dashboard (apex URL). Logic-only changes need no sync.

---

## Why manual (the Option B decision, 2026-06-07)

Inngest's Vercel integration is supposed to auto-sync on every deploy, but on our setup it can't:

- The integration always hands Inngest the **generated `*.vercel.app` deployment URL**, and Inngest must reach *that* URL to run the sync.
- Vercel's **Standard Protection** (our plan's default) protects everything **except the production custom domain** — which includes that generated production URL. So Inngest gets "could not reach your URL" and the sync fails (lands in "Unattached syncs").
- **`INNGEST_SERVE_ORIGIN` does NOT fix this** — it only changes the URL the SDK *reports* once reached; it can't redirect the integration's initial reach. (We tested this 4×; every auto-sync still targeted the `*.vercel.app` URL.)
- The granular **"Only Preview Deployments"** protection mode (which would unblock the production URL while keeping previews protected) requires **Advanced Deployment Protection — $150/mo (Pro)**. Not worth it.

**Options considered:**

| Option | Result | Verdict |
|---|---|---|
| `INNGEST_SERVE_ORIGIN=apex` env var | Auto-sync still hit protected `*.vercel.app` URL → failed | ❌ Doesn't work |
| Turn **off** Vercel Authentication entirely | Auto-sync works, but preview + generated URLs become public | ⚠️ Rejected — exposes preview builds |
| Advanced Deployment Protection ($150/mo) | Granular protection + bypass | ❌ Not worth the cost |
| **Keep protection ON + manual Resync** | Production stays protected; sync on demand | ✅ **Chosen (Option B)** |

The production app stays protected by Supabase auth regardless, and Inngest functions rarely change now that engineering is essentially done — so the occasional manual Resync is a fine trade.

> The `INNGEST_SERVE_ORIGIN` variable was **removed** from Vercel (it did nothing useful). `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` remain (set by the integration; the signing key must match the Production env or syncs 401).

---

## When you MUST manually sync

Re-sync after a **deploy** that changes any of the following — these are things Inngest's *registry* needs to know:

- **A function is added or removed** — the list served in `src/app/api/inngest/route.ts`.
- **A function's trigger changes** — the event name it listens for, **or a cron/schedule** (e.g., the `seasonal-rotation-reminders` cron, or its lead-days).
- **A function's `createFunction` config changes** — id, name, concurrency, retries, rate limits, etc. (in `src/lib/inngest/functions/`).

## When you do NOT need to sync

- You changed only the **logic inside** an existing function's handler (the steps it runs), without touching its id, trigger, or config. Inngest calls your live `/api/inngest` endpoint, which already runs the latest deployed code — updated logic goes live on deploy automatically.

**Rule of thumb:** *Touched `route.ts` or a function's trigger/schedule/config? Resync. Logic-only edit? Don't bother.* A resync is free and idempotent, so **when in doubt, resync** — a "No change" result is harmless.

---

## How to manually sync

### Method 1 — Inngest dashboard (recommended, ~20 sec)
1. Go to **https://app.inngest.com/env/production/apps**
2. Open the **`luxury-lifestyle-vault`** app → click **Resync** (top-right). *(Or use the top-right "Sync new app" button.)*
3. The **App URL** is pre-filled with the apex: `https://luxurylifestylevault.com/api/inngest` — leave it as-is.
4. Click **Sync app**. You'll see a green **"Synced app"** toast and the **Last sync** timestamp updates.
   - Result **"Success"** = new/changed functions registered. **"No change"** = nothing to update (also fine — confirms it's current).

### Method 2 — curl (one-liner)
```bash
curl -X PUT https://luxurylifestylevault.com/api/inngest
```
A `PUT` to the serve endpoint triggers the SDK to re-register with Inngest. (Use the apex domain — it's the unprotected URL.)

### Method 3 — ask Cowork
Cowork can perform the dashboard resync for you via the connected browser — just say "resync Inngest." (Cowork verified this path on 2026-06-07.)

---

## How to tell a sync is needed / failed

- **Apps page** → the `luxury-lifestyle-vault` app shows a stale "Last synced at," and/or
- **Apps page → "Unattached syncs"** keeps logging new failed entries on deploys (these are the blocked auto-sync attempts — expected under Option B; they're noise, not a working sync).
- **Symptom in the app:** a newly added function never fires, or a changed cron/trigger doesn't take effect → you forgot to resync.

If async **emails/SMS stop entirely** (not just one function), check the signing key first: `INNGEST_SIGNING_KEY` in Vercel must match the Inngest **Production** environment, or all syncs 401. (That was the June 6 root cause.)

---

## Current registered functions (reference, as of 2026-06-07)

| Function | Trigger |
|---|---|
| `bill-on-demand-order` | event `order/delivered` |
| `categorize-item-photo` | event `item/photo.uploaded` |
| `create-stripe-customer` | event `profile/created` |
| `notify-provider-assignment` | event `provider/assigned` |
| `seasonal-rotation-reminders` | cron `0 9 * * *` |
| `send-email` | event `email/send` |

*Sources: [Inngest — Vercel deploy & sync](https://www.inngest.com/docs/deploy/vercel); [Vercel — Deployment Protection](https://vercel.com/docs/deployment-protection).*
