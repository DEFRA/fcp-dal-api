import tls from 'node:tls'
import { EnvHttpProxyAgent } from 'undici'
import { config as appConfig } from '../../config.js'

const internalGatewayUrl = appConfig.get('kits.internal.gatewayUrl')
const externalGatewayUrl = appConfig.get('kits.external.gatewayUrl')

// One dispatcher per gateway route, shared by every RuralPayments instance.  This will allow
// connection pool re-use and reduced mTLS handshakes, where appropriate.
const gatewayDispatchers = new Map()

// requestTls is fully determined by route - the gateway URL and mTLS config are both static, set
// once at module/config load - so it's built lazily here rather than per-request.
function buildRequestTls(route) {
  const gatewayUrl = route === 'external' ? externalGatewayUrl : internalGatewayUrl
  const { hostname, port } = new URL(gatewayUrl)
  return {
    host: hostname,
    port,
    servername: hostname,
    secureContext: tls.createSecureContext(
      route === 'external' ? appConfig.externalMTLS : appConfig.internalMTLS
    )
  }
}

export function getGatewayDispatcher(route) {
  if (!gatewayDispatchers.has(route)) {
    gatewayDispatchers.set(route, new EnvHttpProxyAgent({ requestTls: buildRequestTls(route) }))
  }
  return gatewayDispatchers.get(route)
}

// Used by tests
export function resetGatewayDispatchers() {
  gatewayDispatchers.clear()
}
