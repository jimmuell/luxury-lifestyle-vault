# LLV Legal Finalization Worksheet — ToS & Privacy

**Date:** 2026-06-07
**Purpose:** Turn the live `/terms` and `/privacy` pages from `[PLACEHOLDER]` drafts into final, attorney-approved policies. Everything here is staged so that the moment the **WI LLC + EIN** exist, finalization is a fill-in-the-blanks pass plus an attorney review — not a rewrite.

> **How the live pages work (important):** `/terms` and `/privacy` render *directly* from these two markdown files at build time —
> - `docs/legal/llv_terms_of_service_2026-06-06.md`
> - `docs/legal/llv_privacy_policy_2026-06-06.md`
>
> So to update the live site you **edit the markdown, commit, and redeploy.** No React/page edits needed. (Source: `src/app/(legal)/terms/page.tsx` reads the `.md` via `fs.readFileSync`, `force-static`.)

---

## Part 1 — Fill-in placeholders (can be completed once LLC + EIN exist)

These are factual blanks. Recommended values are filled where already known; the rest wait on the LLC.

| # | Placeholder | Appears in | Status / recommended value |
|---|---|---|---|
| 1 | `[LEGAL ENTITY NAME]` | ToS §intro, §17, §20; Privacy §intro, §13 | **Pending LLC filing.** Likely "Luxury Lifestyle Vault LLC" (confirm exact name as filed with WI). |
| 2 | `[STATE OF FORMATION]` | ToS §intro | **Wisconsin** (known — from the launch-gate plan). |
| 3 | `[BUSINESS ADDRESS]` | ToS §20; Privacy §13 | **Pending.** Use the LLC's principal office / registered-agent address (whatever you put on the WI Articles of Organization). Avoid a personal home address if you can use a registered-agent or business address. |
| 4 | `[SUPPORT EMAIL]` | ToS §5, §20; Privacy §9, §13 | **Recommend creating** `concierge@luxurylifestylevault.com` (or `support@…`) on the brand domain and using it. Don't ship a personal/AOL address on public legal pages. |
| 5 | `[PHONE]` | ToS §20; Privacy §13 | **Toll-free +1 (833) 756-7981** once Twilio verification clears (currently pending). Until then, leave blank or use the support email only. |
| 6 | `[EFFECTIVE DATE]` | ToS + Privacy headers | The date you publish the finalized versions. Set last, after attorney sign-off. |

**Where to edit:** all of the above live in the two markdown files. Find/replace each bracketed token.

---

## Part 2 — Attorney-decision items (do NOT guess — counsel must set these)

These are not blanks to fill; they're legal judgments. Bring this list to the attorney along with the bailee + GL insurance policy (several depend on the coverage terms).

| # | Item | Location | What counsel needs to decide |
|---|---|---|---|
| A | **Item liability cap** `[SPECIFY LIMIT]` | ToS §9 | The per-item / per-claim liability limit and how the declared-value program works. **Must align with the bailee + GL insurance limits** (the assumptions register working number was $5K/item, $50K/client — confirm against the actual policy). |
| B | **Bailee duties / declared-value mechanics** | ToS §7 | Confirm bailee duties language and how declared value interacts with insurance. |
| C | **Claim window** `[CLAIM WINDOW]` | ToS §9 | Deadline for members to submit loss/damage claims (e.g., 14/30 days). |
| D | **Inspection window** `[INSPECTION WINDOW]` | ToS §10 | Time to report delivery issues (e.g., 48–72 hours). |
| E | **Aggregate liability cap period** `[12] months` | ToS §16 | Confirm the lookback period and any legally required carve-outs. |
| F | **Governing law state** `[GOVERNING LAW STATE]` | ToS §18 | Arizona vs Wisconsin (operations span both; counsel chooses). |
| G | **Venue** `[VENUE]` | ToS §18 | The courts with jurisdiction — follows from F. |
| H | **Arbitration + class-action waiver** | ToS §18 | Whether to include binding arbitration / class waiver, draft the clause, and add any required consumer disclosures. |
| I | **AI data-use statement** | Privacy §3 | Confirm "we don't use your Items/photos to train third-party public AI models" matches Anthropic's current API data-use terms. |
| J | **Cookies/analytics disclosure** | Privacy §6 | If/when analytics or marketing cookies are added, disclose + provide controls. |
| K | **State privacy-law disclosures** | Privacy §9 | Which state privacy laws apply (CA/others) and required disclosures. |

---

## Part 3 — Sequence (the fast path once the LLC lands)

1. **Form WI LLC + get EIN** → locks #1, #2, #3 (entity name, state, address). *(This is the launch-gate dependency root — see the Launch Gates Action Plan, Drive folder 08.)*
2. **Stand up `concierge@luxurylifestylevault.com`** → #4.
3. **Toll-free verification clears** → #5 (phone).
4. **Bind bailee + GL insurance** → unlocks counsel's answers to A, B, E (caps must match the policy).
5. **Attorney review pass** → counsel resolves Part 2 (A–K) and reviews the whole document, especially §7 bailment, §9 liability, §18 dispute resolution.
6. **Fill all Part 1 placeholders + set `[EFFECTIVE DATE]`** in the two markdown files.
7. **Remove the "DRAFT — for review only" banners** at the top of each file.
8. **Commit + redeploy** → live `/terms` and `/privacy` are final.
9. **Verify** both pages render with no remaining `[…]` tokens (a quick `grep -n "\[" docs/legal/*.md` should return nothing but legitimate brackets).

---

## Part 4 — Pre-attorney packet (hand counsel this)

To make the review efficient, give the attorney:
- The two draft markdown files (or the live `/terms` + `/privacy` URLs once redeployed).
- This worksheet (Part 2 is their to-do list).
- The **bailee + GL insurance policy** (for caps A/B/E).
- A one-line business description: *AI-assisted concierge logistics for luxury wardrobe management — storage, professional cleaning, seasonal rotation, delivery/returns; bi-directional WI↔AZ corridor; founding-member pilot Oct 2026.*
- Note that **SMS/A2P language** (ToS §11, Privacy §5) is written to carrier requirements — ask counsel to preserve its substance.

---

*Nothing here is legal advice. The drafts and this worksheet were prepared by Cowork; a licensed attorney must review before publication.*
