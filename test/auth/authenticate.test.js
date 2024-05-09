import { jest } from '@jest/globals'

import jwt from 'jsonwebtoken'

import { getAuth } from '../../app/auth/authenticate.js'

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
const mockRequest = { headers: { authorization: `Bearer ${token}` } }
const mockRequestWrongSign = { headers: { authorization: `Bearer ${tokenDiffSecret}` } }
const incorrectTokenReq = { headers: { authorization: 'Bearer WRONG' } }
const decodedToken = jwt.decode(token, 'secret')
const mockPublicKeyFunc = jest.fn()

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
})
