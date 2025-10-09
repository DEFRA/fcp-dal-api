import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const client = jwksClient({
  jwksUri:
    'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/discovery/v2.0/keys',
  cache: true, // Enable caching of signing keys
  cacheMaxEntries: 5, // Cache up to 5 keys
  cacheMaxAge: 3600000, // Cache keys for 1 hour (in ms)
  rateLimit: true, // Enable rate limiting
  jwksRequestsPerMinute: 10 // Limit to 10 requests per minute
})

export async function getEmailFromToken(token) {
  try {
    const decodedToken = jwt.decode(token, { complete: true })
    const key = (await client.getSigningKey(decodedToken.header.kid)).getPublicKey()
    const verified = jwt.verify(token, key)

    return verified.email || verified.preferred_username
  } catch (error) {
    console.log(error)
    return null
  }
}
