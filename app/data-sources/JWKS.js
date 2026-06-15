import { createRemoteJWKSet } from 'jose'
import { config } from '../config.js'

let jwksSet = null

export class JWKS {
  getRemoteJwksSet() {
    if (!jwksSet) {
      const jwksUri = config.get('oidc.jwksURI')
      const url = new URL(jwksUri)

      jwksSet = createRemoteJWKSet(url, {
        timeout: config.get('oidc.timeoutMs')
      })
    }

    return jwksSet
  }

  async getPublicKey(kid) {
    const getKey = this.getRemoteJwksSet()
    return await getKey({ kid, alg: 'RS256' })
  }
}
