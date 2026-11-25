import { decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose'
import { config } from '../config.js'
import { DefraIdJWKS } from '../data-sources/DefraIdJWKS.js'
import { BadRequest, Unauthorized } from '../errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_DEFRA_ID_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { maskAllButLastFour } from '../logger/utils.js'

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

// When DISABLE_AUTH is true, token verification is disabled and the token should just be decoded
// instead.
function decodeUnverifiedDefraIdToken(token) {
  try {
    return decodeJwt(token)
  } catch (error) {
    throw new Unauthorized('Defra ID token could not be decoded', { originalError: error })
  }
}

// contactId (crn) may be issued as either a string or a number, normalise it to a string. Any other
// type is not a valid crn
function contactIdAsString(contactId) {
  if (typeof contactId === 'string' || typeof contactId === 'number') {
    return `${contactId}`
  }
  return undefined
}

function extractCrnFromDefraIdToken(payload) {
  const crn = contactIdAsString(payload?.contactId)
  if (crn) {
    return crn
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
 * Verifies the Defra ID token. Verification is only attempted when authContext.externalAuthHeader
 * is set - a request authenticated another way (internal email/service-account headers) carries no
 * Defra ID token at all, so this resolves to undefined. When the header is present, a failed
 * verification/decode throws an Unauthorized error
 *
 * @param {{ externalAuthHeader?: string }} authContext
 * @param {{ traceId: string, jwksDataSource?: DefraIdJWKS }} options
 * @returns {Promise<{ crn: () => string, orgId: (sbi: string) => string } | undefined>}
 */
export const defraIdContext = async (authContext, { traceId, jwksDataSource = defraIdJWKS }) => {
  if (!authContext.externalAuthHeader) {
    return undefined
  }

  const tokenPayload = config.get('auth.disabled')
    ? decodeUnverifiedDefraIdToken(authContext.externalAuthHeader)
    : await verifyDefraIdToken(authContext.externalAuthHeader, jwksDataSource)

  logger.info('#DAL Request authentication - Defra ID token decoded', {
    type: 'http',
    code: DAL_REQUEST_AUTHENTICATION_DEFRA_ID_001,
    traceId,
    tenant: {
      message: JSON.stringify({
        aud: tokenPayload.aud,
        sub: tokenPayload.sub,
        serviceId: tokenPayload.serviceId,
        correlationId: tokenPayload.correlationId,
        currentRelationshipId: maskAllButLastFour(tokenPayload.currentRelationshipId),
        sessionId: tokenPayload.sessionId,
        email: tokenPayload.email?.split('@')[1],
        // contactId is crn which is considered PII
        contactId: maskAllButLastFour(contactIdAsString(tokenPayload.contactId)),
        relationships: maskRelationshipsForLogging(tokenPayload.relationships),
        roles: tokenPayload.roles,
        iat: tokenPayload.iat,
        exp: tokenPayload.exp
      })
    }
  })

  return {
    crn: () => {
      return extractCrnFromDefraIdToken(tokenPayload)
    },
    orgId: (sbi) => {
      return extractOrgIdFromDefraIdToken(sbi, tokenPayload)
    }
  }
}

/**
 * Makes a Defra ID token's relationships safe to log. Each relationship is an
 * "orgId:sbi:organisationName:..." string: the orgId and SBI are PII and the organisation name can
 * be a person's name (e.g. a sole trader), so each entry is reduced to its masked orgId and SBI and
 * the remaining fields are dropped.
 *
 * @example
 * maskRelationshipsForLogging(['5565448:823456789:Farm Ltd:1:Employee:1'])
 * // => ['***5448:*****6789']
 *
 * @param {*} relationships the `relationships` claim from the Defra ID token
 * @returns {string[]|undefined} the masked relationships, or undefined if the claim is not an array
 *   (a malformed claim could hold anything, so it is not logged)
 */
const maskRelationshipsForLogging = (relationships) =>
  Array.isArray(relationships)
    ? relationships.map((relationship) => {
        const [orgId, sbi] = `${relationship}`.split(':')
        return `${maskAllButLastFour(orgId)}:${maskAllButLastFour(sbi)}`
      })
    : undefined
