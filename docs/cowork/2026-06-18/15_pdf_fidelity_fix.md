# Fix — restore brand fidelity in generated PDFs

**For:** Claude Code · **Branch:** `feat/doc-management`
**Symptom:** generated room PDFs look lower-quality than the originals — the brand serif isn't showing, the masthead tagline is wrong, and multi-page docs have no running footer/page numbers. The Markdown and `house-style.ts` palette are fine; the loss is in font loading and the render template.

## 1. Self-host the brand fonts + wait for them (the main fix)

The PDF currently loads Cormorant Garamond + Inter from the **Google Fonts CDN** at render time (`buildPdfHtml`) and does not wait for them — headless Chromium renders before they load and falls back to Georgia/Helvetica.

- **Self-host** the font files: add `Cormorant Garamond` (300/400/500/600 + italics) and `Inter` (400/500/600) `.woff2` to the repo (e.g. `public/fonts/` or `src/lib/docs/fonts/`).
- In `buildPdfHtml`, **replace the `<link>` to Google Fonts with `@font-face` rules that embed the fonts** — base64-inline the `.woff2` (most reliable; zero network dependency in the headless context) or reference local files the renderer can read. Keep the `.llv-doc` font stacks as-is (Cormorant for masthead/headings, Inter for body).
- In `ChromiumRenderer`, **await fonts before `page.pdf()`**: `await page.evaluateHandle('document.fonts.ready')` (and a `networkidle0`/`load` wait). For `GotenbergRenderer`, ensure the fonts are available to its Chromium (embedded `@font-face` covers both).
- Verify the masthead + headings render in actual Cormorant in the PDF, matching the admin preview.

## 2. Fix the masthead tagline

In `buildDocHtml`, change the tagline from `"Wardrobe Concierge & Logistics Platform"` to the brand line **"Your Lifestyle, Wherever Life Takes You."** (consider italic + slightly larger to match the house docs).

## 3. Running footer + page numbers on every page

Today the masthead is page-1-only and the footer is a single end block. For multi-page docs:
- Use Puppeteer `page.pdf({ displayHeaderFooter: true, footerTemplate, headerTemplate, margin })`. Footer: left `Luxury Lifestyle Vault · Confidential & Proprietary`, right `<span class="pageNumber"></span>` — small, gold-muted, italic, matching the house footer. Add bottom (and small top) `@page`/`margin` room so the footer doesn't collide with content; drop or keep the in-body end footer accordingly.
- Mirror the same footer in the Gotenberg path.

## 4. Small CSS polish to match the originals (optional, same pass)
- Style the **lead/subtitle line** (the italic descriptor under the title in several docs) — e.g. style the first `<em>`-only paragraph, or a `> ` lead convention — in gold-muted italic, matching the earlier renders.
- Re-check heading scale/spacing and the gold section rule against the reference PDFs Cowork produced (Vision & Strategy, Cap Table, a table-heavy doc) so the generated output meets or beats them.

## Validation
- Admin preview and the generated PDF should now be visually identical (same self-hosted fonts).
- Spot-check: Vision & Strategy, Cap Table (table), and a multi-page doc (e.g. Technology & Platform) — confirm Cormorant masthead/headings, correct tagline, gold rules/tables, and a running "Confidential · page N" footer.
- `npm run verify` clean; report back with a sample regenerated PDF.

## Note
This is a pipeline-level fix: once fonts + template are right, **all** docs regenerate to this quality on their next publish. Re-publish the 22 (or trigger PDF regeneration) after the fix lands.
