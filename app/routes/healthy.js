import { StatusCodes } from 'http-status-codes'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { config } from '../config.js'
import { DAL_HEALTH_CHECK_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { throttle } from '../utils/throttle.js'

const minute = 60 * 1000
const fiveMinutes = 5 * minute

const ruralPaymentsHealthCheck = async () => {
  const ruralPaymentsBusiness = new RuralPaymentsBusiness(
    { logger },
    { headers: { email: config.get('healthCheck.ruralPaymentsPortalEmail') } }
  )
  return ruralPaymentsBusiness.getOrganisationById(
    config.get('healthCheck.ruralPaymentsInternalOrganisationId')
  )
}
const ruralPaymentsHealthCheckThrottled = throttle(
  ruralPaymentsHealthCheck,
  config.get('healthCheck.throttleTimeMs') || fiveMinutes
)

export const healthyRoute = {
  method: 'GET',
  path: '/healthy',
  handler: async (_request, h) => {
    try {
      const services = { RuralPaymentsPortal: 'up' }
      if (config.get('healthCheck.enabled')) {
        if (
          config.get('healthCheck.ruralPaymentsInternalOrganisationId') &&
          config.get('healthCheck.ruralPaymentsPortalEmail')
        ) {
          services.RuralPaymentsPortal = (await ruralPaymentsHealthCheckThrottled()) ? 'up' : 'down'
        } else {
          logger.error(
            '#health check - missing environment variable "HEALTH_CHECK_RP_INTERNAL_ORGANISATION_ID"',
            { code: DAL_HEALTH_CHECK_001 }
          )
        }
      } else if (config.get('cdp.env') === 'prod') {
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
