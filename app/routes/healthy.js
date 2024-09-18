import { StatusCodes } from 'http-status-codes'
import { AuthenticateDatabase } from '../../app/data-sources/authenticate/AuthenticateDatabase.js'
import { EntraIdApi } from '../../app/data-sources/entra-id/EntraIdApi.js'
import { RuralPaymentsBusiness } from '../../app/data-sources/rural-payments/RuralPaymentsBusiness.js'

const authenticateDatabaseHealthCheck = () => {
  const authenticateDatabase = new AuthenticateDatabase()
  return authenticateDatabase.healthCheck()
}

const ruralPaymentsAPIMHealthCheck = () => {
  const ruralPaymentsBusiness = new RuralPaymentsBusiness(null, {
    headers: {
      email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL
    }
  })
  return ruralPaymentsBusiness.getOrganisationById(process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_ID)
}

// TODO: implement health check for entra
const entraHealthCheck = () => {
  const entraIdApi = new EntraIdApi()
  return entraIdApi.getEmployeeId(process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID)
}

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

      return h.response('ok').code(StatusCodes.OK)
    } catch (error) {
      return h.response('error').code(StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
}
