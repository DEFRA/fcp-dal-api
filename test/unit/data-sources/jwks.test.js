import { beforeAll } from '@jest/globals'
import { generateKeyPairSync } from 'node:crypto'
import { jwtVerify } from 'jose'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import { config } from '../../../app/config.js'
const { JWKS } = await import('../../../app/data-sources/JWKS.js')

describe('getJwtPublicKey', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048
  })

  beforeAll(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    nock(config.get('oidc.jwksURI'))
      .get('/')
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
    nock(config.get('oidc.jwksURI'))
      .get('/')
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
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('should return the public key specified by Key ID and algorithm', async () => {
    const jwks = new JWKS()
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
})
