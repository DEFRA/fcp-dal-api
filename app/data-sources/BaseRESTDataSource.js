import { RESTDataSource } from '@apollo/datasource-rest'
import { Unit } from 'aws-embedded-metrics'
import StatusCodes from 'http-status-codes'
import { HttpError } from '../errors/graphql.js'
import { sendMetric } from '../logger/sendMetric.js'

export class BaseRESTDataSource extends RESTDataSource {
  constructor(config, { name, code }) {
    super(config)
    this.name = name
    this.code = code
  }

  didEncounterError(error, request, url) {
    request.path = url
    if (!error) {
      error = { message: 'unknown/empty error while trying to fetch upstream data' }
    }
    let { cause, message } = error
    while (cause) {
      message += ` | Caused by ${cause.constructor.name}: ${cause.message}`
      cause = cause.cause
    }
    error.message = message

    this.logger.error(`#datasource - ${this.name} - request error`, {
      error,
      request,
      response: { ...error?.extensions?.response },
      code: this.code
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
    // Add authentication - subclasses should override addAuthentication
    this.addAuthentication(request)

    this.logger.debug(`#datasource - ${this.name} - request`, {
      request: { ...request, path: path.toString() },
      code: this.code
    })
  }

  // Subclasses should override this to add their specific authentication
  addAuthentication(_request) {
    // Default: no authentication
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
      code: this.code
    })

    this.logger.info(`#datasource - ${this.name} - response`, {
      type: 'http',
      code: this.code,
      requestTimeMs,
      request: {
        id: request.id,
        method: request.method.toUpperCase(),
        headers: request.headers,
        path: url.toString()
      },
      response: { statusCode: response?.status }
    })
    this.logger.debug(`#datasource - ${this.name} - response detail`, {
      request: { ...request, path: url.toString() },
      response: {
        ...response,
        body: result.parsedBody,
        size: Buffer.byteLength(JSON.stringify(response.body))
      },
      code: this.code,
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
