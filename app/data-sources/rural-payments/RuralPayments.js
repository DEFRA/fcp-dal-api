import { RESTDataSource } from '@apollo/datasource-rest'
import { Unit } from 'aws-embedded-metrics'
import StatusCodes from 'http-status-codes'
import tls from 'node:tls'
import { ProxyAgent } from 'undici'
import { HttpError } from '../../errors/graphql.js'
import { RURALPAYMENTS_API_REQUEST_001 } from '../../logger/codes.js'
import { sendMetric } from '../../logger/sendMetric.js'

export const customFetch = async (url, options) => {
  const clientCert = Buffer.from(process.env.KITS_CONNECTION_CERT, 'base64')
    .toString('utf-8')
    .trim()
  const clientKey = Buffer.from(process.env.KITS_CONNECTION_KEY, 'base64').toString('utf-8').trim()

  const kitsURL = new URL(process.env.RP_KITS_GATEWAY_INTERNAL_URL)

  const requestTls = {
    host: kitsURL.hostname,
    port: kitsURL.port,
    servername: kitsURL.hostname,
    secureContext: tls.createSecureContext({
      key: clientKey,
      cert: clientCert
    })
  }

  const proxyAgent = new ProxyAgent({
    uri: process.env.CDP_HTTPS_PROXY,
    requestTls
  })

  return fetch(url, {
    ...options,
    dispatcher: proxyAgent,
    signal: AbortSignal.timeout(parseInt(process.env.RP_KITS_GATEWAY_TIMEOUT_MS))
  })
}
export class RuralPayments extends RESTDataSource {
  baseURL = process.env.RP_KITS_GATEWAY_INTERNAL_URL
  request = null

  constructor(config, request) {
    super(config)

    this.request = request
    if (
      process.env.KITS_CONNECTION_CERT &&
      process.env.KITS_CONNECTION_KEY &&
      process.env.CDP_HTTPS_PROXY
    ) {
      this.httpCache.httpFetch = customFetch
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
        status: options.response.status,
        headers: options.response.headers,
        body: options.parsedBody
      }
    }

    throw new HttpError(options.response.status, {
      extensions
    })
  }

  async willSendRequest(path, request) {
    request.headers = {
      ...request.headers,
      email: this.request.headers.email
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
