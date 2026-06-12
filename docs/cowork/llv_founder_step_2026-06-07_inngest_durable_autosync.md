> **⚠️ SUPERSEDED (2026-06-07) — do not use as the live version.**
>
> The `INNGEST_SERVE_ORIGIN` approach below was tested and does **not** work on the free Vercel tier (tested 4×; cannot override the integration's reach to the protected `*.vercel.app` URL).
> Decision: **Option B — manual Resync** (keep Deployment Protection ON).
> Single source of truth: **Inngest Manual Sync Runbook** — repo copy `docs/cowork/llv_inngest_manual_sync_runbook.md`, canonical in Drive **00 CoWork**.
> This file is kept as a record of what was tried.

---

# Founder Step — Durable Inngest Auto-Sync (stop the manual apex resyncs)

**Date:** 2026-06-07
**Owner:** Founder (Vercel + Inngest dashboards only — no code change)
**Time:** ~10 minutes + one redeploy
**Goal:** Make every Vercel production deploy auto-register with Inngest, so you never again have to click **Resync** at the apex after a function change.

---

## Background — what actually broke on June 6

Inngest's Vercel integration is supposed to auto-sync your app on **every** deploy. It wasn't, for two reasons:

1. **Vercel Deployment Protection** blocks the auto-generated `*.vercel.app` URL that the integration tries to sync — Inngest's servers get "could not reach URL."
2. The `INNGEST_SIGNING_KEY` in the Production env didn't match (caused a 401). *(Already fixed June 6.)*

The June 6 workaround was a **manual** sync pointed at the public apex `https://luxurylifestylevault.com/api/inngest`. That works, but it has to be repeated by hand after every function change. This step makes it automatic.

---

## The durable fix (recommended) — `INNGEST_SERVE_ORIGIN`

The apex domain (`luxurylifestylevault.com`) is **not** behind Deployment Protection — that's why the manual apex sync succeeded. Inngest lets you tell its integration to sync against your custom domain instead of the protected `*.vercel.app` URL. Set one environment variable and the auto-sync starts hitting the reachable apex on every deploy.

### Steps

1. **Vercel → your project → Settings → Environment Variables.** Add:
   - **Key:** `INNGEST_SERVE_ORIGIN`
   - **Value:** `https://luxurylifestylevault.com`
   - **Environment:** **Production** only (leave Preview/Development unchecked).
2. **Confirm the Inngest Vercel integration is installed** (it is, from the May 30 setup): Inngest dashboard → Settings → Integrations → Vercel → your project should be listed.
3. **Redeploy production** (Vercel → Deployments → ⋯ → Redeploy on the latest, or push any commit). On deploy, Vercel's webhook fires the sync and Inngest now uses the apex URL.
4. **Verify:** Inngest dashboard → your `luxury-lifestyle-vault` production app → **all 6 functions** should show as synced with a fresh "last synced" timestamp matching the redeploy. (Functions: `categorize-photo`, `create-stripe-customer`, `send-email`, `notify-provider-assignment`, `bill-on-demand-order`, `seasonal-rotation-reminders`.)
5. **Smoke test (optional but ideal):** trigger an order status change in `/admin` and confirm a *sent* email appears in `/admin/email` Recent Sends — same end-to-end check that closed item 1.3 on June 6.

> ⚠️ One caveat: with `INNGEST_SERVE_ORIGIN` set, the apex **must stay reachable**. It's your public production domain, so that's the normal state — but if you ever put the apex itself behind auth, the sync will fail and you'd revert to one of the options below.

---

## Alternatives (only if the recommended fix doesn't fit)

**Option B — Protection Bypass for Automation** *(requires Vercel Pro plan)*
Keeps Deployment Protection on the `*.vercel.app` URLs but lets Inngest through with a secret.
1. Vercel → Project → Settings → Deployment Protection → enable **Protection Bypass for Automation**; copy the secret.
2. Inngest dashboard → Settings → Integrations → Vercel → your project → paste the secret into **"Deployment protection key."**
3. Redeploy. Inngest now uses the secret to bypass protection on auto-sync.
*You're on the free Hobby tier today, so this needs a plan upgrade — the `INNGEST_SERVE_ORIGIN` fix above avoids that.*

**Option C — Disable Deployment Protection entirely** *(free, least preferred)*
Vercel → Project → Settings → Deployment Protection → turn off. Auto-sync works because the `*.vercel.app` URL becomes public — but so do all your preview/generated deployment URLs. Not recommended for a platform that handles client PII.

---

## What I recommend

Do **Option A (`INNGEST_SERVE_ORIGIN`)** — it's free, durable, keeps Deployment Protection on, and ends the manual resyncs. If you ever move to Vercel Pro for other reasons, you can additionally add the bypass secret (Option B) as belt-and-suspenders.

After it's verified, this closes the "durable Inngest auto-sync" loose end (First Steps #5b in the handoff).

---

*Sources: [Inngest — Vercel deployment & hostname override](https://www.inngest.com/docs/deploy/vercel), [Vercel — Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).*
