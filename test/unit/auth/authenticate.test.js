import { buildSchema, findBreakingChanges, graphql, GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { config } from '../../../app/config.js'
import { Unauthorized } from '../../../app/errors/graphql.js'

const info = vi.fn()
vi.doMock('../../../app/logger/logger.js', () => ({
  logger: { info, debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
}))
const {
  authDirectiveTransformer,
  checkAuthEntity,
  checkServiceAccountAccess,
  checkUserAccess,
  getAuthorisedEntity
} = await import('../../../app/auth/authenticate.js')

const tokenPayload = {
  aud: 'api://appid',
  iss: 'https://sts.windows.net/appid/',
  aio: 'aio',
  appid: config.get('auth.entities.SINGLE_FRONT_DOOR.entityId'),
  appidacr: '1',
  groups: [config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')],
  idp: 'https://sts.windows.net/appid/',
  oid: 'oid',
  rh: 'rh',
  sub: 'sub',
  tid: 'tid',
  uti: 'uti',
  ver: '1.0',
  roles: ['role-id'],
  azp: 'azp-id'
}

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048
})
const { privateKey: wrongPrivateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048
})

const token = jwt.sign({ ...tokenPayload }, privateKey, {
  algorithm: 'RS256',
  expiresIn: '1h',
  keyid: 'mock-key-id-123'
})
const tokenDiffSecret = jwt.sign(tokenPayload, wrongPrivateKey, {
  algorithm: 'RS256',
  expiresIn: '1h',
  keyid: 'mock-key-id-123'
})
const createConsumerToken = (claims) =>
  jwt.sign({ ...tokenPayload, ...claims }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '1h',
    keyid: 'mock-key-id-123'
  })
const requestInfo = { remoteAddress: '0.0.0.0' }
const mockRequest = (token) => ({
  headers: {
    authorization: `Bearer ${token}`
  },
  info: requestInfo,
  traceId: 'trace-id'
})
const mockPublicKeyFunc = vi.fn()
const mockJWKSDataSource = { getPublicKey: mockPublicKeyFunc }

