import { inngest } from '@/lib/inngest/client'
import { sendEmail, type EmailTemplate } from '@/lib/resend/send'

type SendEmailEventData = {
  recipientProfileId: string | null
  to: string
  template: EmailTemplate
  subject: string
  html: string
  text: string
}

export const sendEmailFunction = inngest.createFunction(
  {
    id: 'send-email',
    triggers: [{ event: 'email/send' as never }],
    retries: 3,
  },
  async ({ event }: { event: { data: SendEmailEventData } }) => {
    await sendEmail(event.data)
  }
)
