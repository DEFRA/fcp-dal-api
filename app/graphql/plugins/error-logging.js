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

// Errors raised by graphql-js/Apollo while parsing, validating or coercing the request, before any
// resolver runs. Their messages echo whatever the client sent (e.g. 'Syntax Error: Expected Name,
// found String "<sbi>".' or 'Variable "$input" got invalid value { email: "..." }'), which can
// be PII, so only the code is logged for them
const REQUEST_ERROR_CODES = new Set([
  'GRAPHQL_PARSE_FAILED',
  'GRAPHQL_VALIDATION_FAILED',
  'OPERATION_RESOLUTION_FAILURE'
])

function isRequestError(code, path) {
  // BAD_USER_INPUT is also thrown by our own resolvers with safe messages; those have a path,
  // whereas graphql-js variable coercion errors are raised before execution and do not
  return REQUEST_ERROR_CODES.has(code) || (code === 'BAD_USER_INPUT' && !path)
}

const REDACTED = '[REDACTED]'

// When a resolver returns a value a leaf type cannot serialize, graphql-js echoes it into the
// message, e.g. 'Int cannot represent non-integer value: "abc"' or 'Enum "Status" cannot represent
// value: "FOO"'. The value comes from the upstream response so could be PII; strip it but keep the
// reason
const SERIALIZE_ERROR = /(cannot represent [^:]*value): .*$/s

/**
 * Remove the value from a leaf serialization error message so it is safe to log.
 */
export function redactMessage(error) {
  return (error.message ?? '').replace(SERIALIZE_ERROR, `$1: ${REDACTED}`)
}

/**
 * Logs one line per GraphQL error, so it is possible to see why a request failed (e.g. returned a
 * 400) without needing debug level response logging.
 *
 * Only the error message, extension code and path are logged - never the raw
 * extensions (HttpError attaches the upstream request/response, which can carry PII) or the
 * request variables. Parse, validation and variable coercion errors log only their code, as their
 * messages echo the client's input; values in other messages are redacted. A stack
 * trace is only included for server errors, where it is useful for diagnosis; client errors are
 * expected and their stack is just noise.
 */
export function logGraphQLError(log, error) {
  const code = error.extensions?.code
  const status = error.extensions?.http?.status
  const clientError = isClientError(status, code)
  const path = error.path?.join('.')

  const stack = clientError ? undefined : (error.originalError?.stack ?? error.stack)
  const errorMessage = isRequestError(code, path) ? undefined : redactMessage(error)

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
    error: { name: code ?? error.name, message: errorMessage, stack }
    // The http status is deliberately not logged as response.statusCode: that becomes
    // http.response.status_code, which CDP alerts and dashboards count potentially
    // multiple times per request.
  })
}

export function errorLoggingPlugin() {
  return {
    // Errors thrown while building the context (e.g. a Defra ID token failing verification) never
    // reach requestDidStart. They are logged by the context function rather than in
    // contextCreationDidFail, because that hook is not given the request, so it cannot log the
    // trace id.
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
