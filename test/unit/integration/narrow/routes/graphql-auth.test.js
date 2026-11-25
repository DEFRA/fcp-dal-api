import hapi from '@hapi/hapi'
import hapiApollo from '@as-integrations/hapi'
import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { config } from '../../../../../app/config.js'

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })

// only the key lookup is mocked - the JWT itself is verified for real
vi.doMock('../../../../../app/data-sources/JWKS.js', () => ({
  JWKS: class {
    getPublicKey() {
      return publicKey
    }
  }
}))

const { context } = await import('../../../../../app/graphql/context.js')
const { apolloServer } = await import('../../../../../app/graphql/server.js')

const signToken = (claims, options = {}) =>
  jwt.sign({ aud: 'api://dal', ...claims }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '1h',
    keyid: 'test-key-id',
    ...options
  })

const authorisedToken = signToken({ appid: config.get('auth.entities.SINGLE_FRONT_DOOR.entityId') })
const noDalAccessToken = signToken({ appid: 'not-a-dal-consumer', groups: ['not-a-dal-group'] })
const expiredToken = signToken(
  { appid: config.get('auth.entities.SINGLE_FRONT_DOOR.entityId') },
  { expiresIn: '-1m' }
)

const validPayload = { query: '{ __typename }' }
const invalidPayload = { query: '{ __typename' }

describe('GraphQL endpoint authorisation', () => {
  let server

  beforeAll(async () => {
    await apolloServer.start()
    server = hapi.server()
    await server.register({
      plugin: hapiApollo.default ?? hapiApollo,
      options: { context, apolloServer, path: '/graphql' }
    })
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    await apolloServer.stop()
  })

  const post = (payload, authorization) =>
    server.inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json',
        ...(authorization && { authorization: `Bearer ${authorization}` })
      },
      payload
    })

  describe('when auth is enabled', () => {
    beforeEach(() => {
      config.set('auth.disabled', false)
    })
    afterEach(() => {
      config.set('auth.disabled', true)
    })

    test.each([
      ['no Authorization header', 'a valid', validPayload, undefined],
      ['no Authorization header', 'an invalid', invalidPayload, undefined],
      ['an expired token', 'a valid', validPayload, expiredToken],
      ['a malformed token', 'an invalid', invalidPayload, 'not-a-jwt']
    ])('responds 401 to a request with %s and %s payload', async (_a, _b, payload, token) => {
      const response = await post(payload, token)

      expect(response.statusCode).toBe(401)
      expect(JSON.parse(response.payload).data).toBeUndefined()
      expect(JSON.parse(response.payload).errors).toEqual([
        expect.objectContaining({
          message: 'Authorization failed, a valid authorization token is required',
          extensions: expect.objectContaining({ code: 'UNAUTHORIZED' })
        })
      ])
    })

    test.each([
      ['a valid', validPayload],
      ['an invalid', invalidPayload]
    ])(
      'responds 403 to a request with a token without DAL access and %s payload',
      async (_a, payload) => {
        const response = await post(payload, noDalAccessToken)

        expect(response.statusCode).toBe(403)
        expect(JSON.parse(response.payload).data).toBeUndefined()
        expect(JSON.parse(response.payload).errors).toEqual([
          expect.objectContaining({
            message: 'Authorization failed, requester is not an authorised DAL consumer',
            extensions: expect.objectContaining({ code: 'FORBIDDEN' })
          })
        ])
      }
    )

    test('responds 200 with the requested data to an authorised request with a valid payload', async () => {
      const response = await post(validPayload, authorisedToken)

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({ data: { __typename: 'Query' } })
    })

    test('responds 400 with a graphql error to an authorised request with an invalid payload', async () => {
      const response = await post(invalidPayload, authorisedToken)

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.payload).errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({ code: 'GRAPHQL_PARSE_FAILED' })
        })
      ])
    })
  })

  describe('when auth is disabled', () => {
    test('responds 200 to a request with no Authorization header', async () => {
      expect(config.get('auth.disabled')).toBe(true)

      const response = await post(validPayload)

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({ data: { __typename: 'Query' } })
    })
  })
})
