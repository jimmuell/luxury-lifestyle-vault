# Code Prompt — Default the admin test-email recipient to a fixed address

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Relates to:** the admin "Email (Resend)" test-send page (`/admin/email`).

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Goal

On the admin **Send test email** form (`/admin/email`), the **"To"** field currently prefills with the logged-in admin's own email. Change the default prefill to **`jimmuell@aol.com`** (kept fully editable). The Subject default (`LLV Resend test`) stays as-is.

## Scope
- In the admin email test page/component (`src/app/(admin)/admin/email/page.tsx` and its test-send client component), change the initial value of the **"To"** input from the admin's session email to the constant **`jimmuell@aol.com`**.
- Define it as a named constant (e.g. `const DEFAULT_TEST_RECIPIENT = 'jimmuell@aol.com'`) so it's easy to find/change later, rather than an inline literal buried in JSX.
- The field must remain **editable** (this only changes the starting value) and the existing validation/send behavior is unchanged.
- The admin's session email is no longer needed as the default; if it was only passed in for that purpose, you can stop threading it through — but don't break anything else that uses it.

## Acceptance criteria
- Loading `/admin/email` shows the **To** field pre-filled with `jimmuell@aol.com`, still editable.
- Sending still works (valid address → sends via the existing Resend path; invalid → rejected as before).
- `npm run verify` (ESLint + tsc) is clean.

## Report back
Files changed and the `npm run verify` result.
