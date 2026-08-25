import { config } from '../../config.js'
import { DefraIdJWKS } from '../../data-sources/DefraIdJWKS.js'
import { DEFRA_ID_JWKS_FETCH_ERROR_001 } from '../../logger/codes.js'
import { logger } from '../../logger/logger.js'

export const healthCheck = async () => {
  const wellKnownUrl = config.get('defraId.wellKnownUrl')
  // No well known URL configured means Defra ID token verification has been turned off
  if (!wellKnownUrl) {
    return
  }

  try {
    logger.info(`Fetching Defra ID well known configuration from ${wellKnownUrl}`)
    const wellKnownRes = await fetch(wellKnownUrl)
    if (!wellKnownRes.ok) {
      logger.error('#DAL - Error fetching Defra ID well known configuration', {
        res: wellKnownRes,
        code: DEFRA_ID_JWKS_FETCH_ERROR_001,
        error: {
          message: await wellKnownRes.text()
        }
      })
      throw new Error(
        `Problem fetching Defra ID well known configuration, status: ${wellKnownRes.status}`
      )
    }

    const { jwks_uri: jwksUri } = await wellKnownRes.json()
    if (!jwksUri) {
      logger.error('#DAL - Error parsing Defra ID well known configuration', {
        res: wellKnownRes,
        code: DEFRA_ID_JWKS_FETCH_ERROR_001
      })
      throw new Error('Defra ID well known configuration does not contain a jwks_uri')
    }

    const jwksRes = await fetch(jwksUri)
    if (!jwksRes.ok) {
      logger.error('#DAL - Error fetching Defra ID JWKS keys', {
        res: jwksRes,
        code: DEFRA_ID_JWKS_FETCH_ERROR_001,
        error: {
          message: await jwksRes.text()
        }
      })
      throw new Error(`Problem fetching Defra ID JWKS keys, status: ${jwksRes.status}`)
    }

    const json = await jwksRes.json()
    if (!json.keys || !Array.isArray(json.keys)) {
      logger.error('#DAL - Error parsing Defra ID JWKS keys', {
        res: jwksRes,
        code: DEFRA_ID_JWKS_FETCH_ERROR_001
      })
      throw new Error('Problem inspecting Defra ID JWKS keys response')
    }

    const [firstKey] = json.keys
    if (!firstKey?.kid) {
      logger.error('#DAL - Error no matching Defra ID JWKS key', {
        res: jwksRes,
        code: DEFRA_ID_JWKS_FETCH_ERROR_001
      })
      throw new Error('Missing Defra ID JWKS keys')
    }

    const defraIdJWKS = new DefraIdJWKS()
    await defraIdJWKS.getPublicKey(firstKey.kid)
    logger.info(`SUCCESS: Resolved first Defra ID JWKS key for kid: ${firstKey.kid}`)
  } catch (error) {
    logger.error('#DAL - Error checking Defra ID JWKS keys', {
      error,
      code: DEFRA_ID_JWKS_FETCH_ERROR_001
    })
    throw error
  }
}
