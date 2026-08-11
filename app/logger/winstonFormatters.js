import { format } from 'winston'
import { maskAllButLastFour } from './utils.js'

const buildHttpDetails = (request, response, requestTimeMs) => {
  if (!request && !response && !requestTimeMs) return {}

  const http = {}
  if (request)
    http.request = {
      ...(request?.id && { id: request.id }),
      ...(request?.method && { method: request.method }),
      ...(request?.headers && { headers: request.headers })
    }
  if (response || requestTimeMs) {
    const statusCode = response?.statusCode || response?.status
    http.response = {
      ...(statusCode && { status_code: statusCode }),
      ...(requestTimeMs && { response_time: requestTimeMs })
    }
  }
  return { http }
}

const buildError = ({ name, message, stack }, code) =>
  (name || message || stack) && {
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
      ...(outcome && { outcome: `status code: ${outcome}` }), // Outcome of the event.
      ...(reference && { reference }), // A reference ID or URL tied to the event.
      ...(action && { action: `gateway=${action}` })
    }
  }

const ALLOWED_KEYS = new Set(['crn', 'customerReferenceNumber', 'id', 'sbi', 'searchFieldType'])

// primarySearchPhrase is stripped from logs by default: depending on searchFieldType it can hold
// a crn, customer name or postcode, all of which are PII. It's logged verbatim only when the
// sibling searchFieldType is one of the values below, which aren't personally identifying on
// their own.
const SEARCH_PHRASE_SAFE_FIELD_TYPES = new Set([
  'SBI',
  'VENDOR_NUMBER',
  'TRADER_NUMBER',
  'PERSONAL_IDENTIFIER'
])

const SEARCH_PHRASE_MASKED_FIELD_TYPES = new Set(['CUSTOMER_REFERENCE'])

// crn/customerReferenceNumber is used as a login username, so we don't want to log the full number for security reasons.
const MASKED_KEYS = new Set(['crn', 'customerReferenceNumber'])

// URL paths that embed PII directly as a path segment, rather than in the body. Each pattern's
// second capture group is the segment to mask.
const PII_PATH_PATTERNS = [/(external-auth\/security-answers\/)([^/?]+)/]

const maskPathPII = (pathStr) => {
  for (const pattern of PII_PATH_PATTERNS) {
    if (pattern.test(pathStr)) {
      return pathStr.replace(
        pattern,
        (_, prefix, segment) => `${prefix}${maskAllButLastFour(segment)}`
      )
    }
  }
  return pathStr
}

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
  const searchPhraseSafe = SEARCH_PHRASE_SAFE_FIELD_TYPES.has(obj.searchFieldType)
  const searchPhraseMasked = SEARCH_PHRASE_MASKED_FIELD_TYPES.has(obj.searchFieldType)

  for (const key of Object.keys(obj)) {
    const value = pickKeysForLogging(obj[key])

    const isAllowed =
      ALLOWED_KEYS.has(key) ||
      (key === 'primarySearchPhrase' && (searchPhraseSafe || searchPhraseMasked))

    if (isAllowed || (typeof value === 'object' && value !== null)) {
      const shouldMask =
        MASKED_KEYS.has(key) || (key === 'primarySearchPhrase' && searchPhraseMasked)
      picked[key] = shouldMask ? maskAllButLastFour(value) : value
    }
  }

  return picked
}

const buildUrl = ({ body, path, url }) => {
  const result = {}

  if (url && path) {
    // Simplest case, both fields supplied, no interpretation needed
    result.full = maskPathPII(url.toString())
    result.path = maskPathPII(path.toString())
  } else {
    const pathToUse = url || path
    if (pathToUse) {
      const pathStr = maskPathPII(pathToUse.toString())
      if (pathStr.startsWith('http')) {
        result.full = pathStr
        result.path = new URL(pathStr).pathname
      } else {
        result.path = pathStr
        // Not strictly the full path, but populated with best endeavours
        result.full = pathStr
      }
    }
  }

  if (body) {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body
    result.query = JSON.stringify(pickKeysForLogging(parsedBody))
  }

  return Object.keys(result).length ? { url: result } : undefined
}

export const cdpSchemaTranslator = format((info) => {
  const { error, code, request, response, requestTimeMs, tenant, transactionId, traceId } = info

  const parsedUrl = buildUrl(request || {})
  const httpDetails = buildHttpDetails(request, response, requestTimeMs)

  return Object.assign(
    {
      level: info.level,
      message: info.message
    },
    ...[
      transactionId && { 'transaction.id': transactionId },
      traceId && { 'span.id': traceId, 'trace.id': traceId },
      buildError(error || {}, code),
      httpDetails,
      buildEvent(
        info.type,
        code,
        request?.method,
        info['@timestamp'],
        requestTimeMs,
        httpDetails.http?.response?.status_code,
        // The URL path is mapped onto the event reference field, which is used in Grafana dashboard queries
        parsedUrl?.url?.path,
        info?.gatewayType
      ),
      tenant && { tenant },
      parsedUrl
    ]
  )
})
