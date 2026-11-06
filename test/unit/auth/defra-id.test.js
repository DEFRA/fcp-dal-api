import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { config } from '../../../app/config.js'
import { BadRequest, Unauthorized } from '../../../app/errors/graphql.js'

const info = vi.fn()
vi.doMock('../../../app/logger/logger.js', () => ({
  logger: { info, debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
}))
const { defraIdContext } = await import('../../../app/auth/defra-id.js')

describe('defraIdContext', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const { privateKey: wrongPrivateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })

  const signToken = (payload, key = privateKey) =>
    jwt.sign(payload, key, { algorithm: 'RS256', expiresIn: '1h' })

  const jwksDataSource = () => ({ getPublicKey: vi.fn().mockResolvedValue(publicKey) })

  const traceId = 'trace-id'

  let configGetSpy

  beforeEach(() => {
    configGetSpy = vi.spyOn(config, 'get').mockReturnValue(false)
  })

  afterEach(() => {
    configGetSpy.mockRestore()
  })

  describe('crn', () => {
    test('extracts crn from a verified token', async () => {
      const token = signToken({ contactId: '11111111' })

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(ctx.crn()).toEqual('11111111')
    })

    test('returns crn as a string when contactId is a number in the token', async () => {
      const token = signToken({ contactId: 11111111 })

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(ctx.crn()).toBe('11111111')
    })

    test('throws BadRequest when contactId is not a string or number', async () => {
      const token = signToken({ contactId: { crn: '11111111' } })

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(() => ctx.crn()).toThrow(new BadRequest('Defra ID token does not contain crn'))
    })

    test('throws BadRequest when the verified token does not contain crn', async () => {
      const token = signToken({})

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(() => ctx.crn()).toThrow(new BadRequest('Defra ID token does not contain crn'))
    })

    test('throws an error when the token signature is invalid', async () => {
      const token = signToken({ contactId: '11111111' }, wrongPrivateKey)

      await expect(
        defraIdContext({ externalAuthHeader: token }, { traceId, jwksDataSource: jwksDataSource() })
      ).rejects.toThrow(new Unauthorized('Defra ID token failed verification'))
    })
  })

  describe('orgId', () => {
    test('extracts orgId when a relationship matches the given SBI', async () => {
      const token = signToken({ relationships: ['orgId1:887654321', 'orgId2:823456789'] })

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(ctx.orgId('823456789')).toBe('orgId2')
    })

    test('throws BadRequest if no relationship matches the given SBI', async () => {
      const token = signToken({ relationships: ['orgId1:887654321', 'orgId2:823456789'] })

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(() => ctx.orgId('800000000')).toThrow(BadRequest)
    })

    test('throws BadRequest if relationships is missing', async () => {
      const token = signToken({})

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(() => ctx.orgId('823456789')).toThrow(BadRequest)
    })

    test('throws BadRequest if relationships is not an array', async () => {
      const token = signToken({ relationships: 'not-an-array' })

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      expect(() => ctx.orgId('823456789')).toThrow(BadRequest)
    })

    test('throws an error when the token signature is invalid', async () => {
      const token = signToken({ relationships: ['orgId2:823456789'] }, wrongPrivateKey)

      await expect(
        defraIdContext({ externalAuthHeader: token }, { traceId, jwksDataSource: jwksDataSource() })
      ).rejects.toThrow(Unauthorized)
    })
  })

  test('resolves to undefined, without attempting verification, when no externalAuthHeader is supplied', async () => {
    const jwks = jwksDataSource()

    const ctx = await defraIdContext(
      { externalAuthHeader: undefined },
      { traceId, jwksDataSource: jwks }
    )

    expect(ctx).toBeUndefined()
    expect(jwks.getPublicKey).not.toHaveBeenCalled()
  })

  test('logs the decoded Defra ID token claims with the traceId', async () => {
    const token = signToken({
      aud: 'defra-id-aud',
      sub: 'sub',
      serviceId: 'service-id',
      correlationId: 'correlation-id',
      currentRelationshipId: 'relationship-id',
      sessionId: 'session-id',
      email: 'pii@defra.gov.uk',
      contactId: '11111111',
      relationships: ['orgId:sbi:company name:'],
      roles: ['role-id']
    })

    await defraIdContext(
      { externalAuthHeader: token },
      { traceId, jwksDataSource: jwksDataSource() }
    )

    expect(info).toHaveBeenCalledTimes(1)
    expect(info.mock.calls[0]).toEqual([
      '#DAL Request authentication - Defra ID token decoded',
      {
        type: 'http',
        code: 'DAL_REQUEST_AUTHENTICATION_DEFRA_ID_001',
        traceId: 'trace-id',
        tenant: {
          message: expect.stringMatching(
            new RegExp(
              '{"aud":"defra-id-aud","sub":"sub","serviceId":"service-id",' +
                '"correlationId":"correlation-id","currentRelationshipId":"relationship-id",' +
                '"sessionId":"session-id","email":"defra.gov.uk","contactId":"\\*\\*\\*\\*1111",' +
                '"relationships":\\["orgId:sbi:company name:"\\],"roles":\\["role-id"\\],' +
                '"iat":[0-9]+,"exp":[0-9]+}'
            )
          )
        }
      }
    ])
  })

  test('masks a numeric contactId in the log', async () => {
    const token = signToken({ contactId: 11111111 })

    await defraIdContext(
      { externalAuthHeader: token },
      { traceId, jwksDataSource: jwksDataSource() }
    )

    const message = JSON.parse(info.mock.calls[0][1].tenant.message)
    expect(message.contactId).toBe('****1111')
  })

  test('does not log a contactId when the token has none', async () => {
    const token = signToken({})

    await defraIdContext(
      { externalAuthHeader: token },
      { traceId, jwksDataSource: jwksDataSource() }
    )

    const message = JSON.parse(info.mock.calls[0][1].tenant.message)
    expect(message).not.toHaveProperty('contactId')
  })

  test('verifies the token once, not on every crn()/orgId() call', async () => {
    const jwks = jwksDataSource()
    const token = signToken({ contactId: '11111111', relationships: ['orgId2:823456789'] })

    const ctx = await defraIdContext(
      { externalAuthHeader: token },
      { traceId, jwksDataSource: jwks }
    )
    ctx.crn()
    ctx.crn()
    ctx.orgId('823456789')

    expect(jwks.getPublicKey).toHaveBeenCalledTimes(1)
  })

  describe('defra id verification disabled (when auth.disabled is true)', () => {
    beforeEach(() => {
      configGetSpy.mockReturnValue(true)
    })

    test('decodes crn/orgId from the token without verifying its signature', async () => {
      const jwks = jwksDataSource()
      // Signed with a key the configured jwksDataSource would never accept, to prove the
      // signature isn't being checked at all in this mode.
      const token = signToken(
        { contactId: '11111111', relationships: ['orgId2:823456789'] },
        wrongPrivateKey
      )

      const ctx = await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwks }
      )

      expect(ctx.crn()).toEqual('11111111')
      expect(ctx.orgId('823456789')).toEqual('orgId2')
      expect(jwks.getPublicKey).not.toHaveBeenCalled()
    })

    test('can be called without a jwksDataSource', async () => {
      const token = signToken({ contactId: '11111111' })

      const ctx = await defraIdContext({ externalAuthHeader: token }, { traceId })

      expect(ctx.crn()).toEqual('11111111')
    })

    test('throws Unauthorized if the token cannot be decoded at all', async () => {
      await expect(
        defraIdContext(
          { externalAuthHeader: 'not-a-jwt' },
          { traceId, jwksDataSource: jwksDataSource() }
        )
      ).rejects.toThrow(Unauthorized)
    })
  })
})
