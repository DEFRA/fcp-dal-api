import { jest } from '@jest/globals'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../../../app/config.js'
import { defraIdContext } from '../../../app/auth/defra-id.js'
import { BadRequest, Unauthorized } from '../../../app/errors/graphql.js'

describe('defraIdContext', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const { privateKey: wrongPrivateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })

  const signToken = (payload, key = privateKey) =>
    jwt.sign(payload, key, { algorithm: 'RS256', expiresIn: '1h' })

  const jwksDataSource = () => ({ getPublicKey: jest.fn().mockResolvedValue(publicKey) })

  describe('crn', () => {
    test('extracts crn from a verified token', async () => {
      const token = signToken({ contactId: '11111111' })

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(ctx.crn()).toEqual('11111111')
    })

    test('throws BadRequest when the verified token does not contain crn', async () => {
      const token = signToken({})

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(() => ctx.crn()).toThrow(new BadRequest('Defra ID token does not contain crn'))
    })

    test('throws the original verification error when the token signature is invalid', async () => {
      const token = signToken({ contactId: '11111111' }, wrongPrivateKey)

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(() => ctx.crn()).toThrow(new Unauthorized('Defra ID token failed verification'))
    })

    test('throws when no token was supplied at all', async () => {
      const ctx = await defraIdContext({ externalAuthHeader: undefined }, jwksDataSource())

      expect(() => ctx.crn()).toThrow(Unauthorized)
    })
  })

  describe('orgId', () => {
    test('extracts orgId when a relationship matches the given SBI', async () => {
      const token = signToken({ relationships: ['orgId1:987654321', 'orgId2:123456789'] })

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(ctx.orgId('123456789')).toBe('orgId2')
    })

    test('throws BadRequest if no relationship matches the given SBI', async () => {
      const token = signToken({ relationships: ['orgId1:987654321', 'orgId2:123456789'] })

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(() => ctx.orgId('000000000')).toThrow(BadRequest)
    })

    test('throws BadRequest if relationships is missing', async () => {
      const token = signToken({})

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(() => ctx.orgId('123456789')).toThrow(BadRequest)
    })

    test('throws BadRequest if relationships is not an array', async () => {
      const token = signToken({ relationships: 'not-an-array' })

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(() => ctx.orgId('123456789')).toThrow(BadRequest)
    })

    test('throws the original verification error when the token signature is invalid', async () => {
      const token = signToken({ relationships: ['orgId2:123456789'] }, wrongPrivateKey)

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwksDataSource())

      expect(() => ctx.orgId('123456789')).toThrow(Unauthorized)
    })
  })

  test('verifies the token once, not on every crn()/orgId() call', async () => {
    const jwks = jwksDataSource()
    const token = signToken({ contactId: '11111111', relationships: ['orgId2:123456789'] })

    const ctx = await defraIdContext({ externalAuthHeader: token }, jwks)
    ctx.crn()
    ctx.crn()
    ctx.orgId('123456789')

    expect(jwks.getPublicKey).toHaveBeenCalledTimes(1)
  })

  describe('defra id verification disabled (when defraId.wellKnownUrl is not configured)', () => {
    let configGetSpy

    beforeEach(() => {
      configGetSpy = jest.spyOn(config, 'get').mockReturnValue(null)
    })

    afterEach(() => {
      configGetSpy.mockRestore()
    })

    test('decodes crn/orgId from the token without verifying its signature', async () => {
      const jwks = jwksDataSource()
      // Signed with a key the configured jwksDataSource would never accept, to prove the
      // signature isn't being checked at all in this mode.
      const token = signToken(
        { contactId: '11111111', relationships: ['orgId2:123456789'] },
        wrongPrivateKey
      )

      const ctx = await defraIdContext({ externalAuthHeader: token }, jwks)

      expect(ctx.crn()).toEqual('11111111')
      expect(ctx.orgId('123456789')).toEqual('orgId2')
      expect(jwks.getPublicKey).not.toHaveBeenCalled()
    })

    test('throws Unauthorized if the token cannot be decoded at all', async () => {
      const ctx = await defraIdContext({ externalAuthHeader: 'not-a-jwt' }, jwksDataSource())

      expect(() => ctx.crn()).toThrow(Unauthorized)
    })
  })
})
