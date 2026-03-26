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
  constructor(config, { request, gatewayType, internalGatewayDevOverrideEmail }) {
    super(config, { name: 'Rural payments', code: RURALPAYMENTS_API_REQUEST_001 })
    this.request = request

    this.gatewayType = gatewayType || 'internal'
    if (!['internal', 'external'].includes(this.gatewayType)) {
      throw new BadRequest(
        `gateway-type header must be one of internal or external received: ${gatewayType}`
      )
    }

    this.internalGatewayDevOverrideEmail = internalGatewayDevOverrideEmail
    this.baseURL = this.gatewayType === 'external' ? externalGatewayUrl : internalGatewayUrl

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
      requestTls.secureContext = tls.createSecureContext(
        this.gatewayType === 'external' ? appConfig.externalMTLS : appConfig.internalMTLS
      )
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
    const additionalHeaders = {}

    if (this.gatewayType === 'internal' && this.internalGatewayDevOverrideEmail) {
      additionalHeaders.email = this.internalGatewayDevOverrideEmail
    } else if (this.gatewayType === 'internal' && headers.email) {
      additionalHeaders.email = headers.email
    } else if (this.gatewayType === 'external' && headers['x-forwarded-authorization']) {
      additionalHeaders.Authorization = headers['x-forwarded-authorization']
      additionalHeaders.crn = extractCrnFromDefraIdToken(headers['x-forwarded-authorization'])
    } else {
      throw new HttpError(StatusCodes.UNPROCESSABLE_ENTITY, {
        extensions: {
          message:
            'Invalid request headers, must be either "email: {valid user email}" or "X-Forwarded-Authorization: {defra-id token}" & "gateway-type: external" headers'
        }
      })
    }

    request.headers = {
      ...request.headers,
      ...additionalHeaders
    }
  }
}
