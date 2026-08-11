// Extensions safe to return to a client: `code` (a machine-readable error category) and
// `http` (the status Apollo's HTTP integration reads to set the response status). Anything
// else - e.g. HttpError's raw upstream request/response, which can carry customer PII - must
// not leave the server.
const SAFE_EXTENSION_KEYS = new Set(['code', 'http'])

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
