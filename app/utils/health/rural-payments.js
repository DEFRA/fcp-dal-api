import { StatusCodes } from 'http-status-codes'
import { config } from '../../config.js'
import { RURALPAYMENTS_API_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { RuralPaymentsReferenceData } from '../../data-sources/rural-payments/RuralPaymentsReferenceData.js'

const runRuralPaymentsCheck = async (type) => {
  try {
    // Rural payment requests must be initiated by a real user (external/internal) or a service-account (internal only).
    // Externally routed requests in this healthcheck will never have the credentials to successfully invoke an endpoint
    // (when auth is turned on).  The goal of the health check is to verify that the upstream is available
    // and serving responses.   A forbidden response is still a response, so the goal of the health check is either a
    // HTTP 200 or HTTP 403 (both will pass, but will be logged differently for visibility).  For the external route,
    // dummy auth credentials must be supplied (as this header is needed to drive the request to the external gateway),
    // the additional healthchek header instructs the datasource to omit the auth credentials, guaranteeing that the
    // request will fail with a 403
    const headers =
      type === 'external'
        ? { healthcheck: true, 'x-forwarded-authorization': 'healthcheck' }
        : { email: config.get('kits.dalServiceAccountEmail') }

    const ruralPaymentsReferenceData = new RuralPaymentsReferenceData(
      { logger },
      {
        request: { headers }
      }
    )
    await ruralPaymentsReferenceData.getReferenceData('legalstatus')

    // Success case when auth is not enabled
    logger.info(`SUCCESS: HTTP connection to ${type} Rural Payments upstream succeeded`)
  } catch (err) {
    if (err?.extensions?.http?.status === StatusCodes.FORBIDDEN) {
      // A 403 still means the upstream responded - it just doesn't recognise the caller.
      logger.info(
        `SUCCESS: HTTP connection to ${type} Rural Payments upstream succeeded (received expected 403 Forbidden)`
      )
      return
    }

    // Any other error is unexpected, so fail the health check
    logger.error(`#DAL - Error connecting to ${type} Rural Payments upstream`, {
      error: err,
      code: RURALPAYMENTS_API_ERROR_001
    })
    throw err
  }
}

/** Check that both internal and external Rural Payments endpoints are available */
export const healthCheck = async () => {
  await Promise.all([runRuralPaymentsCheck('internal'), runRuralPaymentsCheck('external')])
}
