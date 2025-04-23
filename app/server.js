import hapi from '@hapi/hapi'

import { Unit } from 'aws-embedded-metrics'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import {
  DAL_APPLICATION_REQUEST_001,
  DAL_APPLICATION_RESPONSE_001,
  DAL_USER_REQUEST_001
} from './logger/codes.js'
import { logger } from './logger/logger.js'
import { healthRoute } from './routes/health.js'
import { healthyRoute } from './routes/healthy.js'

export const hashEmail = (email) => {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export const server = hapi.server({
  port: process.env.PORT
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

    if (request.headers['email']) {
      logger.metric('UserRequest', 1, Unit.Count, {
        code: DAL_USER_REQUEST_001,
        userId: hashEmail(request.headers['email'])
      })
    }

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

  logger.metric('RequestTime', requestTimeMs, Unit.Milliseconds, {
    code: DAL_APPLICATION_REQUEST_001
  })
  logger.http('FCP - Access log', {
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
  logger.verbose('FCP - Response log', {
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
