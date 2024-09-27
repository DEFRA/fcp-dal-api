import hapi from '@hapi/hapi'

import { v4 as uuidv4 } from 'uuid'
import { setupAppInsights } from './insights.js'
import { FCP_APPLICATION_REQUEST_001 } from './logger/codes.js'
import { logger } from './logger/logger.js'
import { healthyRoute } from './routes/healthy.js'
import { healthzRoute } from './routes/healthz.js'

setupAppInsights()

export const server = hapi.server({
  port: process.env.PORT
})

const routes = [].concat(healthyRoute, healthzRoute)

server.route(routes)

server.ext({
  type: 'onRequest',
  method: function (request, h) {
    request.id = request.headers['x-ms-client-request-id'] || request.headers['x-ms-client-tracking-id'] || uuidv4()
    return h.continue
  }
})

server.events.on('response', function (request) {
  const requestTimeMs = request.info.responded - request.info.received
  logger.debug('Application request', {
    method: request.method.toUpperCase(),
    path: request.path,
    params: request.params,
    payload: request.payload,
    headers: request.raw.req.headers,
    responseStatusCode: request.response.statusCode,
    responseHeaders: request.response.headers,
    responsePayload: request.response.source,
    remoteAddress: request.info.remoteAddress,
    requestTimeMs,
    code: FCP_APPLICATION_REQUEST_001,
    requestId: request.id
  })
})
