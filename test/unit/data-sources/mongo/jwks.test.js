import { beforeAll } from '@jest/globals'
import { generateKeyPairSync } from 'crypto'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import nock from 'nock'
import { config } from '../../../../app/config.js'

const client = new MongoClient(config.get('mongo.mongoUrl'))
client.connect()
const db = client.db(config.get('mongo.databaseName'))
const { MongoJWKS } = await import('../../../../app/data-sources/mongo/JWKS.js')

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
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it('should return the public key and proxy called', async () => {
    const JWKS = new MongoJWKS({ modelOrCollection: db.collection('jwks') })

    const mockTokenPayload = {
      iat: Math.floor(Date.now() / 1000)
    }

    const mockToken = jwt.sign(mockTokenPayload, privateKey, {
      algorithm: 'RS256'
    })

    expect(jwt.verify(mockToken, await JWKS.getPublicKey('mock-key-id-123'))).toEqual(
      mockTokenPayload
    )
  })

  it('should return the public key without proxy', async () => {
    const JWKS = new MongoJWKS({ modelOrCollection: db.collection('jwks') })

    const mockTokenPayload = {
      iat: Math.floor(Date.now() / 1000)
    }

    const mockToken = jwt.sign(mockTokenPayload, privateKey, {
      algorithm: 'RS256'
    })

    expect(jwt.verify(mockToken, await JWKS.getPublicKey('mock-key-id-123'))).toEqual(
      mockTokenPayload
    )
  })
})
