import { RURALPAYMENTS_API_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { config } from '../../config.js'
import { RuralPaymentsReference } from '../../data-sources/rural-payments/RuralPaymentsReference.js'

export const healthCheck = async () => {
  try {
    const ruralPaymentsReference = new RuralPaymentsReference(
      { logger },
      { headers: { email: config.get('healthCheck.ruralPaymentsPortalEmail') } }
    )
    await ruralPaymentsReference.legalStatus()
    logger.info('Connected to rural payments')
  } catch (err) {
    logger.error('#DAL - Error connecting to rural payments', {
      error: err,
      code: RURALPAYMENTS_API_ERROR_001
    })
    throw err
  }
}
