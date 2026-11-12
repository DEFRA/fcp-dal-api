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

/**
 * Logs one line per GraphQL error, so it is possible to see why a request failed (e.g. returned a
 * 400) without needing debug level response logging.
 *
 * Only the error message, extension code, http status and path are logged - never the raw
 * extensions (HttpError attaches the upstream request/response, which can carry PII) or the
 * request variables. A stack trace is only included for server errors, where it is useful for
 * diagnosis; client errors are expected and their stack is just noise.
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
    error: { name: code ?? error.name, message: error.message, stack },
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
