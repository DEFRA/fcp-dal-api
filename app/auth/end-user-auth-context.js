import { Unauthorized } from '../errors/graphql.js'

export const endUserAuthContext = (request) => {
  const emailHeader = request.headers.email

  if (emailHeader?.toLowerCase().includes('robot-account.')) {
    throw new Unauthorized('Service accounts must not use email header')
  }

  return {
    internalAuthHeader: emailHeader,
    externalAuthHeader: request.headers['x-forwarded-authorization'],
    serviceAccount: request.headers['service-account']
  }
}
