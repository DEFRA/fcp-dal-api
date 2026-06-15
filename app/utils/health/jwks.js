import { config } from '../../config.js'
import { JWKS } from '../../data-sources/JWKS.js'
import { JWKS_FETCH_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

export const healthCheck = async () => {
  try {
    const res = await fetch(config.get('oidc.jwksURI'))
    if (!res.ok) {
      logger.error('#DAL - JWKS endpoint returned', { res })
      throw new Error('Problem fetching JWKS keys, status:', res.status)
    }

    const json = await res.json()
    if (!json.keys || !Array.isArray(json.keys)) {
      logger.error('#DAL - Error fetching JWKS keys', { res, code: JWKS_FETCH_ERROR_001 })
      throw new Error('Problem inspecting JWKS keys response')
    }
    logger.info('Fetched', json.keys.length, 'JWKS keys')

    const [firstKey] = json.keys
    if (!firstKey?.kid) {
      logger.error('#DAL - Error fetching JWKS keys', { res, code: JWKS_FETCH_ERROR_001 })
      throw new Error('Missing JWKS keys')
    }

    const jwks = new JWKS()
    await jwks.getPublicKey(firstKey.kid)
    logger.info('Resolved first JWKS key for kid:', firstKey.kid)
  } catch (error) {
    logger.error('#DAL - Error checking JWKS keys', { error, code: JWKS_FETCH_ERROR_001 })
    throw error
  }
}
