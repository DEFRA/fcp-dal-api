import { StatusCodes } from 'http-status-codes'
import { AuthenticateDatabase } from '../../app/data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../../app/data-sources/entra-id/EntraIdApi.js'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
import { DAL_HEALTH_CHECK_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'

const minute = 60 * 1000
const fiveMinutes = 5 * minute

// Throttle health checks to prevent them from being called too frequently
const throttle = (fn, time) => {
  let shouldThrottle = false
  return (...args) => {
    if (!shouldThrottle) {
      shouldThrottle = true
      setTimeout(() => {
        shouldThrottle = false
      }, time)
      return fn(...args)
    } else {
      return true
    }
  }
}

const authenticateDatabaseHealthCheck = throttle(async () => {
  const authenticateDatabase = new AuthenticateDatabase({ logger })
  return authenticateDatabase.healthCheck()
}, process.env.HEALTH_CHECK_AUTHENTICATE_DATABASE_THROTTLE_TIME_MS || fiveMinutes)

const ruralPaymentsAPIMHealthCheck = throttle(async () => {
  const ruralPaymentsBusiness = new RuralPaymentsBusiness({ logger }, {
    headers: {
      email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL
    }
  })
  return ruralPaymentsBusiness.getOrganisationById(process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID)
}, process.env.HEALTH_CHECK_RURAL_PAYMENTS_APIM_THROTTLE_TIME_MS || fiveMinutes)

const entraHealthCheck = throttle(async () => {
  const entraIdApi = new EntraIdApi({ logger })
  return entraIdApi.getEmployeeId(process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID)
}, process.env.HEALTH_CHECK_ENTRA_THROTTLE_TIME_MS || fiveMinutes)

export const healthyRoute = {
  method: 'GET',
  path: '/healthy',
  handler: async (_request, h) => {
    try {
      if (process.env.HEALTH_CHECK_ENABLED === 'true') {
        const healthChecks = []

        if (process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID?.length) {
          healthChecks.push(ruralPaymentsAPIMHealthCheck())
        } else {
          logger.error('#health check - missing environment variable "RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID"', { code: DAL_HEALTH_CHECK_001 })
        }

        if (process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID?.length) {
          healthChecks.push(entraHealthCheck())
        } else {
          logger.error('#health check - missing environment variable "ENTRA_HEALTH_CHECK_USER_OBJECT_ID"', { code: DAL_HEALTH_CHECK_001 })
        }

        if (
          process.env.AUTHENTICATE_DB_USERNAME?.length &&
          process.env.AUTHENTICATE_DB_PASSWORD?.length &&
          process.env.AUTHENTICATE_DB_USERNAME_AUDIT_WRITE?.length &&
          process.env.AUTHENTICATE_DB_PASSWORD_AUDIT_WRITE?.length
        ) {
          healthChecks.push(authenticateDatabaseHealthCheck())
        } else {
          logger.error('#health check - missing one or all environment variables "AUTHENTICATE_DB_USERNAME","AUTHENTICATE_DB_PASSWORD","AUTHENTICATE_DB_USERNAME_AUDIT_WRITE","AUTHENTICATE_DB_PASSWORD_AUDIT_WRITE"', { code: DAL_HEALTH_CHECK_001 })
        }

        await Promise.all(healthChecks)
      } else if (process.env.ENVIRONMENT === 'prd1') {
        logger.error('#health check - health check disabled', { code: DAL_HEALTH_CHECK_001 })
      } else {
        logger.warn('#health check - health check disabled', { code: DAL_HEALTH_CHECK_001 })
      }

      return h.response('ok').code(StatusCodes.OK)
    } catch (error) {
      return h.response('error').code(StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
}
