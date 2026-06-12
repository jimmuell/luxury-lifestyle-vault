import { emailLayout, h1, para, ctaButton, divider } from './layout'

export function investorDocumentPublishedEmail(props: {
  investorName: string
  documentTitle: string
  docType: string
  appUrl: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const { investorName, documentTitle, docType, appUrl, unsubscribeUrl } = props
  const firstName = investorName.split(' ')[0]
  const typeLabel = docType === 'presentation' ? 'presentation' : 'document'
  const roomUrl = `${appUrl}/investor`

  const html = emailLayout(`
    ${h1(`New in your LLV Investor Room, ${firstName}.`)}
    ${para(`A new ${typeLabel} has been added to your LLV Investor Room: <strong>${documentTitle}</strong>.`)}
    ${divider()}
    ${ctaButton('View in Investor Room', roomUrl)}
    <p style="text-align:center;font-size:11px;color:#9a9a8a;margin-top:32px;">
      <a href="${unsubscribeUrl}" style="color:#9a9a8a;text-decoration:underline;">Unsubscribe from document notifications</a>
      &nbsp;·&nbsp; Luxury Lifestyle Vault, LLC
    </p>
  `)

  const text = `New in your LLV Investor Room, ${firstName}.\n\nA new ${typeLabel} has been added to your LLV Investor Room: ${documentTitle}.\n\nLog in to view it at ${roomUrl}\n\nTo unsubscribe from document notifications: ${unsubscribeUrl}`

  return {
    subject: `New in your LLV Investor Room: ${documentTitle}`,
    html,
    text,
  }
}
