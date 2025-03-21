import hapi from '@hapi/hapi'

import { v4 as uuidv4 } from 'uuid'
import { setupAppInsights } from './insights.js'
import { DAL_APPLICATION_REQUEST_001, DAL_APPLICATION_RESPONSE_001 } from './logger/codes.js'
import { logger } from './logger/logger.js'
import { healthyRoute } from './routes/healthy.js'
import { healthRoute } from './routes/health.js'

setupAppInsights()

export const server = hapi.server({
  port: process.env.PORT
})

const routes = [].concat(healthyRoute, healthRoute)

server.route(routes)

server.ext({
  type: 'onRequest',
  method: function (request, h) {
    request.id =
      request.headers['x-ms-client-request-id'] ||
      request.headers['x-ms-client-tracking-id'] ||
      uuidv4()

    logger.debug('FCP - Access log', {
      request: {
        method: request.method.toUpperCase(),
        path: request.path,
        params: request.params,
        payload: request.payload,
        body: request.body,
        headers: request.headers,
        remoteAddress: request.info.remoteAddress
      },
      code: DAL_APPLICATION_REQUEST_001,
      requestId: request.id
    })

    return h.continue
  }
})

server.events.on('response', function (request) {
  const requestTimeMs = request.info.responded - request.info.received

  logger.http('FCP - Access log', {
    code: DAL_APPLICATION_REQUEST_001,
    requestTimeMs,
    requestId: request.id,
    request: {
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
  logger.verbose('FCP - Response log', {
    request: {
      method: request.method.toUpperCase(),
      path: request.path,
      params: request.params,
      payload: request.payload,
      headers: request.raw.req.headers,
      remoteAddress: request.info.remoteAddress
    },
    response: {
      statusCode: request.response.statusCode,
      headers: request.response.headers,
      body: request.response.source
    },
    requestTimeMs,
    code: DAL_APPLICATION_RESPONSE_001,
    requestId: request.id
  })
})
