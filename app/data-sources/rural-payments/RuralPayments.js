import { StatusCodes } from 'http-status-codes'
import tls from 'node:tls'
import { EnvHttpProxyAgent, fetch as fetch11 } from 'undici'
import { config as appConfig } from '../../config.js'
import { HttpError } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_REQUEST_001 } from '../../logger/codes.js'
import { BaseRESTDataSource } from '../BaseRESTDataSource.js'
import { endUserAuthContext } from '../../auth/end-user-auth-context.js'

const internalGatewayUrl = appConfig.get('kits.internal.gatewayUrl')
const externalGatewayUrl = appConfig.get('kits.external.gatewayUrl')

// The SitiAgri byFunction endpoints scope function-level authorisation to a consuming module.
// CUST_SS_PORTAL is the customer self-service portal (the external Rural Payments service) - the
// module users act through, and therefore the permission set permittedFunctions reports on.
// Note the upstream does not validate the value; an unrecognised module just returns false for
// every requested function.
export const SELF_SERVICE_PORTAL_MODULE = 'CUST_SS_PORTAL'

export class RuralPayments extends BaseRESTDataSource {
  // Note this gets overridden by the customFetch
  request = null
  constructor(config, { request, defraIdContext }) {
    super(config, {
      name: 'Rural payments',
      code: RURALPAYMENTS_API_REQUEST_001
    })

    this.endUserAuthContext = endUserAuthContext(request)
    this.initialiseRequest(request)
    this.defraIdContext = defraIdContext

    if (appConfig.get('kits.disableMTLS')) {
      this.httpCache.httpFetch = (url, options = {}) =>
        // no mTLS: use normal fetch with auto-proxy support
        fetch(url, {
          ...options,
          signal: AbortSignal.timeout(appConfig.get('kits.gatewayTimeoutMs'))
        })
    } else {
      // set up mTLS config
      const kitsURL = new URL(this.baseURL)
      const requestTls = {
        host: kitsURL.hostname,
        port: kitsURL.port,
        servername: kitsURL.hostname
      }
      requestTls.secureContext = this.createSecureContext()

      this.httpCache.httpFetch = (url, options = {}) =>
        // use undici fetch which supports mTLS & env proxy via agent
        fetch11(url, {
          ...options,
          dispatcher: new EnvHttpProxyAgent({ requestTls }),
          signal: AbortSignal.timeout(appConfig.get('kits.gatewayTimeoutMs'))
        })
    }
  }

  async addAuthentication(request) {
    const headers = this.request.headers

    if (headers.healthcheck) {
      // Health check calls intentionally carry no user credentials. Sending the request
      // unauthenticated still proves the upstream is reachable, typically via a 403 response.
      return
    }

    if (!this.gatewayRoute) {
      // No routing header was present when this datasource was constructed.  An upstream call will not be possible
      throw new HttpError(StatusCodes.UNPROCESSABLE_ENTITY, {
        extensions: {
          message:
            'Invalid request headers, must be either "email: {valid user email}", "service-account: {valid service account email}" or "X-Forwarded-Authorization: {defra-id token}" headers'
        }
      })
    }

    const additionalHeaders = {}

    const internalEmail =
      this.endUserAuthContext.internalAuthHeader || this.endUserAuthContext.serviceAccount

    // Note: these headers won't be logged. See https://portal.cdp-int.defra.cloud/documentation/how-to/logging.md
    if (internalEmail) {
      additionalHeaders.email = internalEmail
    } else {
      additionalHeaders.Authorization = this.endUserAuthContext.externalAuthHeader
      additionalHeaders.crn = this.defraIdContext.crn()
    }

    request.headers = {
      ...request.headers,
      ...additionalHeaders
    }
  }

  isExternalRoute() {
    return this.gatewayRoute === 'external'
  }

  getBaseURL() {
    return this.isExternalRoute() ? externalGatewayUrl : internalGatewayUrl
  }

  createSecureContext() {
    return tls.createSecureContext(
      this.isExternalRoute() ? appConfig.externalMTLS : appConfig.internalMTLS
    )
  }

  initialiseRequest(request) {
    this.request = request

    let authType
    if (this.endUserAuthContext.internalAuthHeader) {
      this.gatewayRoute = 'internal'
      authType = 'internal'
    } else if (
      this.endUserAuthContext.serviceAccount &&
      this.endUserAuthContext.externalAuthHeader
    ) {
      // Service account supplied alongside the caller's own external auth header - this is an
      // otherwise-external request that the DAL service account is taking over routing for.
      this.gatewayRoute = 'internal'
      authType = 'dal-service-account'
    } else if (this.endUserAuthContext.serviceAccount) {
      // Consumer has supplied a service account email vis the service-account header
      this.gatewayRoute = 'internal'
      authType = 'client-service-account'
    } else if (this.endUserAuthContext.externalAuthHeader) {
      this.gatewayRoute = 'external'
      authType = 'external'
    } else {
      // No routing header present. Upstream calls will not be possible, but this data source is constructed even
      // for introspection queries - these do not require upstream calls.   Deferring any failures until auth is
      // actually needed
      authType = 'no-auth'
    }

    this.gatewayType = `rural-payments-${authType}`
    this.baseURL = this.getBaseURL()
  }
}
