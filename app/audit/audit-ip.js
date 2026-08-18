// The FCP Audit schema caps `ip` at 20 chars and marks it required. IPv4 (max
// 15 chars) always fits whole, but a real IPv6 address is usually longer (a
// full address is 39 chars), so we truncate to the cap rather than blanking it.
// Dropping the IP would mean an empty/absent `ip`, which the required field
// rejects. That would silently lose the whole access event. Keeping the first
// 20 chars preserves the network prefix (the useful part for an audit trail)
// and lets the event publish.
const MAX_IP_LENGTH = 20

/**
 * Extract client IP from X-Forwarded-For header
 * Takes the first IP in the chain (original client)
 * @param {string|string[]|undefined} xForwardedFor
 * @returns {string|null}
 */
export const getClientIp = (xForwardedFor) => {
  if (!xForwardedFor) {
    return null
  }
  // Handle string[] case - take first element
  const headerValue = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor
  return headerValue.split(',')[0].trim()
}

/**
 * Normalises a raw IP to a single schema-compliant address: keeps the first
 * entry, strips an IPv6 zone id (`fe80::1%eth0` -> `fe80::1`) and an IPv4
 * `:port`, and truncates to the schema's 20-char limit (see note above).
 * @param {string | undefined | null} raw
 * @returns {string}
 */
function sanitiseIp(raw) {
  if (!raw) {
    // The Audit IP field must not be null, so even if we can't determine an IP address, at least return an
    // empty string
    return ''
  }
  let ip = raw.split(',')[0].trim().split('%')[0]
  if ((ip.match(/:/g) ?? []).length === 1) {
    ip = ip.split(':')[0]
  }
  return ip.slice(0, MAX_IP_LENGTH)
}

/**
 * Retrieves the end-user IP address from the request (x-forwarded-for header or remoteAddress),
 * normalised to a single schema-compliant address (see sanitiseIp).
 * @param request the request
 * @returns {string} the IP address
 */
export function getEndUserIpAddress(request) {
  const raw = getClientIp(request.headers['x-forwarded-for']) || request.info.remoteAddress
  return sanitiseIp(raw)
}
