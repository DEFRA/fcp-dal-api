import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { buildSchema, findBreakingChanges, graphql, GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'
import { config } from '../../../app/config.js'
import { Unauthorized } from '../../../app/errors/graphql.js'

const info = jest.fn()
jest.unstable_mockModule('../../../app/logger/logger.js', () => ({
  logger: { info, debug: jest.fn(), warn: jest.fn(), error: jest.fn() }
}))
const {
  authDirectiveTransformer,
  authGroups,
  checkAuthGroup,
  checkServiceAccountAccess,
  getAuth,
  getRequestingService,
  isAdminCaller
} = await import('../../../app/auth/authenticate.js')

const tokenPayload = {
  aud: 'api://appid',
  iss: 'https://sts.windows.net/appid/',
  aio: 'aio',
  appid: 'appid',
  appidacr: '1',
  groups: ['appid'],
  idp: 'https://sts.windows.net/appid/',
  oid: 'oid',
  rh: 'rh',
  sub: 'sub',
  tid: 'tid',
  uti: 'uti',
  ver: '1.0',
  serviceId: 'service-id',
  correlationId: 'correlation-id',
  currentRelationshipId: 'relationship-id',
  sessionId: 'session-id',
  contactId: 'contact-id',
  relationships: ['orgId:sbi:company name:'],
  roles: ['role-id'],
  azp: 'azp-id'
}

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048
})
const { privateKey: wrongPrivateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048
})

const token = jwt.sign({ ...tokenPayload, email: 'pii@defra.gov.uk' }, privateKey, {
  algorithm: 'RS256',
  expiresIn: '1h',
  keyid: 'mock-key-id-123'
})
const tokenDiffSecret = jwt.sign(tokenPayload, wrongPrivateKey, {
  algorithm: 'RS256',
  expiresIn: '1h',
  keyid: 'mock-key-id-123'
})
const requestInfo = { remoteAddress: '0.0.0.0' }
const mockRequest = (token) => ({
  headers: {
    authorization: `Bearer ${token}`
  },
  info: requestInfo
})
const decodedToken = jwt.decode(token)
const mockPublicKeyFunc = jest.fn()
const mockJWKSDataSource = { getPublicKey: mockPublicKeyFunc }

