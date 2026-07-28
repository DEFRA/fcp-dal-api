import { StatusCodes } from 'http-status-codes'
import { config } from '../../config.js'
import { RURALPAYMENTS_API_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'
import { RuralPaymentsReferenceData } from '../../data-sources/rural-payments/RuralPaymentsReferenceData.js'

const runRuralPaymentsCheck = async (type) => {
  try {
    // Rural payment requests must be initiated by a real user, so health check calls will never have the necessary
    // credentials to successfully invoke an endpoint (when auth is turned on).  The goal of the health check is to
    // verify that the upstream is available and serving responses.   A forbidden response is still a response, so
    // the goal of the health check is a 200 when auth is disabled, or a 403 when auth is enabled.  The 'healthcheck'
    // header instructs the datasource to submit the request without setting real credentials, even without
    // authorisation. gatewayType is now derived from request headers rather than an explicit option, so each check
    // carries just enough of a signal to route to the gateway it's meant to test: the internal check identifies
    // itself with the DAL service-account header, the external check with a placeholder x-forwarded-authorization
    // header (its value is never decoded, since the 'healthcheck' header short-circuits addAuthentication first).
    const headers =
      type === 'external'
        ? { healthcheck: true, 'x-forwarded-authorization': 'healthcheck' }
        : { healthcheck: true, 'service-account': config.get('kits.dalServiceAccountEmail') }

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
