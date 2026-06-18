/**
 * LLV house stylesheet — shared by the admin live preview (Phase 2) and the
 * Puppeteer PDF renderer (Phase 3).  CSS is scoped to `.llv-doc` so it can be
 * injected into the admin page without bleeding into surrounding UI.
 *
 * Colors (from globals.css vault palette):
 *   Ivory     #F8F4EE   background
 *   Obsidian  #0A0A0A   body text
 *   Gold      #C9A96E   rules, table headers, accent
 *   Stone     #6B6B6B   captions, muted text
 *   Mist      #E8E4DE   table alternating rows, horizontal rules
 *
 * Fonts: Cormorant Garamond (serif, headings) + Inter (sans, body).
 * Both are loaded by the root layout via next/font, so they are available in
 * the admin preview.  For Phase 3 (PDF), the Puppeteer template must embed the
 * Google Fonts import (see comment in generatePdfHtml).
 */

export const HOUSE_CSS = `
/* ── reset ─────────────────────────────────────────────────────────────────── */
.llv-doc *,
.llv-doc *::before,
.llv-doc *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── page ───────────────────────────────────────────────────────────────────── */
.llv-doc {
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.65;
  color: #0A0A0A;
  background: #F8F4EE;
  padding: 48px 56px 56px;
  max-width: 760px;
  margin: 0 auto;
}

/* ── masthead ────────────────────────────────────────────────────────────────── */
.llv-doc-masthead {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #C9A96E;
}
.llv-doc-masthead .brand {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 11pt;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #C9A96E;
  font-weight: 500;
}
.llv-doc-masthead .tagline {
  font-size: 8pt;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6B6B6B;
  margin-top: 3px;
}
.llv-doc-masthead .doc-title {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 22pt;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: #0A0A0A;
  margin-top: 16px;
  line-height: 1.2;
}

/* ── body ────────────────────────────────────────────────────────────────────── */
.llv-doc p {
  margin-bottom: 0.85em;
}

/* ── headings ────────────────────────────────────────────────────────────────── */
.llv-doc h1,
.llv-doc h2,
.llv-doc h3,
.llv-doc h4 {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-weight: 400;
  color: #0A0A0A;
  line-height: 1.2;
  margin-top: 1.6em;
  margin-bottom: 0.5em;
}
.llv-doc h1 { font-size: 20pt; border-bottom: 1px solid #C9A96E; padding-bottom: 6px; }
.llv-doc h2 { font-size: 15pt; }
.llv-doc h3 { font-size: 12pt; font-weight: 500; }
.llv-doc h4 { font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── lists ───────────────────────────────────────────────────────────────────── */
.llv-doc ul,
.llv-doc ol {
  padding-left: 1.4em;
  margin-bottom: 0.85em;
}
.llv-doc li { margin-bottom: 0.3em; }
.llv-doc li > ul,
.llv-doc li > ol { margin-top: 0.2em; margin-bottom: 0.2em; }

/* ── blockquote ──────────────────────────────────────────────────────────────── */
.llv-doc blockquote {
  border-left: 3px solid #C9A96E;
  padding: 6px 16px;
  margin: 1em 0;
  color: #6B6B6B;
  font-style: italic;
}

/* ── horizontal rule ─────────────────────────────────────────────────────────── */
.llv-doc hr {
  border: none;
  border-top: 1px solid #E8E4DE;
  margin: 1.5em 0;
}

/* ── code ────────────────────────────────────────────────────────────────────── */
.llv-doc code {
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 9pt;
  background: #E8E4DE;
  padding: 1px 5px;
  border-radius: 3px;
}
.llv-doc pre {
  background: #E8E4DE;
  padding: 12px 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 0.85em;
}
.llv-doc pre code { background: none; padding: 0; }

/* ── tables ──────────────────────────────────────────────────────────────────── */
.llv-doc table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
  font-size: 10pt;
}
.llv-doc thead tr {
  background: #C9A96E;
  color: #F8F4EE;
}
.llv-doc thead th {
  padding: 8px 12px;
  text-align: left;
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-weight: 500;
  letter-spacing: 0.03em;
  font-size: 10pt;
}
.llv-doc tbody tr:nth-child(even) { background: #E8E4DE; }
.llv-doc tbody td {
  padding: 7px 12px;
  border-bottom: 1px solid #E8E4DE;
  vertical-align: top;
}
.llv-doc tfoot td {
  padding: 7px 12px;
  font-weight: 600;
  border-top: 2px solid #C9A96E;
}

/* ── links ───────────────────────────────────────────────────────────────────── */
.llv-doc a { color: #C9A96E; text-decoration: underline; }

/* ── footer ──────────────────────────────────────────────────────────────────── */
.llv-doc-footer {
  margin-top: 48px;
  padding-top: 12px;
  border-top: 1px solid #E8E4DE;
  font-size: 8pt;
  color: #6B6B6B;
  letter-spacing: 0.05em;
  text-align: center;
  text-transform: uppercase;
}
`

/**
 * Wraps rendered Markdown HTML in the full house document shell
 * (masthead + body + footer).  Used by both the admin preview and the Phase 3
 * PDF template.
 */
export function buildDocHtml({
  title,
  bodyHtml,
  confidential = true,
}: {
  title: string
  bodyHtml: string
  confidential?: boolean
}): string {
  return `
<div class="llv-doc">
  <div class="llv-doc-masthead">
    <div class="brand">Luxury Lifestyle Vault</div>
    <div class="tagline">Wardrobe Concierge &amp; Logistics Platform</div>
    <div class="doc-title">${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  <div class="llv-doc-body">
    ${bodyHtml}
  </div>
  ${confidential ? `<div class="llv-doc-footer">Luxury Lifestyle Vault &nbsp;·&nbsp; Confidential &amp; Proprietary</div>` : ''}
</div>
`
}

/**
 * Full standalone HTML document for Puppeteer/Gotenberg PDF rendering.
 * Embeds Google Fonts via CDN (not available from next/font in a headless context)
 * and HOUSE_CSS in a <style> block.  @page sets Letter size with zero margin so
 * the document's own padding controls the white space.
 */
export function buildPdfHtml({
  title,
  bodyHtml,
  confidential = true,
}: {
  title: string
  bodyHtml: string
  confidential?: boolean
}): string {
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const docShell = buildDocHtml({ title, bodyHtml, confidential })
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapedTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page { size: Letter; margin: 0; }
    html, body { margin: 0; padding: 0; background: #F8F4EE; }
    ${HOUSE_CSS}
  </style>
</head>
<body>
  ${docShell}
</body>
</html>`
}
