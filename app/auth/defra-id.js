import jwt from 'jsonwebtoken'
import { BadRequest } from '../errors/graphql.js'

export function extractCrnFromDefraIdToken(token) {
  const { payload } = jwt.decode(token, { complete: true })
  if (payload?.contactId) {
    return payload.contactId
  }
  throw new BadRequest('Defra ID token does not contain crn')
}

export const extractOrgIdFromDefraIdToken = (sbi, token) => {
  const { payload } = jwt.decode(token, { complete: true })
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
