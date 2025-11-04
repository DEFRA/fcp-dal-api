import { format } from 'winston'
import { sampleResponse } from './utils.js'

const buildHttpDetails = (request, response, requestTimeMs) => {
  if (!request && !response && !requestTimeMs) return {}

  const http = {}
  if (request)
    http.request = {
      ...(request?.id && { id: request.id }),
      ...(request?.method && { method: request.method }),
      ...(request?.headers && { headers: request.headers })
    }
  if (response || requestTimeMs)
    http.response = {
      ...(response?.statusCode && { status_code: response.statusCode }),
      ...(requestTimeMs && { response_time: requestTimeMs })
    }

  return { http }
}

const buildError = ({ name, message, stack }, code) =>
  name &&
  message &&
  stack && {
    error: {
      ...(name && { type: name }),
      ...(message && { message }),
      ...(stack && { stack_trace: stack }),
      ...(code && { code })
    }
  }

const buildEvent = (kind, category, type, created, duration, outcome, reference) =>
  (kind || category || type || created || duration || outcome || reference) && {
    event: {
      ...(kind && { kind }),
      ...(category && { category }),
      ...(type && { type }), // Specific action taken or observed (e.g., user_login).
      ...(created && { created }), // Time the event was created in the system.
      ...(duration && { duration: duration * 1000000 }), // Total time of the event in nanoseconds.
      ...(outcome && { outcome }), // Outcome of the event.
      ...(reference && { reference }) // A reference ID or URL tied to the event.
    }
  }

const buildUrl = ({ body, path }) =>
  (body || path) && {
    url: {
      full: path,
      ...(body && {
        query: new URLSearchParams(typeof body === 'string' ? JSON.parse(body) : body).toString()
      })
    }
  }

export const cdpSchemaTranslator = format((info) => {
  const { error, code, request, response, requestTimeMs, tenant, transactionId, traceId } = info

  return Object.assign(
    {
      level: info.level,
      message: info.message
    },
    ...[
      transactionId && { 'transaction.id': transactionId },
      traceId && { 'span.id': traceId, 'trace.id': traceId },
      buildError(error || {}, code),
      buildHttpDetails(request, response, requestTimeMs),
      buildEvent(
        info.type,
        code,
        request?.method,
        info['@timestamp'],
        requestTimeMs,
        response?.statusCode,
        request?.path
      ),
      tenant && { tenant },
      buildUrl(request || {})
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
