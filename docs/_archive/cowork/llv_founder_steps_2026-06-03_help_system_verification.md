# Your Steps — Verify the Help System

**For:** Jim (founder) — this is for YOU to read and follow. Not a Code prompt; don't paste this into VS Code.
**Date:** 2026-06-03

---

## Wait until Claude Code reports these three things first:

1. Migration `028` applied (the help tables exist).
2. `npm run verify` came back clean.
3. The exact steps to load the help "seed" content.

When you have those, do the steps below.

---

## Step-by-step

**1. Check your Node version.**
In the project terminal, run:
```
node -v
```
It must say **20.19.5**. If it doesn't, run `nvm use` and check again.

**2. Start the app (you own the server).**
Make sure no other dev server is running, then:
```
npm run dev
```
Wait for `✓ Ready`, then open **http://localhost:3000**.

**3. Log in as admin and load the help seed.**
Go to the Seed Data Manager at **`/admin/seed`**. Find the **"Help Content"** entry (2 tooltips + 2 articles) and click **Run**. It's safe to run twice — it skips anything already there.

**4. Check the help tips appear where they should.**
- Open the **on-demand request** page and the **orders/returns** page → you should see a small help icon. Click it → a tip pops up with **"Talk to your concierge"** at the bottom.
- Open the **wardrobe**, **rotation**, and **billing** pages → there should be **no** help icon yet (nothing seeded there). That blank is expected — it proves the framework only shows help where you've added content.

**5. Add help yourself (the important test).**
- Go to **Admin → Help**.
- Add a tooltip for area key **`client.billing`** (give it a title + a sentence).
- Save, then reload the **billing** page → the tip should now appear. (This proves you can add help anytime, no developer needed.)

**6. Check the help center.**
- Open **/client/help** (or the "Help" link in the menu).
- The on-demand article should be listed. Search **"vault"** → it stays visible. Search **"garment"** → it disappears (that's a provider article, not shown to clients).
- Click **"Talk to your concierge"** → it should open your concierge messaging (`/client/concierge`).

**7. Check the "Learn more" deep link.**
- On **/client/orders/new**, click the on-demand help tip → the popover has a **"Learn more →"** link.
- Click it → it should jump to `/client/help#how-on-demand-fulfillment-works` and scroll to that article.

**8. Check the provider side.**
- Log in as a **provider** → open **/provider/help**.
- The **"Garment Care Stages"** article should show. Note: there's intentionally **no** "Talk to your concierge" button here — providers don't have a client concierge (they use per-order messaging). That's expected, not a bug.

**9. (Optional) Check permissions & drafts.**
- As a regular client/provider, you should **not** be able to edit help content.
- In **Admin → Help**, flip an article's **published** toggle off → it should disappear from `/client/help` (and `/provider/help`) but still show in the admin list.

---

## When you're done

- **If everything works:** message me — **"help system verified."** I'll log Phase 1.5 and prep the push step.
- **If anything's off:** copy the error or describe what you saw (a screenshot is fine) and send it to me. I'll write the fix prompt for Code — you won't have to figure it out.
