import { StatusCodes } from 'http-status-codes'
import { AuthenticateDatabase } from '../../app/data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../../app/data-sources/entra-id/EntraIdApi.js'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { DAL_HEALTH_CHECK_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { throttle } from '../utils/throttle.js'

const minute = 60 * 1000
const fiveMinutes = 5 * minute

const authenticateDatabaseHealthCheck = async () => {
  const authenticateDatabase = new AuthenticateDatabase({ logger })
  return authenticateDatabase.healthCheck()
}
const authenticateDatabaseHealthCheckThrottled = throttle(authenticateDatabaseHealthCheck, process.env.HEALTH_CHECK_AUTHENTICATE_DATABASE_THROTTLE_TIME_MS || fiveMinutes)

const ruralPaymentsAPIMHealthCheck = async () => {
  const ruralPaymentsBusiness = new RuralPaymentsBusiness({ logger }, {
    headers: { email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL }
  })
  return ruralPaymentsBusiness.getOrganisationById(process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID)
}
const ruralPaymentsAPIMHealthCheckThrottled = throttle(ruralPaymentsAPIMHealthCheck, process.env.HEALTH_CHECK_RURAL_PAYMENTS_APIM_THROTTLE_TIME_MS || fiveMinutes)

const entraHealthCheck = async () => {
  const entraIdApi = new EntraIdApi({ logger })
  return entraIdApi.getEmployeeId(process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID)
}
const entraHealthCheckThrottled = throttle(entraHealthCheck, process.env.HEALTH_CHECK_ENTRA_THROTTLE_TIME_MS || fiveMinutes)

export const healthyRoute = {
  method: 'GET',
  path: '/healthy',
  handler: async (_request, h) => {
    try {
      const services = {
        RuralPaymentsPortal: 'up',
        AuthenticateDatabase: 'up',
        Entra: 'up'
      }
      if (process.env.HEALTH_CHECK_ENABLED === 'true') {
        if (process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID && process.env.RURAL_PAYMENTS_PORTAL_EMAIL) {
          services.RuralPaymentsPortal = await ruralPaymentsAPIMHealthCheckThrottled() ? 'up' : 'down'
        } else {
          logger.error('#health check - missing environment variable "RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID"', { code: DAL_HEALTH_CHECK_001 })
        }

        if (process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID) {
          services.Entra = await entraHealthCheckThrottled() ? 'up' : 'down'
        } else {
          logger.error('#health check - missing environment variable "ENTRA_HEALTH_CHECK_USER_OBJECT_ID"', { code: DAL_HEALTH_CHECK_001 })
        }

        if (
          process.env.AUTHENTICATE_DB_USERNAME &&
          process.env.AUTHENTICATE_DB_PASSWORD &&
          process.env.AUTHENTICATE_DB_USERNAME_AUDIT_WRITE &&
          process.env.AUTHENTICATE_DB_PASSWORD_AUDIT_WRITE
        ) {
          services.AuthenticateDatabase = await authenticateDatabaseHealthCheckThrottled() ? 'up' : 'down'
        } else {
          logger.error('#health check - missing one or all environment variables "AUTHENTICATE_DB_USERNAME","AUTHENTICATE_DB_PASSWORD","AUTHENTICATE_DB_USERNAME_AUDIT_WRITE","AUTHENTICATE_DB_PASSWORD_AUDIT_WRITE"', { code: DAL_HEALTH_CHECK_001 })
        }
      } else if (process.env.ENVIRONMENT === 'prd1') {
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
