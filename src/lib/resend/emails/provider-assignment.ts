import { emailLayout, h1, para, ctaButton, divider, label, value } from './layout'

export function providerAssignmentEmail(props: {
  providerName: string
  orderId: string
  appUrl: string
}): { subject: string; html: string; text: string } {
  const { providerName, orderId, appUrl } = props
  const firstName = providerName.split(' ')[0]
  const orderUrl = `${appUrl}/provider/orders/${orderId}`

  const html = emailLayout(`
    ${h1(`New assignment, ${firstName}.`)}
    ${para('A new order has been assigned to your account. Please review the details and respond at your earliest convenience.')}
    ${divider()}
    ${label('Order reference')}
    ${value(orderId.substring(0, 8).toUpperCase())}
    ${divider()}
    ${ctaButton('Review and respond', orderUrl)}
  `)

  const text = `New assignment, ${firstName}.\n\nA new order has been assigned to your account.\nOrder: ${orderId}\n\nReview: ${orderUrl}`

  return {
    subject: `New assignment — LLV`,
    html,
    text,
  }
}
