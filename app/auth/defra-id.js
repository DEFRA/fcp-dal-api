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
 * Verifies the Defra ID token. Verification is only attempted when authContext.externalAuthHeader is set - a request
 * authenticated another way (internal email/service-account headers) carries no Defra ID token at all, so this
 * resolves to undefined. When the header is present, a failed verification/decode throws an Unauthorized error
 *
 * @param {{ externalAuthHeader?: string }} authContext
 * @param {DefraIdJWKS} [jwksDataSource]
 * @returns {Promise<{ crn: () => string, orgId: (sbi: string) => string } | undefined>}
 */
export const defraIdContext = async (authContext, jwksDataSource = defraIdJWKS) => {
  if (!authContext.externalAuthHeader) {
    return undefined
  }

  const tokenPayload = config.get('auth.disabled')
    ? decodeUnverifiedDefraIdToken(authContext.externalAuthHeader)
    : await verifyDefraIdToken(authContext.externalAuthHeader, jwksDataSource)

  return {
    crn: () => {
      return extractCrnFromDefraIdToken(tokenPayload)
    },
    orgId: (sbi) => {
      return extractOrgIdFromDefraIdToken(sbi, tokenPayload)
    }
  }
}
