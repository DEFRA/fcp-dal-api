import { StatusCodes } from 'http-status-codes'
import { AuthenticateDatabase } from '../../app/data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../../app/data-sources/entra-id/EntraIdApi.js'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'
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
  const authenticateDatabase = new AuthenticateDatabase()
  return authenticateDatabase.healthCheck()
}, process.env.HEALTH_CHECK_AUTHENTICATE_DATABASE_THROTTLE_TIME_MS || fiveMinutes)

const ruralPaymentsAPIMHealthCheck = throttle(async () => {
  const ruralPaymentsBusiness = new RuralPaymentsBusiness(null, {
    headers: {
      email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL
    }
  })
  return ruralPaymentsBusiness.getOrganisationById(process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID)
}, process.env.HEALTH_CHECK_RURAL_PAYMENTS_APIM_THROTTLE_TIME_MS || fiveMinutes)

const entraHealthCheck = throttle(async () => {
  const entraIdApi = new EntraIdApi()
  return entraIdApi.getEmployeeId(process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID)
}, process.env.HEALTH_CHECK_ENTRA_THROTTLE_TIME_MS || fiveMinutes)

// TODO: implement health check for CRM
const crmHealthCheck = () => true

export const healthyRoute = {
  method: 'GET',
  path: '/healthy',
  handler: async (_request, h) => {
    try {
      await Promise.all([
        authenticateDatabaseHealthCheck(),
        ruralPaymentsAPIMHealthCheck(),
        entraHealthCheck(),
        crmHealthCheck()
      ])

      logger.health('Application health check')

      return h.response('ok').code(StatusCodes.OK)
    } catch (error) {
      return h.response('error').code(StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
}
