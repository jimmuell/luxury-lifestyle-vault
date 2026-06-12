export const dynamic = 'force-dynamic'

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { categorizeItemPhoto } from '@/lib/inngest/functions/categorize-photo'
import { createStripeCustomer } from '@/lib/inngest/functions/create-stripe-customer'
import { sendEmailFunction } from '@/lib/inngest/functions/send-email'
import { notifyProviderAssignment } from '@/lib/inngest/functions/notify-provider-assignment'
import { billOnDemandOrder } from '@/lib/inngest/functions/bill-on-demand-order'
import { seasonalRotationReminders } from '@/lib/inngest/functions/seasonal-rotation-reminders'
import { notifyInvestorDocument } from '@/lib/inngest/functions/notify-investor-document'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    categorizeItemPhoto,
    createStripeCustomer,
    sendEmailFunction,
    notifyProviderAssignment,
    billOnDemandOrder,
    seasonalRotationReminders,
    notifyInvestorDocument,
  ],
})
