import Boom from '@hapi/boom'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const client = jwksClient({
  jwksUri:
    'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/discovery/v2.0/keys',
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 3600000,
  rateLimit: true,
  jwksRequestsPerMinute: 10
})

async function getEmailFromToken(token) {
  try {
    const decodedToken = jwt.decode(token, { complete: true })
    const key = (await client.getSigningKey(decodedToken.header.kid)).getPublicKey()
    const verified = jwt.verify(token, key)

    return verified.email || verified.preferred_username
  } catch (error) {
    return null
  }
}

export async function getEmailFromHeaders(headers) {
  const authorizationHeader = headers.authorization
  if (!authorizationHeader) {
    throw Boom.unauthorized('No authorization header')
  }

  const email = await getEmailFromToken(authorizationHeader.split('Bearer ')[1])
  if (!email) {
    throw Boom.forbidden('Invalid authorization header')
  }

  return email
}

export async function getEmailFromQueryParams(query) {
  const token = query.token
  if (!token) {
    throw Boom.unauthorized('No token parameter')
  }

  const email = await getEmailFromToken(token)
  if (!email) {
    throw Boom.forbidden('Invalid token parameter')
  }

  return email
}
