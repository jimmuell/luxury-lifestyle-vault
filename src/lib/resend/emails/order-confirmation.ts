import { emailLayout, h1, para, label, value, divider, ctaButton } from './layout'

export function orderConfirmationEmail(props: {
  clientName: string
  orderId: string
  orderType: string
  itemCount: number
  requestedDeliveryDate: string | null
  appUrl: string
  unsubscribeToken?: string
}): { subject: string; html: string; text: string } {
  const { clientName, orderId, orderType, itemCount, requestedDeliveryDate, appUrl, unsubscribeToken } = props
  const orderUrl = `${appUrl}/client/orders/${orderId}`
  const firstName = clientName.split(' ')[0]

  const typeLabel = orderType === 'seasonal_rotation' ? 'Seasonal Rotation' : 'On-Demand Request'

  const html = emailLayout(`
    ${h1(`Your request is confirmed, ${firstName}.`)}
    ${para(`We've received your ${typeLabel} and your concierge will review it shortly. You'll hear from us once it's been scheduled.`)}
    ${divider()}
    ${label('Order type')}
    ${value(typeLabel)}
    ${label('Items')}
    ${value(String(itemCount))}
    ${requestedDeliveryDate ? `${label('Requested delivery')}${value(requestedDeliveryDate)}` : ''}
    ${divider()}
    ${para('You can track your request at any time from your member portal.')}
    ${ctaButton('View order', orderUrl)}
  `, unsubscribeToken)

  const text = `Your ${typeLabel} is confirmed, ${firstName}.\n\nOrder: ${orderId}\nItems: ${itemCount}\n${requestedDeliveryDate ? `Requested delivery: ${requestedDeliveryDate}\n` : ''}\nView order: ${orderUrl}`

  return { subject: `Your ${typeLabel} is confirmed — LLV`, html, text }
}
