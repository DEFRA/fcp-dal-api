import { Unauthorized } from '../errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'

export const endUserAuthContext = (request) => {
  const emailHeader = request.headers.email

  if (emailHeader?.toLowerCase().includes('robot-account.')) {
    throw new Unauthorized('Service accounts must not use email header')
  }

  const serviceAccountHeader = request.headers['service-account']

  if (emailHeader && serviceAccountHeader) {
    throw new Unauthorized('Cannot supply both email and service-account headers')
  }

  const externalAuthHeader = request.headers['x-forwarded-authorization']

  // Note: this does not flag externalAuthHeader alongside serviceAccountHeader - the DAL itself
  // legitimately injects a service-account header onto an already-external request to take over
  // routing (see the dal-service-account authType in RuralPayments.js), so that combination is
  // expected and not logged here.
  if (externalAuthHeader && emailHeader) {
    logger.error('#DAL - Request authentication - conflicting auth headers', {
      code: DAL_REQUEST_AUTHENTICATION_001,
      message: 'Both email and x-forwarded-authorization headers were supplied on the same request'
    })
  }

  return {
    upstreamEmailHeader: emailHeader || serviceAccountHeader,
    internalAuthHeader: emailHeader,
    externalAuthHeader,
    serviceAccount: serviceAccountHeader
  }
}
