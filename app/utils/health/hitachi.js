import { HitachiPayments } from '../../data-sources/hitachi/HitachiPayments.js'
import { NotFound } from '../../errors/graphql.js'
import { HITACHI_API_REQUEST_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

/**
 * Checks that the Hitachi Payments upstream is reachable and authenticating requests.
 *
 * A real request is made using a dummy FRN that is not expected to exist. A "*** FRN does not exist"
 * response still means the upstream responded and the request was authenticated, so
 * it is treated as a pass (mirroring the rural-payments health check's handling of a 403).
 */
export const healthCheck = async () => {
  try {
    const hitachiPayments = new HitachiPayments({
      logger,
      audit: {
        requestedSystem: 'dal-api-healthcheck',
        requesterId: 'dal-api-healthcheck',
        correlationId: 'healthcheck'
      }
    })

    await hitachiPayments.getSupplierPayments({
      frn: '000000000',
      userIP: '127.0.0.1',
      resourceId: 'healthcheck'
    })

    logger.info('SUCCESS: HTTP connection to Hitachi Payments upstream succeeded')
  } catch (err) {
    // NotFound is only thrown for a 200 OK response with `Result: false` in the body (i.e. the
    // upstream understood the request but the FRN does not exist) - it is a distinct class from
    // HttpError, which is thrown for any non-2xx HTTP response (e.g. a 404 from a misconfigured
    // URL). So this check will not mask a genuine connectivity/routing problem as a pass.
    if (err instanceof NotFound) {
      logger.info(
        'SUCCESS: HTTP connection to Hitachi Payments upstream succeeded (received expected not-found response)'
      )
      return
    }

    logger.error('#DAL - Error connecting to Hitachi Payments upstream', {
      error: err,
      code: HITACHI_API_REQUEST_001
    })
    throw err
  }
}
