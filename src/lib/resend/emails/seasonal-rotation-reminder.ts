import { emailLayout, h1, para, label, value, divider, ctaButton } from './layout'

export function seasonalRotationReminderEmail(props: {
  clientName: string
  daysUntilTransition: number
  season: 'fall' | 'spring'
  itemCount: number
  corridorLabel: string
  appUrl: string
  unsubscribeToken?: string
}): { subject: string; html: string; text: string } {
  const { clientName, daysUntilTransition, season, itemCount, corridorLabel, appUrl, unsubscribeToken } = props
  const firstName = clientName.split(' ')[0]
  const rotationUrl = `${appUrl}/client/rotations/new`
  const seasonLabel = season === 'fall' ? 'fall/winter' : 'spring/summer'

  const html = emailLayout(`
    ${h1(`It's almost time for your ${seasonLabel} rotation, ${firstName}.`)}
    ${para(`Your ${corridorLabel} seasonal transition begins in ${daysUntilTransition} day${daysUntilTransition !== 1 ? 's' : ''}. We recommend scheduling your rotation now to ensure seamless delivery.`)}
    ${divider()}
    ${label('Items in storage')}
    ${value(String(itemCount))}
    ${label('Corridor')}
    ${value(corridorLabel)}
    ${label('Days until transition')}
    ${value(String(daysUntilTransition))}
    ${divider()}
    ${ctaButton(`Start my ${seasonLabel} rotation`, rotationUrl)}
  `, unsubscribeToken)

  const text = `It's almost time for your ${seasonLabel} rotation, ${firstName}.\n\n${corridorLabel} transition in ${daysUntilTransition} days.\nItems in storage: ${itemCount}\n\nStart your rotation: ${rotationUrl}`

  return {
    subject: `Your ${seasonLabel} rotation — ${daysUntilTransition} days until transition — LLV`,
    html,
    text,
  }
}
