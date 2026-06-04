# Code Prompt — Admin "Email (Resend)" config + test-send page

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder will exercise the running app. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Goal

Add an **admin-only** page that (1) shows the current Resend/email configuration and (2) lets an admin **send a test email** to an address that's **prefilled with their own email but editable**, so we can quickly confirm deliverability while testing. The test must go through the **real production send path** (same client/from-address the app uses), so a green result means real email works.

## Scope

**1. Page — `src/app/(admin)/admin/email/page.tsx`** (server component, admin-gated via the existing admin layout / `requireAdmin`). Title: **"Email (Resend)"**.

**2. Config panel (read-only).** Display the effective config sourced from `src/lib/resend/client.ts`:
- **From name** (`FROM_NAME`) and **From address** (`FROM_EMAIL`, currently `noreply@send.luxurylifestylevault.com`).
- **API key configured:** yes/no — a boolean only. **Never render the key value.**
- A one-line note that these come from env vars (`RESEND_FROM_EMAIL`, `RESEND_API_KEY`) and are changed via env, not in this UI.

**3. Test-send form (client component).**
- A **"To"** input **prefilled with the current admin's email** (from the session), fully editable for testing other addresses.
- Optional **Subject** input (default: `LLV Resend test`).
- A **"Send test email"** button → calls the server action.

**4. Server action — `src/actions/email.ts → sendTestEmail({ to, subject? })`:**
- Re-verify session + admin role (`requireAdmin`).
- Validate `to` is a well-formed email; reject otherwise.
- Send via the **existing** `getResend().emails.send(...)` using `from: \`${FROM_NAME} <${FROM_EMAIL}>\`` and a simple branded HTML body, e.g. *"This is a test email from the Luxury Lifestyle Vault admin dashboard, sent from {FROM_EMAIL} at {timestamp}. If you received this, Resend is configured correctly."*
- Return `{ success: true, id }` with the Resend message id on success, or `{ error }` with the Resend error message on failure (so issues like an unverified domain or recipient restriction surface clearly). **Never throw to the form.**

**5. Feedback.** `sonner` toast — success shows the Resend message id; error shows the returned message.

**6. Nav.** Add an **"Email"** link to the admin nav/sidebar.

**Keep it self-contained** (its own route + action + component, admin-only) so it could be removed cleanly later.

**Optional (only if quick):** a small "Recent sends" list from the existing `email_sends` table (last ~10: to / subject / status / time) for debugging. Skip if it adds friction.

## Acceptance criteria

- `/admin/email` is reachable **only by admins**; non-admins are blocked/redirected.
- The page shows the current from-name/from-address and "API key configured: yes/no" (key value never shown).
- The **To** field is prefilled with the admin's email and is editable; sending to a valid address delivers a test email **from `noreply@send.luxurylifestylevault.com`**, and the success toast shows the Resend id.
- Invalid emails are rejected; Resend errors surface in a toast, not a crash.
- `npm run verify` (ESLint + tsc) is clean.

## Conventions (from `CLAUDE.md`)

- Admin-only server action that re-verifies session + role (`requireAdmin`); return `{ error }` / `{ success }`, throw only for auth violations.
- Reuse `src/lib/resend/` (`getResend`, `FROM_EMAIL`, `FROM_NAME`) — don't create a second Resend client.
- UI: Shadcn on Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); `sonner` toasts; Obsidian & Ivory design system.

## Report back

Files changed, the `npm run verify` result, and the manual-check steps for the founder (open `/admin/email`, confirm config display, send a test to themselves and to a second address, confirm sender = `noreply@send.luxurylifestylevault.com`).
