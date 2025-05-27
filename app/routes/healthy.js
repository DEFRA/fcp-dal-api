import { StatusCodes } from 'http-status-codes'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { DAL_HEALTH_CHECK_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { throttle } from '../utils/throttle.js'

const minute = 60 * 1000
const fiveMinutes = 5 * minute

const ruralPaymentsHealthCheck = async () => {
  const ruralPaymentsBusiness = new RuralPaymentsBusiness(
    { logger },
    { headers: { email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL } }
  )
  return ruralPaymentsBusiness.getOrganisationById(
    process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID
  )
}
const ruralPaymentsHealthCheckThrottled = throttle(
  ruralPaymentsHealthCheck,
  process.env.HEALTH_CHECK_RURAL_PAYMENTS_THROTTLE_TIME_MS || fiveMinutes
)

export const healthyRoute = {
  method: 'GET',
  path: '/healthy',
  handler: async (_request, h) => {
    try {
      const services = { RuralPaymentsPortal: 'up' }
      if (process.env.HEALTH_CHECK_ENABLED === 'true') {
        if (
          process.env.HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID &&
          process.env.RURAL_PAYMENTS_PORTAL_EMAIL
        ) {
          services.RuralPaymentsPortal = (await ruralPaymentsHealthCheckThrottled()) ? 'up' : 'down'
        } else {
          logger.error(
            '#health check - missing environment variable "HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID"',
            { code: DAL_HEALTH_CHECK_001 }
          )
        }
      } else if (process.env.ENVIRONMENT === 'prod') {
        logger.error('#health check - health check disabled', { code: DAL_HEALTH_CHECK_001 })
      } else {
        logger.warn('#health check - health check disabled', { code: DAL_HEALTH_CHECK_001 })
      }

      return h.response(services).code(StatusCodes.OK)
    } catch (error) {
      return h.response('error').code(StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
}
