# Your Steps — Switch the email "from" address to the apex domain

**For:** Jim (founder) — your steps. Not a Code prompt.
**Date:** 2026-06-06

You verified `luxurylifestylevault.com` in Resend and set your **local** `.env` to:
```
RESEND_FROM_EMAIL=noreply@luxurylifestylevault.com
```
That covers local dev. The deployed app (Vercel) has its **own** environment variables, so you need to set the same value there or the test/production app will keep sending from the old `send.` address.

## Do this

### A. The new Resend API key
You created a new Resend API key (`Luxury-Lifestyle-Vault`, full access). Point the app at it:
- **Local `.env`:** set `RESEND_API_KEY=re_…` (the full key).
- **Vercel → Settings → Environment Variables:** set `RESEND_API_KEY` to the same value for **Production** (and **Preview**).
- ⚠️ The full key is only shown **once, at creation** in Resend. If you didn't copy it, delete the key and create a new one. Never commit it to git (it stays in `.env`, which is gitignored).

### B. The apex from-address
1. **Vercel → your `luxury-lifestyle-vault` project → Settings → Environment Variables.**
2. Find **`RESEND_FROM_EMAIL`** (add it if it's not there). Set the value to:
   ```
   noreply@luxurylifestylevault.com
   ```
   Apply it to **Production** (and **Preview** too, if you want test deploys to match). Save. (Your local `.env` is already set.)
3. **Redeploy** — env-var changes only take effect on a new deploy. Vercel → **Deployments** → latest → **⋯ → Redeploy**.
4. **Verify** — once it's live, send a test from **`/admin/email`** (or walk an order through a status change) and confirm the email's **From** shows `noreply@luxurylifestylevault.com` and it lands in the inbox (not spam).

## Good to know
- Both `luxurylifestylevault.com` and `send.luxurylifestylevault.com` are verified, so nothing breaks either way — this just changes which one your emails come from.
- Pick one and stay with it; sending reputation builds per address.
- Optional but recommended: confirm there's a **DMARC** record on the root domain (Resend's records list / your Vercel DNS). It helps deliverability.

When the Vercel env is set + redeployed, tell me and I'll note it in the handoff.
