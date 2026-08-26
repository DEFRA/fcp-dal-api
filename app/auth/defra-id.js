import { decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose'
import { config } from '../config.js'
import { BadRequest, Unauthorized } from '../errors/graphql.js'
import { DefraIdJWKS } from '../data-sources/DefraIdJWKS.js'

const defraIdJWKS = new DefraIdJWKS()

async function verifyDefraIdToken(token, jwksDataSource) {
  try {
    const { kid } = decodeProtectedHeader(token)
    const signingKey = await jwksDataSource.getPublicKey(kid)
    const { payload } = await jwtVerify(token, signingKey, { algorithms: ['RS256'] })
    return payload
  } catch (error) {
    throw new Unauthorized('Defra ID token failed verification', { originalError: error })
  }
}

// When DISABLE_AUTH is true, token verification is disabled and the token should just be decoded instead.
function decodeUnverifiedDefraIdToken(token) {
  try {
    return decodeJwt(token)
  } catch (error) {
    throw new Unauthorized('Defra ID token could not be decoded', { originalError: error })
  }
}

function extractCrnFromDefraIdToken(payload) {
  if (payload?.contactId) {
    return payload.contactId
  }
  throw new BadRequest('Defra ID token does not contain crn')
}

function extractOrgIdFromDefraIdToken(sbi, payload) {
  if (payload?.relationships && Array.isArray(payload.relationships)) {
    // Find relationship string that matches the given SBI
    const relationship = payload.relationships.find((rel) => {
      const [, tokenSBI] = rel.split(':')
      return sbi === tokenSBI
    })
    if (relationship) {
      const [orgId] = relationship.split(':')
      return orgId
    }
  }
  throw new BadRequest('Defra ID token is not valid for the provided SBI')
}

/**
 * Verifies the Defra ID token once - so the JWKS round-trip happens during context build rather
 * than the first time a resolver needs it. A failed verification is not thrown from here: it's
 * captured and only re-thrown from crn()/orgId() (only when something actually calls them), so a
 * request that never needs Defra ID identity is unaffected by a bad token.
 *
 * @param {{ externalAuthHeader?: string }} authContext
 * @param {DefraIdJWKS} [jwksDataSource]
 * @returns {Promise<{ crn: () => string, orgId: (sbi: string) => string }>}
 */
export const defraIdContext = async (authContext, jwksDataSource = defraIdJWKS) => {
  let tokenPayload
  let verificationError
  try {
    tokenPayload = config.get('defraId.wellKnownUrl')
      ? await verifyDefraIdToken(authContext.externalAuthHeader, jwksDataSource)
      : decodeUnverifiedDefraIdToken(authContext.externalAuthHeader)
  } catch (error) {
    verificationError = error
  }

  const ensureTokenIsValid = () => {
    if (verificationError) {
      throw verificationError
    }
  }

  return {
    crn: () => {
      ensureTokenIsValid()
      return extractCrnFromDefraIdToken(tokenPayload)
    },
    orgId: (sbi) => {
      ensureTokenIsValid()
      return extractOrgIdFromDefraIdToken(sbi, tokenPayload)
    }
  }
}
