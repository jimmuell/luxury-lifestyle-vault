# Your Steps — Test SMS now with a Twilio trial toll-free number (no EIN)

**For:** Jim (founder) — your steps. Not a Code prompt.
**Date:** 2026-06-06

You can test the whole SMS flow today, no EIN needed. The trial **toll-free** number Twilio is offering is on a **different track from 10DLC** — the A2P 10DLC registration blocking does NOT apply to it. It supports two-way SMS, which is all we need to test.

**Trial limitations (fine for testing):** you can only text **verified** numbers (your own), messages get a "Sent from your Twilio trial account" prefix, and the number expires after ~30 days. This is for testing only — the launch decision (toll-free verification vs. 10DLC Standard Brand with the EIN) comes later.

---

## Prerequisites
- **Inbound STOP/HELP test** needs only the consent webhook, which already shipped (`04`).
- **Outbound test** (an order text actually arriving) needs the Twilio **sending** code — run prompt **`05`** first.

## Step 1 — Claim the trial toll-free number
On the **Messaging → Try it out → Send an SMS** page, click **Get trial toll-free number**. Note the number (format `+1 8XX …`).

## Step 2 — Verify your cell phone
**Phone Numbers → Manage → Verified Caller IDs → Add a new Caller ID.** Add your personal mobile and complete the verification code. (Trial accounts can only message verified numbers.)

## Step 3 — Put the Twilio credentials in the app's environment
From **Account Dashboard**, copy your **Account SID** and **Auth Token**. Set these in **both** your local `.env` and **Vercel → Settings → Environment Variables** (Production + Preview), then **redeploy** Vercel:
```
TWILIO_ACCOUNT_SID=AC…
TWILIO_AUTH_TOKEN=…            # also required for the inbound webhook's signature check
TWILIO_PHONE_NUMBER=+18XXXXXXXXX   # the trial toll-free number from Step 1
```

## Step 4 — Test INBOUND (STOP/HELP) — works after `04` + Step 3
1. In Twilio, open the toll-free number's config → **Messaging → "A message comes in"** → **Webhook**, set the URL to:
   ```
   https://luxurylifestylevault.com/api/webhooks/twilio
   ```
   (use your deployed domain), method **HTTP POST**. Save.
2. Make sure there's a test **client** whose phone = your verified mobile and `sms_consent = true` (set it via onboarding or the settings toggle).
3. From your phone, text **STOP** to the toll-free number → confirm `sms_consent` flips to **false** for that client (check the settings toggle or `client_profiles`). Text **START** → it flips back on.

## ⚠️ Known limit: the trial toll-free number can't deliver to a real phone yet
Outbound from a toll-free number is blocked by carriers until the number completes **Toll-Free Verification** (you'll see status `Undelivered`, **error `30032`** in Messaging Logs — this was confirmed on 2026-06-06). The API call still succeeds (`201 Created`, status `Sent`), so your app/creds are fine — the carrier is the gate. Verification takes days-to-weeks and the trial number expires in 30 days, so **don't verify the trial number** — test via Virtual Phone instead, and decide the real sender (toll-free verification vs. 10DLC Standard Brand w/ EIN) at launch.

## Step 5 — Test OUTBOUND (order text) — works after `05` + Step 3
Use **Virtual Phone** (no carrier, no verification needed):
1. The app's `TWILIO_PHONE_NUMBER` send still runs; to *see* the message, use Twilio's **Virtual Phone** (Messaging → Try it out → "Send to Virtual Phone").
2. After running `05`, trigger an order **confirm → ship → deliver** for a consented test client and confirm each attempt is logged in the **`sms_sends`** table (status `sent` + a Twilio SID). That proves the sending code path end-to-end.
3. Real-handset delivery is deferred to launch (after toll-free verification or 10DLC registration).

## Step 6 — Test INBOUND (STOP/HELP) — works now, even on the unverified trial number
Inbound is **not** blocked by toll-free verification. Text **STOP** from your phone *to* the toll-free number → confirm `sms_consent` flips to **false** for the matching client. Text **START** → back on.

## If something doesn't behave
- **Outbound to a real phone fails with `30032`** — expected on the unverified trial number; use Virtual Phone (above).
- **Inbound webhook rejecting?** Confirm `TWILIO_AUTH_TOKEN` is set in the **deployed** (Vercel) env and you redeployed — the webhook validates Twilio's signature with it.
- Check **Monitor → Logs → Messaging** in Twilio for per-message status + error codes.

## For launch (later, not now)
Decide between **toll-free verification** (a form; no EIN required for the number) and **10DLC A2P Standard Brand** (needs the EIN, higher trust/throughput). Either way, your in-app opt-in + STOP handling are already built, and the from-number is just an env value to swap.
