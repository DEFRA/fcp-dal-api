import { RESTDataSource } from '@apollo/datasource-rest'
import { Unit } from 'aws-embedded-metrics'
import StatusCodes from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { config as appConfig } from '../../config.js'
import { BadRequest, HttpError, NotFound } from '../../errors/graphql.js'
import {
  RURALPAYMENTS_API_NOT_FOUND_001,
  RURALPAYMENTS_API_REQUEST_001
} from '../../logger/codes.js'
import { sendMetric } from '../../logger/sendMetric.js'
import { httpsProxyFetch } from '../../utils/https-proxy-fetch.js'

const internalRequestTls = generateRequestTls('internal')
const externalRequestTls = generateRequestTls('external')
const internalGatewayUrl = appConfig.get('kits.internal.gatewayUrl')
const externalGatewayUrl = appConfig.get('kits.external.gatewayUrl')

export function generateRequestTls(gatewayType) {
  if (!appConfig.get('kits.disableMTLS')) {
    const connectionCert = appConfig.get(`kits.${gatewayType}.connectionCert`)
    const connectionKey = appConfig.get(`kits.${gatewayType}.connectionKey`)
    const decodedCert = Buffer.from(connectionCert, 'base64').toString('utf-8').trim()
    const decodedKey = Buffer.from(connectionKey, 'base64').toString('utf-8').trim()
    return {
      key: decodedKey,
      cert: decodedCert
    }
  }
}

export function extractCrnFromDefraIdToken(token) {
  const { payload } = jwt.decode(token, { complete: true })
  if (payload?.contactId) {
    return payload.contactId
  }
  throw new BadRequest('Defra ID token does not contain crn')
}

export class RuralPayments extends RESTDataSource {
  // Note this gets overridden by the customFetch
  request = null
  constructor(config, { request, gatewayType, internalGatewayDevOverrideEmail }) {
    super(config)
    this.request = request

    this.gatewayType = gatewayType || 'internal'
    if (!['internal', 'external'].includes(this.gatewayType)) {
      throw new BadRequest(
        `gateway-type header must be one of internal or external received: ${gatewayType}`
      )
    }

    this.internalGatewayDevOverrideEmail = internalGatewayDevOverrideEmail
    this.baseURL = this.gatewayType === 'external' ? externalGatewayUrl : internalGatewayUrl
    const requestTls = gatewayType === 'internal' ? internalRequestTls : externalRequestTls

    this.httpCache.httpFetch = (url, options) => {
      const signal = AbortSignal.timeout(appConfig.get('kits.gatewayTimeoutMs'))
      if (appConfig.get('kits.disableMTLS')) {
        // for local dev, and CDP dev env (with auto-proxy)
        // NOTE: requires NODE_USE_ENV_PROXY=1 node switch for auto-proxy from env vars
        return fetch(url, { ...options, signal })
      } else {
        // full prod mode with mTLS and proxy
        return httpsProxyFetch(url, { ...options, signal, ...requestTls })
      }
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
        path: url.toString(),
        body: request.body
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

  async getTitles() {
    const response = await this.get('reference/titles')

    if (!response?._data?.length) {
      const { gatewayType, request } = this
      this.logger.warn(`#datasource - Rural payments - titles reference data not found`, {
        code: RURALPAYMENTS_API_NOT_FOUND_001,
        response: { body: response },
        gatewayType,
        request
      })
      throw new NotFound('Rural payments titles reference data not found')
    }

    return response._data
  }
}
