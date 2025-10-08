import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

export async function validateAzureADToken(token) {
  try {
    // Initialize JWKS client to fetch public keys from Azure AD
    const client = jwksClient({
      jwksUri:
        'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/discovery/v2.0/keys'
    })

    // Function to get the signing key
    function getKey(header, callback) {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err, null)
        } else {
          const signingKey = key.getPublicKey()
          callback(null, signingKey)
        }
      })
    }

    // Verify and decode the token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      })
    })

    // Validate specific claims
    if (!decoded.scp.includes('User.Read')) {
      throw new Error('Token does not have required User.Read scope')
    }

    return {
      isValid: true,
      decoded
    }
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    }
  }
}
