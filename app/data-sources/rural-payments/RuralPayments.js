import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import tls from 'node:tls'
import { EnvHttpProxyAgent, fetch as fetch11 } from 'undici'
import { config as appConfig } from '../../config.js'
import { BadRequest, HttpError } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_REQUEST_001 } from '../../logger/codes.js'
import { BaseRESTDataSource } from '../BaseRESTDataSource.js'

const internalGatewayUrl = appConfig.get('kits.internal.gatewayUrl')
const externalGatewayUrl = appConfig.get('kits.external.gatewayUrl')

export function extractCrnFromDefraIdToken(token) {
  const { payload } = jwt.decode(token, { complete: true })
  if (payload?.contactId) {
    return payload.contactId
  }
  throw new BadRequest('Defra ID token does not contain crn')
}

export class RuralPayments extends BaseRESTDataSource {
  // Note this gets overridden by the customFetch
  request = null
  constructor(config, { request }) {
    super(config, {
      name: 'Rural payments',
      code: RURALPAYMENTS_API_REQUEST_001
    })

    this.initialiseRequest(request)

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

    const additionalHeaders = {}

    const internalEmail = this.authContext.internalAuthHeader || this.authContext.serviceAccount

    // Note: these headers won't be logged. See https://portal.cdp-int.defra.cloud/documentation/how-to/logging.md
    if (internalEmail) {
      additionalHeaders.email = internalEmail
    } else {
      additionalHeaders.Authorization = headers['x-forwarded-authorization']
      additionalHeaders.crn = extractCrnFromDefraIdToken(headers['x-forwarded-authorization'])
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
    this.authContext = {
      internalAuthHeader: this.request.headers.email,
      externalAuthHeader: this.request.headers['x-forwarded-authorization'],
      serviceAccount: this.request.headers['service-account']
    }

    let authType
    if (this.authContext.internalAuthHeader) {
      this.gatewayRoute = 'internal'
      authType = 'internal'
    } else if (this.authContext.serviceAccount && this.authContext.externalAuthHeader) {
      // Service account supplied alongside the caller's own external auth header - this is an
      // otherwise-external request that the DAL service account is taking over routing for.
      this.gatewayRoute = 'internal'
      authType = 'dal-service-account'
    } else if (this.authContext.serviceAccount) {
      // Consumer has supplied a service account email vis the service-account header
      this.gatewayRoute = 'internal'
      authType = 'client-service-account'
    } else if (this.authContext.externalAuthHeader) {
      this.gatewayRoute = 'external'
      authType = 'external'
    } else {
      throw new HttpError(StatusCodes.UNPROCESSABLE_ENTITY, {
        extensions: {
          message:
            'Invalid request headers, must be either "email: {valid user email}", "service-account: {valid service account email}" or "X-Forwarded-Authorization: {defra-id token}" headers'
        }
      })
    }

    this.gatewayType = `rural-payments-${authType}`
    this.baseURL = this.getBaseURL()
  }
}
