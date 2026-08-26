import { createRemoteJWKSet } from 'jose'
import { config } from '../config.js'

let jwksSet = null

export class DefraIdJWKS {
  async getRemoteJwksSet() {
    if (!jwksSet) {
      const wellKnownUrl = config.get('defraId.wellKnownUrl')
      const timeoutMs = config.get('defraId.timeoutMs')
      const response = await fetch(wellKnownUrl, { signal: AbortSignal.timeout(timeoutMs) })
      if (!response.ok) {
        throw new Error(
          `Failed to fetch Defra ID well known configuration, status: ${response.status}`
        )
      }

      const { jwks_uri: jwksUri } = await response.json()
      if (!jwksUri) {
        throw new Error('Defra ID well known configuration does not contain a jwks_uri')
      }

      jwksSet = createRemoteJWKSet(new URL(jwksUri), { timeoutDuration: timeoutMs })
    }

    return jwksSet
  }

  async getPublicKey(kid) {
    const getKey = await this.getRemoteJwksSet()
    return getKey({ kid, alg: 'RS256' })
  }

  // jwksSet is cached at module scope (shared across every instance), not per-instance - clears
  // that cache so the next getRemoteJwksSet() call re-discovers it from scratch. Exists for tests.
  clearJwksSet() {
    jwksSet = null
  }
}
