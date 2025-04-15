import { format } from 'winston'
import { sampleResponse } from './utils.js'

export const cdpSchemaTranslator = format((info) => {
  const { error, code, level, request, response, requestTimeMs, requestId } = info
  const tenantId = process.env.API_TENANT_ID

  return Object.assign(
    {
      level,
      message: info.message
    },
    ...[
      requestId && { 'transaction.id': requestId, 'span.id': requestId },
      tenantId && { tenant: { id: tenantId } },
      error && {
        error: {
          ...(error?.name && { type: error.name }),
          ...(error?.message && { message: error.message }),
          ...(error?.stack && { stack_trace: error.stack }),
          ...(code && { code })
        }
      },
      request && {
        http: {
          ...(request?.id && { id: request.id }),
          ...(request?.method && { method: request.method }),
          ...(request?.path && { url: request.path }),
          ...(request?.remoteAddress && { url: request.remoteAddress }),
          ...(request?.headers && { headers: request.headers }),
          ...(response?.statusCode && { status_code: response.statusCode })
        }
      },
      {
        event: {
          ...(code && { category: code }),
          ...(request?.method && { type: request?.method }), // Specific action taken or observed (e.g., user_login).
          ...(info['@timestamp'] && { created: info['@timestamp'] }), // Time the event was created in the system.
          ...(requestTimeMs && { duration: requestTimeMs * 1000000 }), // Total time of the event in nanoseconds.
          ...(response?.statusCode && { outcome: response?.statusCode }), // Outcome of the event.
          ...(request?.path && { reference: request?.path }) // A reference ID or URL tied to the event.
        }
      }
    ]
  )
})

export const sampleResponseBodyData = format((info) => {
  if (info?.response?.body) {
    info.response.sampleResponseBody = sampleResponse(info.response.body)
    delete info.response.body
  }
  return info
})
