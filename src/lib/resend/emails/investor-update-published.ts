import { emailLayout, h1, para, ctaButton, divider } from './layout'

export function investorUpdatePublishedEmail(props: {
  investorName: string
  updateTitle: string
  appUrl: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const { investorName, updateTitle, appUrl, unsubscribeUrl } = props
  const firstName = investorName.split(' ')[0]
  const updatesUrl = `${appUrl}/investor/updates`

  const html = emailLayout(`
    ${h1(`New update from LLV, ${firstName}.`)}
    ${para(`A new investor update has been posted: <strong>${updateTitle}</strong>.`)}
    ${divider()}
    ${ctaButton('Read the Update', updatesUrl)}
    <p style="text-align:center;font-size:11px;color:#9a9a8a;margin-top:32px;">
      <a href="${unsubscribeUrl}" style="color:#9a9a8a;text-decoration:underline;">Unsubscribe from update notifications</a>
      &nbsp;·&nbsp; Luxury Lifestyle Vault, LLC
    </p>
  `)

  const text = `New update from LLV, ${firstName}.\n\nA new investor update has been posted: ${updateTitle}.\n\nLog in to read it at ${updatesUrl}\n\nTo unsubscribe from update notifications: ${unsubscribeUrl}`

  return {
    subject: `New update from LLV: ${updateTitle}`,
    html,
    text,
  }
}
