# luxurylifestylevault.com — Setup Checklist

**For:** Jim (founder) — your steps. **Registrar:** Vercel (Vercel-managed DNS). **Purchased:** 2026-06-04 ($11.25/yr, auto-renew on).

Because the domain was bought through Vercel, **Vercel manages the DNS** — every record (website + email) goes in Vercel's DNS panel. GoDaddy is not involved for this domain.

---

## 1. Verify the ICANN email — REQUIRED (do first)
Check **jamesloganmueller@gmail.com** for a domain-verification email and click the link. ICANN requires a verified registrant email; if it's not verified within ~15 days the domain is **suspended**.

## 2. Connect the domain to the LLV project
Vercel → the domain → **Connect to project** → select the **existing `luxury-lifestyle-vault` project** (not a new one). Add both `luxurylifestylevault.com` and `www`. SSL auto-provisions. (Pre-launch this points the brand domain at your current login-gated deployment — fine.)

## 3. Resend brand-email authentication (when ready to send branded email)
- In Resend → **Add Domain** → `send.luxurylifestylevault.com` (Resend recommends a `send.` subdomain).
- Resend shows **SPF, DKIM, and DMARC** records → add each one in **Vercel → domain → DNS Records → Add**.
- Back in Resend, click **Verify** until the subdomain shows **Verified**.

## 4. Flip the app's sender to the brand address
- Set **`RESEND_FROM_EMAIL=noreply@send.luxurylifestylevault.com`** (or `concierge@…`) in `.env` (local) and in Vercel's project env.
- Restart `npm run dev` locally; redeploy for production.
- This replaces the temporary `send.linktolawyers.com` test sender.

## 5. Production cutover (at launch)
- Set `luxurylifestylevault.com` as the **production domain** on the project.
- Confirm brand email is sending from the brand domain, not the test domain.

---

**Note:** Until step 3/4 are done, keep testing email via the already-verified `send.linktolawyers.com` (`RESEND_FROM_EMAIL=noreply@send.linktolawyers.com`).