describe('authenticate', () => {
  describe('getAuthorisedEntity', () => {
    describe('when auth is disabled', () => {
      test('should return default auth details', async () => {
        expect(await getAuthorisedEntity({})).toEqual({
          entityId: 'auth-disabled-no-entityId',
          serviceName: 'unknown-unauthorised-service'
        })
      })
    })

    describe('when auth is enabled', () => {
      beforeEach(() => {
        config.set('auth.disabled', false) // temporarily set auth to enabled for this test
      })
      afterEach(() => {
        config.set('auth.disabled', true) // reset to original state after import
      })

      it('should return default auth details when request has no auth', async () => {
        const { getAuthorisedEntity } = await import('../../../app/auth/authenticate.js?r=3')

        expect(await getAuthorisedEntity({})).toEqual({
          entityId: 'no-entityId--no-auth-provided',
          serviceName: 'unknown-unauthorised-service'
        })
      })

      describe('with a valid token', () => {
        test('should return resolved auth details, and log payload details', async () => {
          mockPublicKeyFunc.mockResolvedValue(publicKey)
          const auth = await getAuthorisedEntity(mockRequest(token), mockJWKSDataSource)

          expect(auth).toEqual({
            entityId: config.get('auth.entities.SINGLE_FRONT_DOOR.entityId'),
            authName: 'SINGLE_FRONT_DOOR',
            serviceName: 'single-front-door'
          })
          expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
          expect(info).toHaveBeenCalledTimes(1)
          expect(info.mock.calls[0]).toEqual([
            '#DAL Request authentication - JWT verified',
            {
              type: 'http',
              code: 'DAL_REQUEST_AUTHENTICATION_001',
              traceId: 'trace-id',
              requestTimeMs: expect.any(Number),
              request: requestInfo,
              tenant: {
                message: expect.stringMatching(
                  new RegExp(
                    `{"appid":"${config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')}","aud":"api://appid","oid":"oid",` +
                      `"sub":"sub","tid":"tid","groups":\\["${config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')}"\\],"roles":\\["role-id"\\],"azp":"azp-id",` +
                      '"iat":[0-9]+,"exp":[0-9]+,"ver":"1\\.0"}'
                  )
                )
              }
            }
          ])
        })
      })

      test('matches the azp claim when the appid is not available (i.e. a v2 token)', async () => {
        const entityId = config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')
        mockPublicKeyFunc.mockResolvedValue(publicKey)

        expect(
          await getAuthorisedEntity(
            mockRequest(createConsumerToken({ azp: entityId })),
            mockJWKSDataSource
          )
        ).toEqual({
          entityId: config.get('auth.entities.SINGLE_FRONT_DOOR.entityId'),
          authName: 'SINGLE_FRONT_DOOR',
          serviceName: 'single-front-door'
        })
      })

      test('matches an authorised group when neither appid claim is an authorised entity', async () => {
        const entityId = config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')
        mockPublicKeyFunc.mockResolvedValue(publicKey)

        expect(
          await getAuthorisedEntity(
            mockRequest(
              createConsumerToken({
                appid: 'unknown-app',
                groups: ['unrecognised-group', entityId]
              })
            ),
            mockJWKSDataSource
          )
        ).toEqual({
          entityId,
          authName: 'SINGLE_FRONT_DOOR',
          serviceName: 'single-front-door'
        })
      })

      test('prefers the ADMIN group as the authorised entity, if available', async () => {
        const entityId = config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')
        const admin = config.get('auth.entities.ADMIN.entityId')
        mockPublicKeyFunc.mockResolvedValue(publicKey)

        expect(
          await getAuthorisedEntity(
            mockRequest(
              createConsumerToken({
                appid: 'unknown-app',
                groups: ['unrecognised-group', entityId, admin]
              })
            ),
            mockJWKSDataSource
          )
        ).toEqual({ entityId: admin, authName: 'ADMIN', serviceName: 'admin' })
      })

      test('returns unauthorised auth details if token cannot be decoded', async () => {
        expect(await getAuthorisedEntity(mockRequest('WRONG'), mockJWKSDataSource)).toEqual({
          entityId: 'no-entityId--token-verification-failed',
          serviceName: 'unknown-unauthorised-service'
        })
        expect(mockPublicKeyFunc).not.toHaveBeenCalled()
      })

      test('returns unauthorised auth details if verification fails with incorrect key', async () => {
        mockPublicKeyFunc.mockResolvedValue(publicKey)
        expect(await getAuthorisedEntity(mockRequest(tokenDiffSecret), mockJWKSDataSource)).toEqual(
          {
            entityId: 'no-entityId--token-verification-failed',
            serviceName: 'unknown-unauthorised-service'
          }
        )
        expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
      })

      test('returns unauthorised auth details if verification fails with token expiry', async () => {
        const error = new Error('TokenExpiredError')
        error.name = 'TokenExpiredError'
        mockPublicKeyFunc.mockImplementation(() => {
          throw error
        })
        expect(await getAuthorisedEntity(mockRequest(token), mockJWKSDataSource)).toEqual({
          entityId: 'no-entityId--token-verification-failed',
          serviceName: 'unknown-unauthorised-service'
        })
        expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
      })
    })
  })

  describe('checkAuthEntity', () => {
    it('allows a service name in the allow-list', () => {
      expect(() => checkAuthEntity('SINGLE_FRONT_DOOR', ['SINGLE_FRONT_DOOR'])).not.toThrow()
    })

    it('throws Unauthorized when the service name is not allowed', () => {
      expect(() => checkAuthEntity('unknown-unauthorised-service', ['SINGLE_FRONT_DOOR'])).toThrow(
        Unauthorized
      )
    })

    it('allows ADMIN regardless of the allow-list', () => {
      expect(() => checkAuthEntity('ADMIN', ['SOME_GROUP'])).not.toThrow()
    })
  })

  describe('checkServiceAccountAccess', () => {
    it('does not throw for a non-service-account caller', () => {
      expect(() => checkServiceAccountAccess(false, false, false)).not.toThrow()
    })

    it('does not throw when the field has serviceAccountPermitted: true', () => {
      expect(() => checkServiceAccountAccess(true, true, false)).not.toThrow()
    })

    it('does not throw for an ADMIN bypass, even with serviceAccountPermitted: false', () => {
      expect(() => checkServiceAccountAccess(true, false, true)).not.toThrow()
    })

    it('throws Unauthorized for a service account on a field with serviceAccountPermitted: false', () => {
      expect(() => checkServiceAccountAccess(true, false, false)).toThrow(Unauthorized)
    })
  })

  describe('checkUserAccess', () => {
    const internalAuthContext = { internalAuthHeader: 'user@defra.gov.uk' }
    const externalAuthContext = { externalAuthHeader: 'Bearer token' }
    const serviceAccountAuthContext = { serviceAccount: 'service-account@example.com' }

    it('does not throw when the field has no userType restriction', () => {
      expect(() => checkUserAccess(internalAuthContext, undefined)).not.toThrow()
      expect(() => checkUserAccess(externalAuthContext, [])).not.toThrow()
    })

    it('does not throw for any caller when userType allows ALL', () => {
      expect(() => checkUserAccess(internalAuthContext, ['ALL'])).not.toThrow()
      expect(() => checkUserAccess(externalAuthContext, ['ALL'])).not.toThrow()
      expect(() => checkUserAccess(serviceAccountAuthContext, ['ALL'])).not.toThrow()
    })

    it('does not throw for an internal caller when userType allows INTERNAL', () => {
      expect(() => checkUserAccess(internalAuthContext, ['INTERNAL'])).not.toThrow()
    })

    it('does not throw for an external caller when userType allows EXTERNAL', () => {
      expect(() => checkUserAccess(externalAuthContext, ['EXTERNAL'])).not.toThrow()
    })

    it('throws Unauthorized for an internal caller when userType only allows EXTERNAL', () => {
      expect(() => checkUserAccess(internalAuthContext, ['EXTERNAL'])).toThrow(Unauthorized)
    })

    it('throws Unauthorized for an external caller when userType only allows INTERNAL', () => {
      expect(() => checkUserAccess(externalAuthContext, ['INTERNAL'])).toThrow(Unauthorized)
    })

    it('throws Unauthorized for a service account when the field has a userType restriction', () => {
      expect(() => checkUserAccess(serviceAccountAuthContext, ['INTERNAL'])).toThrow(Unauthorized)
    })
  })

  describe('authDirectiveTransformer', () => {
    const schema = buildSchema(`#graphql
    type Query {
      customer(crn: ID!): Customer
      gatedQueryFieldDefault: String @auth(requires: [SINGLE_FRONT_DOOR])
      gatedQueryFieldInternalOnly: String @auth(requires: [SINGLE_FRONT_DOOR], userType: [INTERNAL])
      open: String
    }

    type Mutation {
      gatedMutationFieldDefault: String @auth(requires: [SINGLE_FRONT_DOOR])
    }

    type Customer {
      """
      The unique identifier of the customer.
      """
      personId: ID!
      """
      The CRN (Customer Reference Number) of the customer.
      """
      crn: ID! @auth(requires: [TEST])
    }

    enum AuthRole {
      TEST
      ADMIN
      SINGLE_FRONT_DOOR
    }

    enum UserAccessType {
      INTERNAL
      EXTERNAL
      ALL
    }

    directive @auth(requires: [AuthRole!]! = [TEST], userType: [UserAccessType!]) on OBJECT | FIELD_DEFINITION
  `)

    const originalConfig = { ...config }
    const configMockPath = {
      'auth.disabled': true
    }

    beforeEach(() => {
      vi.spyOn(config, 'get').mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
    })

    it('authDirectiveTransformer should not impact output schema', async () => {
      const transformedSchema = authDirectiveTransformer(schema)
      expect(findBreakingChanges(schema, transformedSchema)).toHaveLength(0)
    })

    describe('service account gating', () => {
      const sfdEntityId = config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')
      const adminEntityId = config.get('auth.entities.ADMIN.entityId')
      const rootValue = {
        gatedQueryFieldDefault: 'a',
        gatedQueryFieldExplicitlyClosed: 'b',
        gatedMutationFieldDefault: 'c',
        gatedMutationFieldExplicitlyOpen: 'd',
        open: 'e'
      }

      const run = (fieldName, contextValue, { mutation = false } = {}) =>
        graphql({
          schema: authDirectiveTransformer(schema),
          source: mutation ? `mutation { ${fieldName} }` : `{ ${fieldName} }`,
          rootValue,
          contextValue
        })

      const serviceAccountContext = (entityId) => ({
        auth: {
          entityId,
          authName: entityId === adminEntityId ? 'ADMIN' : 'SINGLE_FRONT_DOOR',
          serviceName:
            entityId === adminEntityId
              ? 'admin'
              : entityId === sfdEntityId
                ? 'single-front-door'
                : 'unknown-unauthorised-service'
        },
        authContext: { serviceAccount: 'service-account@example.com' }
      })

      it('denies a caller with an unrecognised entity ID', async () => {
        const result = await run('gatedQueryFieldDefault', {
          auth: { entityId: 'unknown-app', serviceName: 'unknown-unauthorised-service' },
          authContext: {}
        })

        expect(result.errors?.[0]).toBeInstanceOf(GraphQLError)
        expect(result.errors[0].message).toEqual(
          'Authorization failed, requester is not able to access this part of the schema'
        )
        expect(result.data.gatedQueryFieldDefault).toBeNull()
      })

      it('allows a non-service-account caller with the required entity ID', async () => {
        const result = await run('gatedQueryFieldDefault', {
          auth: {
            entityId: sfdEntityId,
            authName: 'SINGLE_FRONT_DOOR',
            serviceName: 'single-front-door'
          },
          authContext: {}
        })
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedQueryFieldDefault).toBe('a')
      })

      it('allows a service account on a Query field ', async () => {
        const result = await run('gatedQueryFieldDefault', serviceAccountContext(sfdEntityId))
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedQueryFieldDefault).toBe('a')
      })

      it('denies a service account access to Mutations', async () => {
        const result = await run('gatedMutationFieldDefault', serviceAccountContext(sfdEntityId), {
          mutation: true
        })
        expect(result.errors?.[0]).toBeInstanceOf(GraphQLError)
        expect(result.errors[0].message).toMatch(/not available to service accounts/)
      })

      it('allows an ADMIN-group service account on a Mutation field', async () => {
        const result = await run(
          'gatedMutationFieldDefault',
          serviceAccountContext(adminEntityId),
          { mutation: true }
        )
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedMutationFieldDefault).toBe('c')
      })

      it('allows an ADMIN app service account on a Mutation field', async () => {
        const result = await run(
          'gatedMutationFieldDefault',
          serviceAccountContext(adminEntityId),
          { mutation: true }
        )
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedMutationFieldDefault).toBe('c')
      })
    })

    describe('user access gating', () => {
      const sfdEntityId = config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')
      const adminEntityId = config.get('auth.entities.ADMIN.entityId')
      const rootValue = { gatedQueryFieldInternalOnly: 'a' }

      const run = (contextValue) =>
        graphql({
          schema: authDirectiveTransformer(schema),
          source: '{ gatedQueryFieldInternalOnly }',
          rootValue,
          contextValue
        })

      it('allows an internal caller', async () => {
        const result = await run({
          auth: {
            entityId: sfdEntityId,
            authName: 'SINGLE_FRONT_DOOR',
            serviceName: 'single-front-door'
          },
          authContext: { internalAuthHeader: 'user@defra.gov.uk' }
        })
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedQueryFieldInternalOnly).toBe('a')
      })

      it('denies an external caller', async () => {
        const result = await run({
          auth: {
            entityId: sfdEntityId,
            authName: 'SINGLE_FRONT_DOOR',
            serviceName: 'single-front-door'
          },
          authContext: { externalAuthHeader: 'Bearer token' }
        })
        expect(result.errors?.[0].message).toMatch(/not available to this user type/)
      })

      it('denies a service account', async () => {
        const result = await run({
          auth: {
            entityId: sfdEntityId,
            authName: 'SINGLE_FRONT_DOOR',
            serviceName: 'single-front-door'
          },
          authContext: { serviceAccount: 'service-account@example.com' }
        })
        expect(result.errors?.[0].message).toMatch(/not available to this user type/)
      })

      it('denies an ADMIN external caller', async () => {
        const result = await run({
          auth: { entityId: adminEntityId, authName: 'ADMIN', serviceName: 'admin' },
          authContext: { externalAuthHeader: 'Bearer token' }
        })
        expect(result.errors?.[0].message).toMatch(/not available to this user type/)
      })

      it('allows an ADMIN internal caller', async () => {
        const result = await run({
          auth: { entityId: adminEntityId, authName: 'ADMIN', serviceName: 'admin' },
          authContext: { internalAuthHeader: 'user@defra.gov.uk' }
        })
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedQueryFieldInternalOnly).toBe('a')
      })

      it('denies an ADMIN service account caller when an internal user is required', async () => {
        const result = await run({
          auth: { entityId: adminEntityId, authName: 'ADMIN', serviceName: 'admin' },
          authContext: { serviceAccount: 'service-account@example.com' }
        })
        expect(result.errors?.[0].message).toMatch(/not available to this user type/)
      })
    })
  })
})
