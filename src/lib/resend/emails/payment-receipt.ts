import { emailLayout, h1, para, label, value, divider } from './layout'

export function paymentReceiptEmail(props: {
  clientName: string
  amountCents: number
  description: string
  invoiceId: string
  appUrl: string
}): { subject: string; html: string; text: string } {
  const { clientName, amountCents, description, invoiceId } = props
  const firstName = clientName.split(' ')[0]
  const amount = `$${(amountCents / 100).toFixed(2)}`

  const html = emailLayout(`
    ${h1(`Payment received, ${firstName}.`)}
    ${para('Thank you. This email is your receipt for the following charge.')}
    ${divider()}
    ${label('Description')}
    ${value(description)}
    ${label('Amount')}
    ${value(amount)}
    ${label('Reference')}
    ${value(invoiceId.substring(0, 12).toUpperCase())}
    ${divider()}
    ${para('Please retain this email for your records. If you have questions, contact your concierge.')}
  `)

  const text = `Payment received, ${firstName}.\n\n${description}\nAmount: ${amount}\nReference: ${invoiceId}\n\nThank you.`

  return { subject: `Payment receipt — ${amount} — LLV`, html, text }
}

export function paymentFailedEmail(props: {
  clientName: string
  amountCents: number
  description: string
  appUrl: string
}): { subject: string; html: string; text: string } {
  const { clientName, amountCents, description, appUrl } = props
  const firstName = clientName.split(' ')[0]
  const amount = `$${(amountCents / 100).toFixed(2)}`
  const billingUrl = `${appUrl}/client/settings/billing`

  const html = emailLayout(`
    ${h1(`A payment could not be processed, ${firstName}.`)}
    ${para(`We were unable to collect ${amount} for: ${description}.`)}
    ${para('Please update your payment method to continue your membership without interruption.')}
    ${divider()}
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#1a1a1a;border-radius:4px;padding:14px 28px;">
          <a href="${billingUrl}" style="color:#f0ede6;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.05em;">Update payment method</a>
        </td>
      </tr>
    </table>
  `)

  const text = `A payment could not be processed, ${firstName}.\n\nAmount: ${amount}\nDescription: ${description}\n\nUpdate your payment method: ${billingUrl}`

  return { subject: `Action required: payment could not be processed — LLV`, html, text }
}
