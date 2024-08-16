import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

import { logger } from '../utils/logger.js'

export async function getJwtPublicKey (kid) {
  const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${process.env.API_TENANT_ID}/discovery/v2.0/keys`
  })
  const key = await client.getSigningKey(kid)
  return key.getPublicKey()
}

export async function getAuth (request, getJwtPublicKeyFunc = getJwtPublicKey) {
  try {
    const authHeader = request?.headers?.authorization
    if (!authHeader) {
      return {}
    }
    const token = authHeader.split(' ')[1]
    const decodedToken = jwt.decode(token, { complete: true })
    const header = decodedToken.header
    const signingKey = await getJwtPublicKeyFunc(header.kid)
    return jwt.verify(token, signingKey)
  } catch (error) {
    logger.error('#authenticate - Error verifying jwt', { error })
    return {}
  }
}