describe('authenticate', () => {
  describe('getAuth', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('when auth is disabled', () => {
      test('should return an object with default appid when request has no auth', async () => {
        expect(await getAuth({})).toEqual({ appid: 'auth-disabled-no-appid' })
      })
    })

    describe('when auth is enabled', () => {
      it('should return an object with default appid when request has no auth', async () => {
        config.set('auth.disabled', false) // temporarily set auth to enabled for this test
        const { getAuth } = await import('../../../app/auth/authenticate.js?r=3')
        config.set('auth.disabled', true) // reset to original state after import

        expect(await getAuth({})).toEqual({ appid: 'no-appid-no-auth-provided' })
      })

      describe('with a valid token', () => {
        test('should return decoded token, and log payload details', async () => {
          mockPublicKeyFunc.mockResolvedValue(publicKey)
          const tokenPayload = await getAuth(mockRequest(token), mockJWKSDataSource)

          expect(tokenPayload).toEqual(decodedToken)
          expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
          expect(info).toHaveBeenCalledTimes(1)
          expect(info.mock.calls[0]).toEqual([
            '#DAL Request authentication - JWT verified',
            {
              type: 'http',
              code: 'DAL_REQUEST_AUTHENTICATION_001',
              requestTimeMs: expect.any(Number),
              request: requestInfo,
              tenant: {
                message: expect.stringMatching(
                  new RegExp(
                    '{"appid":"appid","aud":"api://appid","oid":"oid",' +
                      '"serviceId":"service-id","correlationId":"correlation-id",' +
                      '"currentRelationshipId":"relationship-id","sessionId":"session-id",' +
                      '"sub":"sub","tid":"tid","email":"defra.gov.uk",' +
                      '"contactId":"\\*\\*\\*\\*\\*\\*t-id",' +
                      '"relationships":\\["orgId:sbi:company name:"\\],' +
                      '"groups":\\["appid"\\],"roles":\\["role-id"\\],"azp":"azp-id",' +
                      '"iat":[0-9]+,"exp":[0-9]+,"ver":"1\\.0"}'
                  )
                )
              }
            }
          ])
        })

        test('should return decoded token, and log payload details (no email check)', async () => {
          mockPublicKeyFunc.mockResolvedValue(publicKey)
          const tokenNoEmail = jwt.sign(tokenPayload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            keyid: 'mock-key-id-123'
          })

          expect(await getAuth(mockRequest(tokenNoEmail), mockJWKSDataSource)).toEqual(
            jwt.decode(tokenNoEmail)
          )
          expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
          expect(info).toHaveBeenCalledTimes(1)
          expect(info.mock.calls[0]).toEqual([
            '#DAL Request authentication - JWT verified',
            {
              type: 'http',
              code: 'DAL_REQUEST_AUTHENTICATION_001',
              requestTimeMs: expect.any(Number),
              request: requestInfo,
              tenant: {
                message: expect.stringMatching(
                  new RegExp(
                    '{"appid":"appid","aud":"api://appid","oid":"oid",' +
                      '"serviceId":"service-id","correlationId":"correlation-id",' +
                      '"currentRelationshipId":"relationship-id","sessionId":"session-id",' +
                      '"sub":"sub","tid":"tid","contactId":"\\*\\*\\*\\*\\*\\*t-id",' +
                      '"relationships":\\["orgId:sbi:company name:"\\],' +
                      '"groups":\\["appid"\\],"roles":\\["role-id"\\],"azp":"azp-id",' +
                      '"iat":[0-9]+,"exp":[0-9]+,"ver":"1\\.0"}'
                  )
                )
              }
            }
          ])
        })
      })

      test('returns a no-appid object if token cannot be decoded', async () => {
        expect(await getAuth(mockRequest('WRONG'), mockJWKSDataSource)).toEqual({
          appid: 'no-appid-token-verification-failed'
        })
        expect(mockPublicKeyFunc).not.toHaveBeenCalled()
      })

      test('returns a no-appid object if verification fails with incorrect key', async () => {
        mockPublicKeyFunc.mockResolvedValue(publicKey)
        expect(await getAuth(mockRequest(tokenDiffSecret), mockJWKSDataSource)).toEqual({
          appid: 'no-appid-token-verification-failed'
        })
        expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
      })

      test('returns a no-appid object if verification fails with token expiry', async () => {
        const error = new Error('TokenExpiredError')
        error.name = 'TokenExpiredError'
        mockPublicKeyFunc.mockImplementation(() => {
          throw error
        })
        expect(await getAuth(mockRequest(token), mockJWKSDataSource)).toEqual({
          appid: 'no-appid-token-verification-failed'
        })
        expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
      })
    })
  })

  describe('checkAuthGroup', () => {
    const adminGroupId = config.get('auth.groups.ADMIN')

    it('checkAuthGroup should not throw an error for admins with correct group', () => {
      expect(() => checkAuthGroup([adminGroupId], [adminGroupId])).not.toThrow()
    })

    it('checkAuthGroup should throw Unauthorized when user is not in AD groups', () => {
      const testGroup = 'ADMIN'
      expect(() => checkAuthGroup([], [testGroup])).toThrow(Unauthorized)
    })

    it('checkAuthGroup should throw Unauthorized when user is not in specified AD group', () => {
      const testGroup = 'NON_EXISTENT_GROUP'
      expect(() => checkAuthGroup([testGroup], [adminGroupId])).toThrow(Unauthorized)
    })

    it('checkAuthGroup should throw Unauthorized when AD group is null in token', () => {
      const testGroup = null
      expect(() => checkAuthGroup([testGroup], [adminGroupId])).toThrow(Unauthorized)
    })

    it('checkAuthGroup should not throw for an ADMIN caller regardless of the allow-list', () => {
      expect(() => checkAuthGroup([adminGroupId], ['SOME_GROUP'])).not.toThrow()
    })

    it('checkAuthGroup should not throw for a caller with matching group membership', () => {
      const sfdGroupId = config.get('auth.groups.SINGLE_FRONT_DOOR')
      expect(() => checkAuthGroup([sfdGroupId], ['SINGLE_FRONT_DOOR'])).not.toThrow()
    })

    it('expect authGroups to match .env.test setup', () => {
      expect(authGroups).toEqual({
        ADMIN: 'some-ad-group-id',
        CONSOLIDATED_VIEW: 'consolidated-view-ad-group-id',
        SINGLE_FRONT_DOOR: 'single-front-door-ad-group-id',
        SFI_REFORM: 'sfi-reform-ad-group-id',
        LAND_GRANTS_API: 'land-grants-api-ad-group-id'
      })
    })
  })

  describe('isAdminCaller', () => {
    const adminGroupId = config.get('auth.groups.ADMIN')
    const sfdGroupId = config.get('auth.groups.SINGLE_FRONT_DOOR')

    it('returns true when ADMIN is among the requester groups', () => {
      expect(isAdminCaller([sfdGroupId, adminGroupId])).toBe(true)
    })

    it('returns false when ADMIN is not among the requester groups', () => {
      expect(isAdminCaller([sfdGroupId])).toBe(false)
    })

    it('returns false for an empty group list', () => {
      expect(isAdminCaller([])).toBe(false)
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

  describe('getRequestingService', () => {
    describe('when auth is disabled', () => {
      const originalConfig = { ...config }
      const configMockPath = {
        'auth.disabled': true
      }

      beforeEach(() => {
        jest
          .spyOn(config, 'get')
          .mockImplementation((path) =>
            configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
          )
      })

      it('should return Auth Disabled', () => {
        expect(getRequestingService(null)).toBe('auth-disabled')
      })
    })

    describe('when auth is enabled', () => {
      const originalConfig = { ...config }
      const configMockPath = {
        'auth.disabled': false
      }

      beforeEach(() => {
        jest
          .spyOn(config, 'get')
          .mockImplementation((path) =>
            configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
          )
      })

      const adminGroupId = config.get('auth.groups.ADMIN')
      const consolidatedViewGroupId = config.get('auth.groups.CONSOLIDATED_VIEW')
      const sfiReformGroupId = config.get('auth.groups.SFI_REFORM')
      const singleFrontDoorGroupId = config.get('auth.groups.SINGLE_FRONT_DOOR')
      const landGrantsApiGroupId = config.get('auth.groups.LAND_GRANTS_API')

      it('should return the service name for a single recognised group', () => {
        expect(getRequestingService([consolidatedViewGroupId])).toBe('consolidated-view')
        expect(getRequestingService([sfiReformGroupId])).toBe('grants-platform')
        expect(getRequestingService([singleFrontDoorGroupId])).toBe('single-front-door')
        expect(getRequestingService([landGrantsApiGroupId])).toBe('land-grants-api')
      })

      it('should return null when the only group present is ADMIN', () => {
        expect(getRequestingService([adminGroupId])).toBeNull()
      })

      it('should return the first group in the array that maps to a service, skipping ADMIN', () => {
        expect(getRequestingService([adminGroupId, sfiReformGroupId])).toBe('grants-platform')
      })

      it('should honour input array order over any fixed preference between services', () => {
        expect(getRequestingService([sfiReformGroupId, consolidatedViewGroupId])).toBe(
          'grants-platform'
        )
        expect(getRequestingService([consolidatedViewGroupId, sfiReformGroupId])).toBe(
          'consolidated-view'
        )
      })

      it('should return null when no groups are recognised', () => {
        expect(getRequestingService(['unrecognised-group'])).toBeNull()
      })

      it('should return null when groups is an empty array', () => {
        expect(getRequestingService([])).toBeNull()
      })

      it('should throw when groups is undefined', () => {
        expect(() => getRequestingService(undefined)).toThrow()
      })
    })
  })

  describe('authDirectiveTransformer', () => {
    const schema = buildSchema(`#graphql
    type Query {
      customer(crn: ID!): Customer
      gatedQueryFieldDefault: String @auth(requires: [SINGLE_FRONT_DOOR])
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

    directive @auth(requires: [AuthRole!]! = [TEST]) on OBJECT | FIELD_DEFINITION
  `)

    const originalConfig = { ...config }
    const configMockPath = {
      'auth.disabled': true
    }

    beforeEach(() => {
      jest
        .spyOn(config, 'get')
        .mockImplementation((path) =>
          configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
        )
    })

    it('authDirectiveTransformer should not impact output schema', async () => {
      const transformedSchema = authDirectiveTransformer(schema)
      expect(findBreakingChanges(schema, transformedSchema)).toHaveLength(0)
    })

    describe('service account gating', () => {
      const sfdGroupId = config.get('auth.groups.SINGLE_FRONT_DOOR')
      const adminGroupId = config.get('auth.groups.ADMIN')
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

      const serviceAccountContext = (groups) => ({
        auth: { groups },
        authContext: { serviceAccount: 'service-account@example.com' }
      })

      it('denies a caller with no groups claim', async () => {
        const result = await run('gatedQueryFieldDefault', {
          auth: { appid: 'some-appid' },
          authContext: {}
        })
        expect(result.errors).toEqual([
          new GraphQLError('Authorization failed, you are not in the correct AD groups')
        ])
        expect(result.data.gatedQueryFieldDefault).toBeNull()
      })

      it('allows a non-service-account caller in the required group', async () => {
        const result = await run('gatedQueryFieldDefault', {
          auth: { groups: [sfdGroupId] },
          authContext: {}
        })
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedQueryFieldDefault).toBe('a')
      })

      it('allows a service account on a Query field ', async () => {
        const result = await run('gatedQueryFieldDefault', serviceAccountContext([sfdGroupId]))
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedQueryFieldDefault).toBe('a')
      })

      it('denies a service account access to Mutations', async () => {
        const result = await run('gatedMutationFieldDefault', serviceAccountContext([sfdGroupId]), {
          mutation: true
        })
        expect(result.errors?.[0]).toBeInstanceOf(Object)
        expect(result.errors[0].message).toMatch(/not available to service accounts/)
      })

      it('allows an ADMIN-group service account on a Mutation field', async () => {
        const result = await run(
          'gatedMutationFieldDefault',
          serviceAccountContext([adminGroupId]),
          { mutation: true }
        )
        expect(result.errors).toBeUndefined()
        expect(result.data.gatedMutationFieldDefault).toBe('c')
      })
    })
  })
})
