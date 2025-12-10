import { format } from 'winston'

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

const buildEvent = (kind, category, type, created, duration, outcome, reference, action) =>
  (kind || category || type || created || duration || outcome || reference || action) && {
    event: {
      ...(kind && { kind }),
      ...(category && { category }),
      ...(type && { type }), // Specific action taken or observed (e.g., user_login).
      ...(created && { created }), // Time the event was created in the system.
      ...(duration && { duration: duration * 1000000 }), // Total time of the event in nanoseconds.
      ...(outcome && { outcome }), // Outcome of the event.
      ...(reference && { reference }), // A reference ID or URL tied to the event.
      ...(action && { action: `gateway=${action}` })
    }
  }

const ALLOWED_KEYS = new Set([
  'crn',
  'customerReferenceNumber',
  'id',
  'primarySearchPhrase',
  'sbi',
  'searchFieldType'
])

const pickKeysForLogging = (obj) => {
  if (obj == null) return obj

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj
      .map(pickKeysForLogging)
      .filter((v) => v && (typeof v !== 'object' || Object.keys(v).length > 0))
  }

  const picked = {}

  for (const key of Object.keys(obj)) {
    const value = pickKeysForLogging(obj[key])

    if (ALLOWED_KEYS.has(key) || (typeof value === 'object' && value !== null)) {
      picked[key] = value
    }
  }

  return picked
}

const buildUrl = ({ body, path }) => {
  const result = {}

  if (path) {
    result.full = path
  }

  if (body) {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body
    result.query = JSON.stringify(pickKeysForLogging(parsedBody))
  }

  return Object.keys(result).length ? { url: result } : undefined
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
        request?.path,
        info?.gatewayType
      ),
      tenant && { tenant },
      buildUrl(request || {})
    ]
  )
})
