import { jest } from '@jest/globals'
import { buildSchema, findBreakingChanges } from 'graphql'
import jwt from 'jsonwebtoken'
import { createJWKSMock } from 'mock-jwks'

import {
  authDirectiveTransformer,
  checkAuthGroup,
  getAuth,
  getJwtPublicKey
} from '../../app/auth/authenticate.js'
import { Unauthorized } from '../../app/errors/graphql'

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

describe('getJwtPublicKey', () => {
  let jwksMock
  let stopMock
  beforeEach(() => {
    jwksMock = createJWKSMock(
      'https://login.microsoftonline.com',
      `/${process.env.API_TENANT_ID}/discovery/v2.0/keys`
    )
    stopMock = jwksMock.start()
  })

  afterEach(() => {
    stopMock()
  })

  test('should return the public key', async () => {
    const token = jwksMock.token({
      aud: 'private',
      iss: 'master'
    })

    const key = await getJwtPublicKey(jwksMock.kid())

    const verified = jwt.verify(token, key)

    expect(verified.aud).toEqual('private')
    expect(verified.iss).toEqual('master')
  })
})

describe('getAuth', () => {
  test('should return an empty object when no authHeader is provided', async () => {
    expect(await getAuth({})).toEqual({})
  })

  test('should return decoded token when token is valid', async () => {
    mockPublicKeyFunc.mockReturnValue('secret')
    expect(await getAuth(mockRequest, mockPublicKeyFunc)).toEqual(decodedToken)
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
  })

  test('should return an empty object when token cannot be decoded', async () => {
    expect(await getAuth(incorrectTokenReq, mockPublicKeyFunc)).toEqual({})
    expect(mockPublicKeyFunc).not.toHaveBeenCalled()
  })

  test('should return an empty object when token verification fails, due to incorrect signing key', async () => {
    expect(await getAuth(mockRequestWrongSign, mockPublicKeyFunc)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
  })

  test('should return an empty object when token verification fails, due to token expiry', async () => {
    const error = new Error('TokenExpiredError')
    error.name = 'TokenExpiredError'
    mockPublicKeyFunc.mockImplementation(() => {
      throw error
    })
    expect(await getAuth(mockRequestWrongSign, mockPublicKeyFunc)).toEqual({})
    expect(mockPublicKeyFunc).toHaveBeenCalledWith(undefined)
  })
})

describe('checkAuthGroup', () => {
  const adminGroupId = process.env.ADMIN_AD_GROUP_ID

  it('checkAuthGroup should not throw an error for admins with correct group', () => {
    expect(() => checkAuthGroup([adminGroupId], adminGroupId)).not.toThrow()
  })

  it('checkAuthGroup should throw Unauthorized when user is not in AD groups', () => {
    const testGroup = 'ADMIN'
    expect(() => checkAuthGroup([], testGroup)).toThrow(Unauthorized)
  })

  it('checkAuthGroup should throw Unauthorized when user is not in specified AD group', () => {
    const testGroup = 'NON_EXISTENT_GROUP'
    expect(() => checkAuthGroup([testGroup], adminGroupId)).toThrow(
      Unauthorized
    )
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
  it('authDirectiveTransformer should not impact output schema', async () => {
    process.env.DISABLE_AUTH = true
    const transformedSchema = authDirectiveTransformer(schema)
    expect(findBreakingChanges(schema, transformedSchema)).toHaveLength(0)
  })
})
