import hapi from '@hapi/hapi'

import { Unit } from 'aws-embedded-metrics'
import { v4 as uuidv4 } from 'uuid'
import { config } from './config.js'
import {
  DAL_APPLICATION_REQUEST_001,
  DAL_APPLICATION_RESPONSE_001,
  DAL_UNHANDLED_ERROR_001
} from './logger/codes.js'
import { logger } from './logger/logger.js'
import { sendMetric } from './logger/sendMetric.js'
import { healthRoute } from './routes/health.js'
import { healthyRoute } from './routes/healthy.js'

export const server = hapi.server({
  port: config.get('port')
})

server.ext('onPreStart', () => {
  server.listener.setTimeout(config.get('requestTimeoutMs'))
})

const routes = [].concat(healthyRoute, healthRoute)
server.route(routes)

server.ext({
  type: 'onRequest',
  method: function (request, h) {
    request.transactionId =
      request.headers['x-ms-client-request-id'] ||
      request.headers['x-ms-client-tracking-id'] ||
      uuidv4()
    request.traceId = request.headers['x-cdp-request-id'] || uuidv4()

    // Winston stringifies log arguments before checking the configured level, so this
    // eagerly-evaluated debug call is guarded to avoid that cost when disabled.
    if (logger.isDebugEnabled()) {
      logger.debug('FCP - Access log', {
        request: {
          id: request.traceId,
          method: request.method.toUpperCase(),
          path: request.path,
          url: `${server.info.uri}${request.path}`,
          params: request.params,
          payload: request.payload,
          body: request.body,
          headers: request.headers,
          remoteAddress: request.info.remoteAddress
        },
        code: DAL_APPLICATION_REQUEST_001,
        transactionId: request.transactionId,
        traceId: request.traceId
      })
    }

    return h.continue
  }
})

// Hapi only prints these to raw console output by default (separate from Winston), so
// without this listener an unhandled exception in a resolver/handler produces a 500
// response with no trace in the application's own logs.
server.events.on({ name: 'request', channels: 'error' }, function (request, event) {
  logger.error('#DAL - Unhandled request error', {
    error: event.error,
    code: DAL_UNHANDLED_ERROR_001,
    transactionId: request.transactionId,
    traceId: request.traceId,
    request: {
      method: request.method?.toUpperCase(),
      path: request.path
    }
  })
})

server.events.on('response', function (request) {
  const requestTimeMs = request.info.responded - request.info.received

  if (request.path !== healthRoute.path) {
    // Only send metrics and logs for non-health check paths
    sendMetric('RequestTime', requestTimeMs, Unit.Milliseconds, {
      code: DAL_APPLICATION_REQUEST_001
    })

    logger.info('FCP - Access log', {
      type: 'http',
      code: DAL_APPLICATION_REQUEST_001,
      transactionId: request.transactionId,
      traceId: request.traceId,
      requestTimeMs,
      request: {
        id: request.traceId,
        method: request.method.toUpperCase(),
        url: `${server.info.uri}${request.path}`,
        params: request.params,
        payload: request.payload,
        body: request.body,
        headers: request.headers,
        remoteAddress: request.info.remoteAddress
      },
      response: {
        statusCode: request.response.statusCode
      }
    })
  }

  // Winston stringifies log arguments before checking the configured level, so this
  // debug call - which embeds the full response body - is guarded to avoid that cost
  // (e.g. tens of MB for large GraphQL responses) when disabled.
  if (logger.isDebugEnabled()) {
    logger.debug('FCP - Response log', {
      response: {
        statusCode: request.response.statusCode,
        headers: request.response.headers,
        body: request.response.source
      },
      requestTimeMs,
      transactionId: request.transactionId,
      traceId: request.traceId,
      code: DAL_APPLICATION_RESPONSE_001
    })
  }
})
