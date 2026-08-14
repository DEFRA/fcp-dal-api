// Extensions safe to return to a client: `code` (a machine-readable error category), `http`
// (the status Apollo's HTTP integration reads to set the response status), and the two
// boolean update statuses updateBusinessAllFields attaches on partial failure. Anything
// else - e.g. HttpError's raw upstream request/response, which can carry customer PII - must
// not leave the server.
const SAFE_EXTENSION_KEYS = new Set([
  'code',
  'http',
  'businessDetailsUpdated',
  'additionalBusinessDetailsUpdated'
])

function sanitizeExtensions(extensions = {}) {
  return Object.fromEntries(
    Object.entries(extensions).filter(([key]) => SAFE_EXTENSION_KEYS.has(key))
  )
}

export function formatError(formattedError) {
  return {
    ...formattedError,
    extensions: sanitizeExtensions(formattedError.extensions)
  }
}
