import { StatusCodes } from 'http-status-codes'
import { DAL_GRAPHQL_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

// Apollo error codes that are the client's fault even though they don't carry an explicit http
// status
const CLIENT_ERROR_CODES = new Set([
  'GRAPHQL_PARSE_FAILED',
  'GRAPHQL_VALIDATION_FAILED',
  'BAD_USER_INPUT',
  'OPERATION_RESOLUTION_FAILURE',
  'PERSISTED_QUERY_NOT_FOUND',
  'PERSISTED_QUERY_NOT_SUPPORTED'
])

function isClientError(status, code) {
  if (status) {
    return status < StatusCodes.INTERNAL_SERVER_ERROR
  }
  return CLIENT_ERROR_CODES.has(code)
}

const REDACTED = '[REDACTED]'

// graphql-js (and graphql-scalars) echo the offending input value in their coercion/validation
// messages, which can contain PII (e.g. an email address or CRN), so strip the value out while
// keeping the reason, type and path that make the error diagnosable
const VALUE_PATTERNS = [
  // 'Expected value of type "String!", found 123.'
  [/(Expected value of type ".*?", found ).*$/s, `$1${REDACTED}.`],
  // 'Value "FOO" does not exist in "Status" enum.'
  [/Value ".*" does not exist in /s, `Value ${REDACTED} does not exist in `],
  // 'Int cannot represent non-integer value: "abc"', 'Value is not a valid IBAN: GB00...'
  [/(\bvalue\b[^:"]*): .*$/is, `$1: ${REDACTED}`]
]

function redactValues(message) {
  return VALUE_PATTERNS.reduce(
    (msg, [pattern, replacement]) => msg.replace(pattern, replacement),
    message
  )
}

// 'Variable "$input" got invalid value { email: "..." } at "input.email"; <reason>'
const INVALID_VARIABLE = /^Variable "(\$[^"]+)" got invalid value /

/**
 * Remove user supplied values from an error message so it is safe to log.
 */
export function redactMessage(error) {
  const message = error.message ?? ''
  const variable = INVALID_VARIABLE.exec(message)
  if (!variable) {
    return redactValues(message)
  }

  // graphql-js builds the message as `${prefix}; ${originalError.message}`, so use the original
  // error to split the reason from the (unsafe) printed value rather than parsing the value
  const redactedPrefix = `Variable "${variable[1]}" got invalid value ${REDACTED}`
  const reason = error.originalError?.message
  if (!reason || !message.endsWith(`; ${reason}`)) {
    return redactedPrefix
  }
  const prefix = message.slice(0, -(reason.length + 2))
  const path = / at "([\w$.[\]]+)"$/.exec(prefix)?.[1]
  const location = path ? ` at "${path}"` : ''
  return `${redactedPrefix}${location}; ${redactValues(reason)}`
}

/**
 * Logs one line per GraphQL error, so it is possible to see why a request failed (e.g. returned a
 * 400) without needing debug level response logging.
 *
 * Only the error message, extension code, http status and path are logged - never the raw
 * extensions (HttpError attaches the upstream request/response, which can carry PII) or the
 * request variables. Input values that graphql-js echoes into the message are redacted. A stack
 * trace is only included for server errors, where it is useful for diagnosis; client errors are
 * expected and their stack is just noise.
 */
function logGraphQLError(log, error) {
  const code = error.extensions?.code
  const status = error.extensions?.http?.status
  const clientError = isClientError(status, code)
  const path = error.path?.join('.')

  const stack = clientError ? undefined : (error.originalError?.stack ?? error.stack)

  let message = '#DAL - GraphQL error'
  if (path) {
    message += ` at ${path}`
  }
  if (code) {
    message += ` (${code})`
  }

  log[clientError ? 'warn' : 'error'](message, {
    code: DAL_GRAPHQL_ERROR_001,
    // name is mapped to error.type by the cdp log formatter
    error: { name: code ?? error.name, message: redactMessage(error), stack },
    ...(status && { response: { statusCode: status } })
  })
}

export function errorLoggingPlugin() {
  return {
    // Errors thrown while building the context (e.g. a Defra ID token failing verification) never
    // reach requestDidStart, so they must be logged here. No request logger exists yet.
    async contextCreationDidFail({ error }) {
      logGraphQLError(logger, error)
    },
    async requestDidStart() {
      return {
        async didEncounterErrors({ contextValue, errors }) {
          const log = contextValue?.requestLogger ?? logger
          for (const error of errors) {
            logGraphQLError(log, error)
          }
        }
      }
    }
  }
}
