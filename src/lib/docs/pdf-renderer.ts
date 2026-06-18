import { PDF_FOOTER_TEMPLATE, PDF_HEADER_TEMPLATE, PDF_MARGIN } from './house-style'

export interface PdfRenderer {
  generate(html: string): Promise<Buffer>
}

export class ChromiumRenderer implements PdfRenderer {
  async generate(html: string): Promise<Buffer> {
    const { default: Chromium } = await import('@sparticuz/chromium')
    const { default: puppeteer } = await import('puppeteer-core')

    const executablePath =
      process.env.CHROMIUM_EXECUTABLE_PATH ?? (await Chromium.executablePath())

    const browser = await puppeteer.launch({
      args: Chromium.args,
      defaultViewport: { width: 1440, height: 900 },
      executablePath,
      headless: true,
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      await page.evaluateHandle('document.fonts.ready')
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: PDF_HEADER_TEMPLATE,
        footerTemplate: PDF_FOOTER_TEMPLATE,
        margin: PDF_MARGIN,
      })
      return Buffer.from(pdf)
    } finally {
      await browser.close()
    }
  }
}

export class GotenbergRenderer implements PdfRenderer {
  private readonly url: string

  constructor(url: string) {
    this.url = url.replace(/\/$/, '')
  }

  async generate(html: string): Promise<Buffer> {
    const footerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${PDF_FOOTER_TEMPLATE}</body></html>`
    const form = new FormData()
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html')
    form.append('files', new Blob([footerHtml], { type: 'text/html' }), 'footer.html')
    form.append('marginBottom', '0.6')

    const res = await fetch(`${this.url}/forms/chromium/convert/html`, {
      method: 'POST',
      body: form,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Gotenberg error ${res.status}: ${text}`)
    }

    return Buffer.from(await res.arrayBuffer())
  }
}

export function createPdfRenderer(): PdfRenderer {
  const mode = process.env.PDF_RENDERER ?? 'chromium'
  if (mode === 'gotenberg') {
    const url = process.env.GOTENBERG_URL
    if (!url) throw new Error('GOTENBERG_URL is required when PDF_RENDERER=gotenberg')
    return new GotenbergRenderer(url)
  }
  return new ChromiumRenderer()
}
