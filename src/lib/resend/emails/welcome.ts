import { emailLayout, h1, para, ctaButton } from './layout'

export function welcomeEmail(props: {
  clientName: string
  appUrl: string
}): { subject: string; html: string; text: string } {
  const { clientName, appUrl } = props
  const firstName = clientName.split(' ')[0]
  const dashboardUrl = `${appUrl}/client`

  const html = emailLayout(`
    ${h1(`Welcome to Luxury Lifestyle Vault, ${firstName}.`)}
    ${para('Your membership is active. Your concierge is ready to receive your first request.')}
    ${para('From your dashboard you can add items to your vault, schedule a pickup, and track every piece in your wardrobe.')}
    ${ctaButton('Go to my dashboard', dashboardUrl)}
  `)

  const text = `Welcome to Luxury Lifestyle Vault, ${firstName}.\n\nYour membership is active. Visit your dashboard to get started: ${dashboardUrl}`

  return {
    subject: `Welcome to Luxury Lifestyle Vault — your membership is active`,
    html,
    text,
  }
}
