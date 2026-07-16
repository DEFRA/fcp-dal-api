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

  /**
   * Converts an error into a plain object safe for logging.
   *
   * Reads `message`, `name`, and `stack` by value rather than assigning to them,
   * so errors with getter-only `message` properties (e.g. `DOMException` thrown by
   * `AbortSignal.timeout`) do not cause a `TypeError` in strict mode.
   *
   * The full cause chain is appended to `message` in the form:
   * `"<message> | Caused by <ConstructorName>: <cause.message> | ..."`.
   *
   * @param {Error|null} error
   * @returns {{ message: string, name?: string, stack?: string }}
   */
  prepareErrorForLogging(error) {
    if (error) {
      let { name, message, stack, cause } = error
      let latestCause = cause

      while (latestCause) {
        message += ` | Caused by ${latestCause.constructor.name}: ${latestCause.message}`
        latestCause = latestCause.cause
      }

      return {
        message,
        name,
        stack
      }
    } else {
      return { message: 'unknown/empty error while trying to fetch upstream data' }
    }
  }

  didEncounterError(error, request, url) {
    request.url = url

    this.logger.error(`#datasource - ${this.name} - request error`, {
      error: this.prepareErrorForLogging(error),
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
    await this.addAuthentication(request)

    // Winston stringifies log arguments before checking the configured level, so
    // this eagerly-evaluated debug call is guarded to avoid that cost when disabled.
    if (this.logger.isDebugEnabled()) {
      this.logger.debug(`#datasource - ${this.name} - request`, {
        request: { ...request, url: `${this.baseURL}${path}` },
        code: this.code
      })
    }
  }

  // Subclasses should override this to add their specific authentication
  async addAuthentication(_request) {
    // Default: no authentication
    return
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
        url: url.toString()
      },
      response
    })
    // Winston stringifies log arguments before checking the configured level, so this
    // debug call - which embeds the full parsed response body - is guarded to avoid
    // that cost (e.g. tens of MB for large organisations' geometries) when disabled.
    if (this.logger.isDebugEnabled()) {
      this.logger.debug(`#datasource - ${this.name} - response detail`, {
        request: { ...request, url: url.toString() },
        response: {
          ...response,
          body: result.parsedBody,
          size: Buffer.byteLength(JSON.stringify(result.parsedBody))
        },
        code: this.code,
        requestTimeMs
      })
    }

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
