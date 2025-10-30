import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { buildSchema, findBreakingChanges } from 'graphql'
import jwt from 'jsonwebtoken'
import { config } from '../../../app/config.js'
import { Unauthorized } from '../../../app/errors/graphql.js'

const info = jest.fn()
jest.unstable_mockModule('../../../app/logger/logger.js', () => ({
  logger: { info, debug: jest.fn(), warn: jest.fn(), error: jest.fn() }
}))
const { authDirectiveTransformer, authGroups, checkAuthGroup, getAuth } = await import(
  '../../../app/auth/authenticate.js'
)

const tokenPayload = {
  header: {
    typ: 'JWT',
    alg: 'RS256',
    x5t: 'x5t',
    kid: 'kid'
  },
  payload: {
    aud: 'api://2d731eb1-6721-4349-9cb2-8fe9b0ab53a2',
    iss: 'https://sts.windows.net/2d731eb1-6721-4349-9cb2-8fe9b0ab53a2/',
    iat: 1701713296,
    nbf: 1701713296,
    exp: 1701717196,
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
  },
  signature: 'signature'
}

const token = jwt.sign(
  {
    ...tokenPayload,
    payload: { ...tokenPayload.payload, email: 'pii@defra.gov.uk' }
  },
  'secret',
  {
    expiresIn: '1h'
  }
)
const tokenDiffSecret = jwt.sign(tokenPayload, 'secret2', { expiresIn: '1h' })
const requestInfo = { remoteAddress: '0.0.0.0' }
const mockRequest = (token) => ({
  headers: {
    authorization: `Bearer ${token}`
  },
  info: requestInfo
})
const decodedToken = jwt.decode(token, 'secret')
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
      mockPublicKeyFunc.mockReturnValue('secret')
      expect(await getAuth(mockRequest(token), mockJWKSDataSource)).toEqual(decodedToken)
      expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
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
              '{"aud":"api://2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"serviceId":"service-id","correlationId":"correlation-id",' +
              '"currentRelationshipId":"relationship-id","sessionId":"session-id",' +
              '"sub":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2","email":"defra.gov.uk",' +
              '"contactId":"contact-id","relationships":["orgId:sbi:company name:"],' +
              '"groups":["2d731eb1-6721-4349-9cb2-8fe9b0ab53a2"],"roles":["role-id"],"azp":"azp-id"}'
          }
        }
      ])
    })

    test('should return decoded token, and log payload details (no email check)', async () => {
      mockPublicKeyFunc.mockReturnValue('secret')
      const tokenNoEmail = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' })
      expect(await getAuth(mockRequest(tokenNoEmail), mockJWKSDataSource)).toEqual(
        jwt.decode(tokenNoEmail, 'secret')
      )
      expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
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
              '{"aud":"api://2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"serviceId":"service-id","correlationId":"correlation-id",' +
              '"currentRelationshipId":"relationship-id","sessionId":"session-id",' +
              '"sub":"2d731eb1-6721-4349-9cb2-8fe9b0ab53a2",' +
              '"contactId":"contact-id","relationships":["orgId:sbi:company name:"],' +
              '"groups":["2d731eb1-6721-4349-9cb2-8fe9b0ab53a2"],"roles":["role-id"],"azp":"azp-id"}'
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
    expect(await getAuth(mockRequest(tokenDiffSecret), mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
  })

  test('should return an empty object when token verification fails, due to token expiry', async () => {
    const error = new Error('TokenExpiredError')
    error.name = 'TokenExpiredError'
    mockPublicKeyFunc.mockImplementation(() => {
      throw error
    })
    expect(await getAuth(mockRequest(token), mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
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
