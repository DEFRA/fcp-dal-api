import { format } from 'winston'
import { DAL_APPLICATION_REQUEST_001 } from './codes.js'
import { sampleResponse } from './utils.js'

export const cdpSchemaTranslator = format((info) => {
  const { error, code, level, request, response, requestTimeMs, requestId } = info
  const log = Object.assign(
    {
      level,
      message: JSON.stringify(info) // TODO: Remove this - used to debug while sorting logs
    },
    ...[
      requestId && { 'transaction.id': requestId, 'span.id': requestId },
      process.env.API_TENANT_ID && { tenant: { id: process.env.API_TENANT_ID } },
      code && { event: { category: code } } // 	Broad category of the event.
    ]
  )

  switch (level) {
    case 'http':
    case 'debug':
      log.event = Object.assign(
        log.event,
        ...[
          //{ kind: level }, // High-level type of the event.
          //{ action: 'action' }, // Type of event.
          request && { type: request?.method }, // Specific action taken or observed (e.g., user_login).
          info['@timestamp'] && { created: info['@timestamp'] }, // Time the event was created in the system.
          requestTimeMs && { duration: requestTimeMs * 1000000 }, // Total time of the event in nanoseconds.
          response?.statusCode && { outcome: response?.statusCode }, // Outcome of the event.
          // response?.body?.reason && { reason: response?.body?.reason }, // Reason or explanation for the event outcome.
          request?.path && { reference: request?.path } // A reference ID or URL tied to the event.
        ]
      )

      // Only add request information for the root request
      if (code === DAL_APPLICATION_REQUEST_001) {
        log.http = Object.assign(
          {},
          ...[
            request && { id: requestId },
            request && { method: request.method },
            request && { url: request.path || request.remoteAddress },
            request && { headers: request.headers },
            response && { status_code: response.statusCode }
          ]
        )
        try {
          const url = new URL(request?.path, request?.headers?.host)
          log.url = Object.assign(
            {},
            ...[
              request && { domain: url.hostname },
              request && { full: url.href },
              request && { path: url.pathname },
              request && { port: url.port },
              request && { query: url.search }
            ]
          )
        } catch (error) {
          // console.error('Error parsing URL', error)
          // log.error = {
          //   message: `Error parsing URL for: ${request?.path}`
          // }
        }
      }
      break
    case 'error':
      log.error = {
        type: error.name,
        message: error.message,
        stack_trace: error.stack,
        code
      }
      break
    // default:
    //   break
  }

  return log
})

export const sampleResponseBodyData = format((info) => {
  if (info?.response?.body) {
    info.response.sampleResponseBody = sampleResponse(info.response.body)
    delete info.response.body
  }
  return info
})
