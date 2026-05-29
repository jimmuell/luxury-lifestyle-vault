import { emailLayout, h1, para, label, value, divider, ctaButton } from './layout'

const STATUS_COPY: Record<string, { heading: string; body: string }> = {
  dispatched_to_provider: {
    heading: 'Your items are on their way to our care provider.',
    body: 'We\'ve dispatched your order to our specialist care provider. They\'ll begin work shortly.',
  },
  in_preparation: {
    heading: 'Your wardrobe is being prepared.',
    body: 'Your items are currently being cleaned, pressed, and prepared to the highest standard.',
  },
  shipped: {
    heading: 'Your items are on their way to you.',
    body: 'Your order has shipped. You\'ll be able to track your shipment from your member portal.',
  },
  delivered: {
    heading: 'Your items have arrived.',
    body: 'Your order has been delivered. We hope everything arrived in perfect condition.',
  },
  return_initiated: {
    heading: 'Your return request is being processed.',
    body: 'We\'ve received your return request and will arrange collection shortly.',
  },
  return_received: {
    heading: 'We\'ve received your returned items.',
    body: 'Your items are safely back in LLV storage. Thank you.',
  },
}

export function orderStatusChangedEmail(props: {
  clientName: string
  orderId: string
  orderType: string
  status: string
  appUrl: string
  unsubscribeToken?: string
}): { subject: string; html: string; text: string } {
  const { clientName, orderId, status, appUrl, unsubscribeToken } = props
  const copy = STATUS_COPY[status] ?? {
    heading: 'Your order status has been updated.',
    body: 'Please log in to your member portal to see the latest status.',
  }
  const orderUrl = `${appUrl}/client/orders/${orderId}`
  const firstName = clientName.split(' ')[0]

  const html = emailLayout(`
    ${h1(copy.heading)}
    ${para(`${firstName}, ${copy.body}`)}
    ${divider()}
    ${label('Order')}
    ${value(orderId.substring(0, 8).toUpperCase())}
    ${label('Status')}
    ${value(status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}
    ${divider()}
    ${ctaButton('View order', orderUrl)}
  `, unsubscribeToken)

  const text = `${copy.heading}\n\n${firstName}, ${copy.body}\n\nView order: ${orderUrl}`

  return { subject: `${copy.heading} — LLV`, html, text }
}
