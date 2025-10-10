import { jest } from '@jest/globals'
import { buildSchema, findBreakingChanges } from 'graphql'
import jwt from 'jsonwebtoken'
import {
  authDirectiveTransformer,
  authGroups,
  checkAuthGroup,
  getAuth
} from '../../../app/auth/authenticate.js'
import { config } from '../../../app/config.js'
import { Unauthorized } from '../../../app/errors/graphql.js'

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
    ver: '1.0'
  },
  signature: 'signature'
}

const token = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' })
const tokenDiffSecret = jwt.sign(tokenPayload, 'secret2', { expiresIn: '1h' })
const mockRequest = {
  headers: {
    authorization: `Bearer ${token}`
  },
  info: { remoteAddress: '0.0.0.0' }
}
const mockRequestWrongSign = {
  headers: {
    authorization: `Bearer ${tokenDiffSecret}`
  },
  info: { remoteAddress: '0.0.0.0' }
}
const incorrectTokenReq = {
  headers: { authorization: 'Bearer WRONG' },
  info: { remoteAddress: '0.0.0.0' }
}
const decodedToken = jwt.decode(token, 'secret')
const mockPublicKeyFunc = jest.fn()
const mockJWKSDataSource = {
  getPublicKey: mockPublicKeyFunc
}

describe('getAuth', () => {
  test('should return an empty object when no authHeader is provided', async () => {
    expect(await getAuth({})).toEqual({})
  })

  test('should return decoded token when token is valid', async () => {
    mockPublicKeyFunc.mockReturnValue('secret')
    expect(await getAuth(mockRequest, mockJWKSDataSource)).toEqual(decodedToken)
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
  })

  test('should return an empty object when token cannot be decoded', async () => {
    expect(await getAuth(incorrectTokenReq, mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).not.toHaveBeenCalled()
  })

  test('should return an empty object when token verification fails, due to incorrect signing key', async () => {
    expect(await getAuth(mockRequestWrongSign, mockJWKSDataSource)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
  })

  test('should return an empty object when token verification fails, due to token expiry', async () => {
    const error = new Error('TokenExpiredError')
    error.name = 'TokenExpiredError'
    mockPublicKeyFunc.mockImplementation(() => {
      throw error
    })
    expect(await getAuth(mockRequestWrongSign, mockJWKSDataSource)).toEqual({})
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
