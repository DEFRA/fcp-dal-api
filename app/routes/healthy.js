import { StatusCodes } from 'http-status-codes'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { config } from '../config.js'
import { DAL_HEALTH_CHECK_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { throttle } from '../utils/throttle.js'

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
  config.get('healthCheck.throttleTimeMs')
)

export const healthyRoute = {
  method: 'GET',
  path: '/healthy',
  handler: async (_request, h) => {
    try {
      const services = { RuralPaymentsPortal: 'up' }
      if (config.get('healthCheck.enabled')) {
        services.RuralPaymentsPortal = (await ruralPaymentsHealthCheckThrottled()) ? 'up' : 'down'
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
