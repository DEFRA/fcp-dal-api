export const endUserAuthContext = (request) => {
  return {
    internalAuthHeader: request.headers.email,
    externalAuthHeader: request.headers['x-forwarded-authorization'],
    serviceAccount: request.headers['service-account']
  }
}
