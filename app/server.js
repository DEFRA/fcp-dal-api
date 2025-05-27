import hapi from '@hapi/hapi'

import { Unit } from 'aws-embedded-metrics'
import { v4 as uuidv4 } from 'uuid'
import { DAL_APPLICATION_REQUEST_001, DAL_APPLICATION_RESPONSE_001 } from './logger/codes.js'
import { logger } from './logger/logger.js'
import { sendMetric } from './logger/sendMetric.js'
import { healthRoute } from './routes/health.js'
import { healthyRoute } from './routes/healthy.js'

export const server = hapi.server({
  port: process.env.PORT
})

server.ext('onPreStart', () => {
  server.listener.setTimeout(parseInt(process.env.DAL_REQUEST_TIMEOUT_MS))
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

    logger.debug('FCP - Access log', {
      request: {
        id: request.traceId,
        method: request.method.toUpperCase(),
        path: request.path,
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

    return h.continue
  }
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
        path: request.path,
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
})
