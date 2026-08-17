import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { buildSchema, findBreakingChanges } from 'graphql'
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
  getAuth,
  getRequestingGroup,
  getRequestingService
} = await import('../../../app/auth/authenticate.js')

const tokenPayload = {
  aud: 'api://2d731eb1-6721-4349-9cb2-8fe9b0ab53a2',
  iss: 'https://sts.windows.net/2d731eb1-6721-4349-9cb2-8fe9b0ab53a2/',
  aio: 'aio',
  appid: '2d731eb1-6721-4349-9cb2-8fe9b0ab53a2',
  appidacr: '1',
  groups: ['2d731eb1-6721-4349-9cb2-8fe9b0ab53a2'],
  idp: 'https://sts.windows.net/2d731eb1-6721-4349-9cb2-8fe9b0ab53a2/',
  oid: '2d731eb1-6721-4349-9cb2-8fe9b0ab53a2',
  rh: 'rh',
  sub: '2d731eb1-6721-4349-9cb2-8fe9b0ab53a2',
  tid: '2d731eb1-6721-4349-9cb2-8fe9b0ab53a2',
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

describe('getAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return an empty object when no authHeader is provided', async () => {
    expect(await getAuth({})).toEqual({})
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
            message:
              '{"appid":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"aud":"api://2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"oid":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2","serviceId":"service-id",' +
              '"correlationId":"correlation-id","currentRelationshipId":"relationship-id",' +
              '"sessionId":"session-id","sub":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"tid":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2","email":"defra.gov.uk",' +
              '"contactId":"******t-id","relationships":["orgId:sbi:company name:"],' +
              '"groups":["2d731eb1-6721-4349-9cb2-8fe9b0ab53a2"],' +
              '"roles":["role-id"],"azp":"azp-id"}'
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
            message:
              '{"appid":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"aud":"api://2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"oid":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2","serviceId":"service-id",' +
              '"correlationId":"correlation-id","currentRelationshipId":"relationship-id",' +
              '"sessionId":"session-id","sub":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"tid":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2","contactId":"******t-id",' +
              '"relationships":["orgId:sbi:company name:"],' +
              '"groups":["2d731eb1-6721-4349-9cb2-8fe9b0ab53a2"],' +
              '"roles":["role-id"],"azp":"azp-id"}'
          }
        }
      ])
    })
  })

  test('should return an empty object when token cannot be decoded', async () => {
    expect(await getAuth(mockRequest('WRONG'), mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).not.toHaveBeenCalled()
  })

  test('should return an empty object when token verification fails, due to incorrect signing key', async () => {
    mockPublicKeyFunc.mockResolvedValue(publicKey)
    expect(await getAuth(mockRequest(tokenDiffSecret), mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
  })

  test('should return an empty object when token verification fails, due to token expiry', async () => {
    const error = new Error('TokenExpiredError')
    error.name = 'TokenExpiredError'
    mockPublicKeyFunc.mockImplementation(() => {
      throw error
    })
    expect(await getAuth(mockRequest(token), mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith('mock-key-id-123')
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

  it('expect authGroups to match .env.test setup', () => {
    expect(authGroups).toEqual({
      ADMIN: 'some-ad-group-id',
      CONSOLIDATED_VIEW: 'consolidated-view-ad-group-id',
      SINGLE_FRONT_DOOR: 'single-front-door-ad-group-id',
      SFI_REFORM: 'sfi-reform-ad-group-id'
    })
  })
})

describe('getRequestingGroup', () => {
  const adminGroupId = config.get('auth.groups.ADMIN')
  const consolidatedViewGroupId = config.get('auth.groups.CONSOLIDATED_VIEW')

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

    it('should return the mock UUID when auth is disabled, regardless of groups', () => {
      expect(getRequestingGroup([adminGroupId])).toBe('00000000-0000-0000-0000-000000000000')
      expect(getRequestingGroup([])).toBe('00000000-0000-0000-0000-000000000000')
      expect(getRequestingGroup(undefined)).toBe('00000000-0000-0000-0000-000000000000')
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

    it('should return the first matching group when user has authorized groups', () => {
      expect(getRequestingGroup([adminGroupId, 'other-group'])).toBe(adminGroupId)
      expect(getRequestingGroup([consolidatedViewGroupId, adminGroupId])).toBe(
        consolidatedViewGroupId
      )
    })

    it('should return undefined when user has no authorized groups', () => {
      expect(getRequestingGroup(['unauthorized-group'])).toBeUndefined()
      expect(getRequestingGroup([])).toBeUndefined()
      expect(getRequestingGroup(undefined)).toBeUndefined()
    })
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

  it('should return the service name for a single recognised group', () => {
    expect(getRequestingService([consolidatedViewGroupId])).toBe('consolidated-view')
    expect(getRequestingService([sfiReformGroupId])).toBe('grants-platform')
    expect(getRequestingService([singleFrontDoorGroupId])).toBe('single-front-door')
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
    }

    type Customer {
      """
      The unique identifier of the customer.
      """
      personId: ID!
      """
      The CRN (Customer Reference Number) of the customer.
      """
      crn: ID! @auth(requires: TEST)
    }

    enum AuthRole {
      TEST
    }

    directive @auth(requires: AuthRole = TEST) on OBJECT | FIELD_DEFINITION
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
})
