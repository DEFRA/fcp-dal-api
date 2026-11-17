// Maps dummy Defra ID CRNs onto the SBIs they may access (defined in secret DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING).
// Config refuses to start with a mapping outside dev/test, so this can't run in production.
import { decodeJwt } from 'jose'
import { dummyCrnToSbiMapping } from '../config.js'
import { BadRequest, Forbidden } from '../errors/graphql.js'
import { DAL_REQUEST_AUTHENTICATION_DEFRA_ID_MAPPED_001 } from '../logger/codes.js'
import { logger } from '../logger/logger.js'
import { maskAllButLastFour } from '../logger/utils.js'

export const MAPPED_CUSTOMER_FUNCTIONS_MESSAGE =
  'Customer functions are not available for a mapped Defra ID token'

export const MAPPED_MUTATIONS_MESSAGE = 'Mutations are not available for a mapped Defra ID token'

export const MAPPED_BUSINESS_SEARCH_MESSAGE =
  'Business search is not available for a mapped Defra ID token'

/**
 * Builds a Defra ID context for a token whose CRN is in the dummy CRN to SBI mapping. The token's
 * signature and expiry are deliberately not checked, so testers can use long-lived dummy tokens.
 * There is no real customer behind a dummy CRN, so customer functions are refused and business
 * access is restricted to the mapped SBIs.
 *
 * @param {string} token the Defra ID token
 * @param {{ traceId: string }} options
 * @returns {{
 *   isMapped: true,
 *   dummyCrn: string,
 *   crn: () => never,
 *   assertSbiAllowed: (sbi: string) => void
 * } | undefined} undefined when the token cannot be decoded or its CRN is not mapped
 */
export function mappedDefraIdContext(token, { traceId }) {
  let payload
  try {
    payload = decodeJwt(token)
  } catch {
    // not a JWT, so it can't be mapped; let normal verification report the error
    return undefined
  }

  const dummyCrn = `${payload.contactId}`
  const sbis = dummyCrnToSbiMapping.get(dummyCrn)
  if (!sbis) {
    // There is no matching CRN in the mapping; let normal verification handle the token
    return undefined
  }

  logger.warn('#DAL Request authentication - dummy Defra ID CRN mapped to SBIs', {
    type: 'http',
    code: DAL_REQUEST_AUTHENTICATION_DEFRA_ID_MAPPED_001,
    traceId,
    tenant: {
      message: JSON.stringify({
        contactId: maskAllButLastFour(dummyCrn),
        sbis: [...sbis].map(maskAllButLastFour)
      })
    }
  })

  return {
    isMapped: true,
    dummyCrn,
    crn: () => {
      throw new Forbidden(MAPPED_CUSTOMER_FUNCTIONS_MESSAGE)
    },
    assertSbiAllowed: (sbi) => {
      if (!sbis.has(`${sbi}`)) {
        throw new BadRequest('Defra ID token is not valid for the provided SBI')
      }
    }
  }
}
