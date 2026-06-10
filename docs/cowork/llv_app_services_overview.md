# Luxury Lifestyle Vault — The Services Behind the App (Plain English)

*A non-technical map of the outside services our platform uses and what each one does. Think of the app as a concierge front desk, with a handful of specialized partners working behind it.*

| Service | What it does, in plain English |
|---|---|
| **Vercel** | The ground the app is built on — it hosts our website and keeps it online, fast, and secure for everyone who visits. |
| **Supabase** | The filing cabinet and the front door. It stores all our data (members, wardrobes, orders), handles secure member logins, and holds the wardrobe photos. |
| **Stripe** | Handles all the money — membership subscriptions and per-request charges — securely. We never see or store raw card numbers; Stripe does that part. |
| **Resend** | Sends our emails — order updates, payment receipts, reminders — all with Luxury Lifestyle Vault branding. |
| **Twilio** | Sends text-message (SMS) updates to members who opt in. Switches on once carrier approval clears. |
| **Anthropic (Claude AI)** | The brains for the wardrobe. It looks at each uploaded photo to automatically describe and categorize the item, and it powers plain-language closet search like "something for a black-tie event." |
| **Inngest** | The behind-the-scenes task runner. After someone takes an action, it reliably carries out the follow-up work — sending emails, processing billing, analyzing photos, sending seasonal reminders — without making anyone wait, and it retries automatically if something hiccups. |
| **Sentry** | The alarm system. The moment something breaks for a real member, it flags it with enough detail to fix fast — often before anyone even notices. |

## How it all fits together

A typical journey shows how these partners hand off to each other. A new member signs up and logs in (**Supabase**), and their payment method is captured securely (**Stripe**). Behind the scenes, **Inngest** quietly sets up their billing profile and tells **Resend** to send a branded welcome email — all without the member waiting on a loading screen. When they photograph a garment, the picture is stored (**Supabase**) and **Inngest** passes it to **Claude AI**, which identifies and catalogs it so it shows up, neatly sorted, in their digital closet.

From there, every order moves the same way: the member's actions are saved in **Supabase**, money flows through **Stripe**, and **Inngest** fires off the right email (**Resend**) or text (**Twilio**) at each step — confirmed, shipped, delivered. The whole experience is served to members through **Vercel**, while **Sentry** keeps watch the entire time, ready to alert us if anything goes wrong. The result is a service that feels effortless and white-glove on the surface, with reliable, specialized infrastructure doing the heavy lifting underneath.

*Last updated: 2026-06-07.*
