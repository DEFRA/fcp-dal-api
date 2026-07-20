import { config } from '../../config.js'
import { JWKS } from '../../data-sources/JWKS.js'
import { JWKS_FETCH_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

export const healthCheck = async () => {
  if (!config.get('auth.disabled')) {
    try {
      logger.info(`Fetching JWKS keys from ${config.get('oidc.jwksURI')}`)
      const res = await fetch(config.get('oidc.jwksURI'))
      if (!res.ok) {
        logger.error('#DAL - Error fetching JWKS keys', {
          res,
          code: JWKS_FETCH_ERROR_001,
          tenant: { message: await res.text() }
        })
        throw new Error(`Problem fetching JWKS keys, status: ${res.status}`)
      }

      const json = await res.json()
      if (!json.keys || !Array.isArray(json.keys)) {
        logger.error('#DAL - Error parsing JWKS keys', { res, code: JWKS_FETCH_ERROR_001 })
        throw new Error('Problem inspecting JWKS keys response')
      }

      const [firstKey] = json.keys
      if (!firstKey?.kid) {
        logger.error('#DAL - Error no matching JWKS key', { res, code: JWKS_FETCH_ERROR_001 })
        throw new Error('Missing JWKS keys')
      }

      const jwks = new JWKS()
      await jwks.getPublicKey(firstKey.kid)
      logger.info(`SUCCESS: Resolved first JWKS key for kid: ${firstKey.kid}`)
    } catch (error) {
      logger.error('#DAL - Error checking JWKS keys', { error, code: JWKS_FETCH_ERROR_001 })
      throw error
    }
  }
}
