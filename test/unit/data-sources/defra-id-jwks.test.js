import { generateKeyPairSync } from 'node:crypto'
import { jwtVerify } from 'jose'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import { config } from '../../../app/config.js'
const { DefraIdJWKS } = await import('../../../app/data-sources/DefraIdJWKS.js')

describe('DefraIdJWKS', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048
  })

  const wellKnownUrl = new URL(config.get('defraId.wellKnownUrl'))
  const jwksUri = `${wellKnownUrl.origin}/discovery/v2.0/keys`

  beforeAll(() => {
    nock.disableNetConnect()
  })

  // jwksSet is cached at module scope once resolved, so without clearing it a successful test
  // would leave later tests unable to exercise the fetch path at all - clearing it before every
  // test makes each one self-contained, regardless of run order.
  beforeEach(() => {
    new DefraIdJWKS().clearJwksSet()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('discovers jwks_uri from the well known configuration and returns the matching public key', async () => {
    nock(wellKnownUrl.origin).get(wellKnownUrl.pathname).reply(200, { jwks_uri: jwksUri })
    nock(wellKnownUrl.origin)
      .get('/discovery/v2.0/keys')
      .reply(200, {
        keys: [
          {
            kty: 'RSA',
            kid: 'mock-key-id-123',
            alg: 'RS256',
            use: 'sig',
            n: publicKey.export({ format: 'jwk' }).n,
            e: publicKey.export({ format: 'jwk' }).e
          }
        ]
      })

    const jwks = new DefraIdJWKS()
    const mockTokenPayload = {
      iat: Math.floor(Date.now() / 1000)
    }
    const mockToken = jwt.sign(mockTokenPayload, privateKey, {
      algorithm: 'RS256'
    })

    expect(
      (
        await jwtVerify(mockToken, await jwks.getPublicKey('mock-key-id-123'), {
          algorithms: ['RS256']
        })
      ).payload
    ).toMatchObject(mockTokenPayload)
  })

  it('throws when the well known configuration request is unsuccessful', async () => {
    nock(wellKnownUrl.origin).get(wellKnownUrl.pathname).reply(500)

    const jwks = new DefraIdJWKS()

    await expect(jwks.getPublicKey('mock-key-id-123')).rejects.toThrow(
      'Failed to fetch Defra ID well known configuration, status: 500'
    )
  })

  it('throws when the well known configuration does not contain a jwks_uri', async () => {
    nock(wellKnownUrl.origin).get(wellKnownUrl.pathname).reply(200, {})

    const jwks = new DefraIdJWKS()

    await expect(jwks.getPublicKey('mock-key-id-123')).rejects.toThrow(
      'Defra ID well known configuration does not contain a jwks_uri'
    )
  })

  it('clearJwksSet forces a fresh discovery on the next call', async () => {
    nock(wellKnownUrl.origin).get(wellKnownUrl.pathname).reply(200, { jwks_uri: jwksUri })
    nock(wellKnownUrl.origin)
      .get('/discovery/v2.0/keys')
      .reply(200, { keys: [{ kty: 'RSA', kid: 'first-kid', alg: 'RS256', use: 'sig' }] })

    const jwks = new DefraIdJWKS()
    const firstJwksSet = await jwks.getRemoteJwksSet()

    jwks.clearJwksSet()

    nock(wellKnownUrl.origin).get(wellKnownUrl.pathname).reply(200, { jwks_uri: jwksUri })
    nock(wellKnownUrl.origin)
      .get('/discovery/v2.0/keys')
      .reply(200, { keys: [{ kty: 'RSA', kid: 'second-kid', alg: 'RS256', use: 'sig' }] })

    const secondJwksSet = await jwks.getRemoteJwksSet()

    expect(secondJwksSet).not.toBe(firstJwksSet)
  })
})
