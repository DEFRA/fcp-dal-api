import { RESTDataSource } from '@apollo/datasource-rest'
import { Unit } from 'aws-embedded-metrics'
import StatusCodes from 'http-status-codes'
import jwt from 'jsonwebtoken'
import tls from 'node:tls'
import { Agent, ProxyAgent } from 'undici'
import { config as appConfig } from '../../config.js'
import { BadRequest, HttpError } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_REQUEST_001 } from '../../logger/codes.js'
import { sendMetric } from '../../logger/sendMetric.js'

const internalRequestTls = generateRequestTls('internal')
const externalRequestTls = generateRequestTls('external')
const internalGatewayUrl = appConfig.get('kits.internal.gatewayUrl')
const externalGatewayUrl = appConfig.get('kits.external.gatewayUrl')

export function generateRequestTls(gatewayType) {
  const gatewayUrl = appConfig.get(`kits.${gatewayType}.gatewayUrl`)
  const kitsURL = new URL(gatewayUrl)
  const requestTls = {
    host: kitsURL.hostname,
    port: kitsURL.port,
    servername: kitsURL.hostname
  }

  if (!appConfig.get('kits.disableMTLS')) {
    const connectionCert = appConfig.get(`kits.${gatewayType}.connectionCert`)
    const connectionKey = appConfig.get(`kits.${gatewayType}.connectionKey`)
    const decodedCert = Buffer.from(connectionCert, 'base64').toString('utf-8').trim()
    const decodedKey = Buffer.from(connectionKey, 'base64').toString('utf-8').trim()
    requestTls.secureContext = tls.createSecureContext({
      key: decodedKey,
      cert: decodedCert
    })
  }

  return requestTls
}

export function extractCrnFromDefraIdToken(token) {
  const { payload } = jwt.decode(token, { complete: true })
  if (payload?.contactId) {
    return payload.contactId
  }
  throw new BadRequest('Defra ID token does not contain crn')
}

export async function customFetch(url, options, requestTls) {
  if (appConfig.get('disableProxy')) {
    options.dispatcher = new Agent({
      requestTls
    })
  } else {
    options.dispatcher = new ProxyAgent({
      uri: appConfig.get('cdp.httpsProxy'),
      requestTls
    })
  }

  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(appConfig.get('kits.gatewayTimeoutMs'))
  })
}

export class RuralPayments extends RESTDataSource {
  // Note this gets overridden by the customFetch
  request = null
  constructor(config, { request, gatewayType }) {
    super(config)
    this.request = request

    this.gatewayType = gatewayType || 'internal'
    if (!['internal', 'external'].includes(this.gatewayType)) {
      throw new BadRequest(
        `gateway-type header must be one of internal or external received: ${gatewayType}`
      )
    }

    this.baseURL = this.gatewayType === 'external' ? externalGatewayUrl : internalGatewayUrl
    const requestTls = this.gatewayType === 'external' ? externalRequestTls : internalRequestTls

    this.httpCache.httpFetch = (url, options) => {
      return customFetch(url, options, requestTls)
    }
  }

  didEncounterError(error, request, url) {
    request.path = url

    this.logger.error('#datasource - Rural payments - request error', {
      error,
      request,
      response: { ...error?.extensions?.response },
      code: RURALPAYMENTS_API_REQUEST_001
    })
  }

  async throwIfResponseIsError(options) {
    if (options.response?.ok) {
      return
    }

    const extensions = {
      ...options,
      response: {
        status: options.response?.status,
        headers: options.response?.headers,
        body: options.parsedBody
      }
    }

    throw new HttpError(options.response?.status, {
      extensions
    })
  }

  async willSendRequest(path, request) {
    const headers = this.request.headers
    const additionalHeaders = {}
    if (this.gatewayType === 'internal' && headers.email) {
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

    this.logger.debug('#datasource - Rural payments - request', {
      request: { ...request, path: path.toString() },
      code: RURALPAYMENTS_API_REQUEST_001
    })
  }

  // override trace function to avoid unnecessary logging
  async trace(url, request, fn) {
    const requestStart = Date.now()
    const result = await fn()
    const requestTimeMs = Date.now() - requestStart

    const response = {
      status: result.response?.status,
      headers: result.response?.headers,
      body: result.response?.body
    }

    sendMetric('RequestTime', requestTimeMs, Unit.Milliseconds, {
      code: RURALPAYMENTS_API_REQUEST_001
    })

    this.logger.info('#datasource - Rural payments - response', {
      type: 'http',
      code: RURALPAYMENTS_API_REQUEST_001,
      requestTimeMs,
      request: {
        id: request.id,
        method: request.method.toUpperCase(),
        headers: request.headers,
        path: url.toString()
      },
      response: { statusCode: response?.status }
    })
    this.logger.debug('#datasource - Rural payments - response detail', {
      request: { ...request, path: url.toString() },
      response: {
        ...response,
        body: result.parsedBody,
        size: Buffer.byteLength(JSON.stringify(response.body))
      },
      code: RURALPAYMENTS_API_REQUEST_001,
      requestTimeMs
    })

    return result
  }

  // ensure that the same request is not sent twice
  requestDeduplicationPolicyFor(url, request) {
    const method = request.method ?? 'GET'
    const cacheKey = this.cacheKeyFor(url, request)
    const requestId = request.id
    return {
      policy: 'deduplicate-during-request-lifetime',
      deduplicationKey: `${requestId} ${method} ${cacheKey}`
    }
  }

  parseBody(response) {
    const contentType = response.headers.get('Content-Type')
    const contentLength = response.headers.get('Content-Length')
    if (response.status === StatusCodes.NO_CONTENT) {
      return { status: StatusCodes.NO_CONTENT }
    } else if (
      contentLength !== '0' &&
      contentType &&
      (contentType.startsWith('application/json') || contentType.endsWith('+json'))
    ) {
      return response.json()
    } else {
      return response.text()
    }
  }
}
