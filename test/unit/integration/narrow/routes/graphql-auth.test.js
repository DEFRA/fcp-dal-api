import hapi from '@hapi/hapi'
import hapiApollo from '@as-integrations/hapi'
import jwt from 'jsonwebtoken'
import { getIntrospectionQuery } from 'graphql'
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

// a real root field, so it is never allowed anonymously (unlike `{ __typename }`)
const validPayload = { query: '{ business(sbi: "823456789") { sbi } }' }
const invalidPayload = { query: '{ __typename' }
const typenamePayload = { query: '{ __typename }' }
const introspectionPayload = { query: getIntrospectionQuery() }
const mixedPayload = {
  query: '{ __schema { queryType { name } } business(sbi: "823456789") { sbi } }'
}

const unauthorizedError = expect.objectContaining({
  message: 'Authorization failed, a valid authorization token is required',
  extensions: expect.objectContaining({ code: 'UNAUTHORIZED' })
})
const forbiddenError = expect.objectContaining({
  message: 'Authorization failed, requester is not an authorised DAL consumer',
  extensions: expect.objectContaining({ code: 'FORBIDDEN' })
})

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

  const useConfig = (path, value) => {
    let originalValue
    beforeEach(() => {
      originalValue = config.get(path)
      config.set(path, value)
    })
    afterEach(() => {
      config.set(path, originalValue)
    })
  }

  describe('when auth is enabled', () => {
    useConfig('auth.disabled', false)

    describe('when the dashboard is disabled', () => {
      useConfig('graphqlDashboardEnabled', false)

      test.each([
        ['no Authorization header', 'a valid', validPayload, undefined],
        ['no Authorization header', 'an invalid', invalidPayload, undefined],
        ['no Authorization header', 'an introspection', introspectionPayload, undefined],
        ['an expired token', 'a valid', validPayload, expiredToken],
        ['a malformed token', 'an invalid', invalidPayload, 'not-a-jwt']
      ])('responds 401 to a request with %s and %s payload', async (_a, _b, payload, token) => {
        const response = await post(payload, token)

        expect(response.statusCode).toBe(401)
        expect(JSON.parse(response.payload).data).toBeUndefined()
        expect(JSON.parse(response.payload).errors).toEqual([unauthorizedError])
      })

      test.each([
        ['a valid', validPayload],
        ['an invalid', invalidPayload],
        ['an introspection', introspectionPayload]
      ])(
        'responds 403 to a request with a token without DAL access and %s payload',
        async (_a, payload) => {
          const response = await post(payload, noDalAccessToken)

          expect(response.statusCode).toBe(403)
          expect(JSON.parse(response.payload).data).toBeUndefined()
          expect(JSON.parse(response.payload).errors).toEqual([forbiddenError])
        }
      )
    })

    describe('when the dashboard is enabled', () => {
      useConfig('graphqlDashboardEnabled', true)

      test.each([
        ['no Authorization header', undefined],
        ['a token without DAL access', noDalAccessToken]
      ])('responds 200 to an introspection query with %s', async (_name, token) => {
        const response = await post(introspectionPayload, token)

        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.payload).errors).toBeUndefined()
        expect(JSON.parse(response.payload).data.__schema.queryType.name).toBe('Query')
      })

      test('responds 200 to a __typename query with no Authorization header', async () => {
        const response = await post(typenamePayload)

        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.payload)).toEqual({ data: { __typename: 'Query' } })
      })

      test.each([
        ['a real field', validPayload],
        ['a real field alongside introspection', mixedPayload]
      ])('responds 401 to a query for %s with no Authorization header', async (_name, payload) => {
        const response = await post(payload)

        expect(response.statusCode).toBe(401)
        expect(JSON.parse(response.payload).data).toBeUndefined()
        expect(JSON.parse(response.payload).errors).toEqual([unauthorizedError])
      })

      test('responds 403 to a query for a real field with a token without DAL access', async () => {
        const response = await post(validPayload, noDalAccessToken)

        expect(response.statusCode).toBe(403)
        expect(JSON.parse(response.payload).errors).toEqual([forbiddenError])
      })

      test('responds 400 to an invalid payload with no Authorization header', async () => {
        const response = await post(invalidPayload)

        expect(response.statusCode).toBe(400)
        expect(JSON.parse(response.payload).errors).toEqual([
          expect.objectContaining({
            extensions: expect.objectContaining({ code: 'GRAPHQL_PARSE_FAILED' })
          })
        ])
      })
    })

    test('responds 200 with the requested data to an authorised request with a valid payload', async () => {
      const response = await post(typenamePayload, authorisedToken)

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

      const response = await post(typenamePayload)

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({ data: { __typename: 'Query' } })
    })
  })
})
