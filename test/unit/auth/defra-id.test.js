import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { config, dummyCrnToSbiMapping } from '../../../app/config.js'
import { BadRequest, Forbidden, Unauthorized } from '../../../app/errors/graphql.js'

const info = vi.fn()
const warn = vi.fn()
vi.doMock('../../../app/logger/logger.js', () => ({
  logger: { info, debug: vi.fn(), warn, error: vi.fn() }
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
                '"relationships":\\["orgId:sbi"\\],"roles":\\["role-id"\\],' +
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

  test('logs only the org id and masked SBI of each relationship, never the business name', async () => {
    const token = signToken({
      relationships: [
        'orgId1:823456789:company name:1:2',
        'orgId2:887654321',
        'company name only',
        { name: 'company name' }
      ]
    })

    await defraIdContext(
      { externalAuthHeader: token },
      { traceId, jwksDataSource: jwksDataSource() }
    )

    const logged = info.mock.calls[0][1].tenant.message
    expect(JSON.parse(logged).relationships).toEqual([
      'orgId1:*****6789',
      'orgId2:*****4321',
      '[redacted]',
      '[redacted]'
    ])
    expect(logged).not.toContain('company name')
  })

  test.each([undefined, 'orgId:823456789:company name', { name: 'company name' }])(
    'leaves relationships of %j out of the log',
    async (relationships) => {
      const token = signToken({ relationships })

      await defraIdContext(
        { externalAuthHeader: token },
        { traceId, jwksDataSource: jwksDataSource() }
      )

      const logged = info.mock.calls[0][1].tenant.message
      expect(JSON.parse(logged)).not.toHaveProperty('relationships')
      expect(logged).not.toContain('company name')
    }
  )

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

  describe('dummy CRN to SBI mapping', () => {
    const mappedContext = (token, jwks = jwksDataSource()) =>
      defraIdContext({ externalAuthHeader: token }, { traceId, jwksDataSource: jwks })

    beforeEach(() => {
      warn.mockClear()
      dummyCrnToSbiMapping.set('9100000001', new Set(['810000000', '810000001']))
      dummyCrnToSbiMapping.set('9100000002', new Set(['810000002']))
    })

    afterEach(() => {
      dummyCrnToSbiMapping.clear()
    })

    test('maps a token with a dummy CRN, without verifying it', async () => {
      const jwks = jwksDataSource()

      const ctx = await mappedContext(signToken({ contactId: '9100000001' }), jwks)

      expect(ctx.isMapped).toBe(true)
      expect(ctx.dummyCrn).toBe('9100000001')
      expect(jwks.getPublicKey).not.toHaveBeenCalled()
      expect(warn).toHaveBeenCalledWith(
        '#DAL Request authentication - dummy Defra ID CRN mapped to SBIs',
        expect.objectContaining({
          code: 'DAL_REQUEST_AUTHENTICATION_DEFRA_ID_MAPPED_001',
          tenant: {
            message: JSON.stringify({ contactId: '******0001', sbis: ['*****0000', '*****0001'] })
          }
        })
      )
    })

    test('maps a numeric contactId', async () => {
      const ctx = await mappedContext(signToken({ contactId: 9100000001 }))

      expect(ctx.isMapped).toBe(true)
    })

    test('maps a token with an invalid signature that has expired', async () => {
      const expired = jwt.sign(
        { contactId: '9100000002', exp: Math.floor(Date.now() / 1000) - 3600 },
        wrongPrivateKey,
        { algorithm: 'RS256' }
      )

      const ctx = await mappedContext(expired)

      expect(ctx.isMapped).toBe(true)
      expect(ctx.dummyCrn).toBe('9100000002')
    })

    test('maps a token with a dummy CRN when auth is disabled', async () => {
      configGetSpy.mockReturnValue(true)

      const ctx = await mappedContext(signToken({ contactId: '9100000001' }, wrongPrivateKey))

      expect(ctx.isMapped).toBe(true)
    })

    test('gives each dummy CRN its own SBIs', async () => {
      const first = await mappedContext(signToken({ contactId: '9100000001' }))
      const second = await mappedContext(signToken({ contactId: '9100000002' }))

      expect(() => first.assertSbiAllowed('810000001')).not.toThrow()
      expect(() => first.assertSbiAllowed(810000000)).not.toThrow()
      expect(() => first.assertSbiAllowed('810000002')).toThrow(
        new BadRequest('Defra ID token is not valid for the provided SBI')
      )
      expect(() => second.assertSbiAllowed('810000002')).not.toThrow()
      expect(() => second.assertSbiAllowed('810000000')).toThrow(BadRequest)
    })

    test('refuses customer functions', async () => {
      const ctx = await mappedContext(signToken({ contactId: '9100000001' }))

      expect(() => ctx.crn()).toThrow(
        new Forbidden('Customer functions are not available for a mapped Defra ID token')
      )
    })

    test('verifies a token whose CRN is not mapped as normal', async () => {
      const ctx = await mappedContext(signToken({ contactId: '11111111' }))

      expect(ctx.isMapped).toBeUndefined()
      expect(ctx.crn()).toBe('11111111')
      expect(warn).not.toHaveBeenCalled()
    })

    test('rejects an unverified token whose CRN is not mapped', async () => {
      await expect(
        mappedContext(signToken({ contactId: '11111111' }, wrongPrivateKey))
      ).rejects.toThrow(new Unauthorized('Defra ID token failed verification'))
    })

    test('rejects an unverified token with no CRN', async () => {
      await expect(mappedContext(signToken({}, wrongPrivateKey))).rejects.toThrow(
        new Unauthorized('Defra ID token failed verification')
      )
    })

    test('rejects a token that cannot be decoded', async () => {
      await expect(mappedContext('not-a-jwt')).rejects.toThrow(
        new Unauthorized('Defra ID token failed verification')
      )
    })

    test('rejects an unverified token with a dummy CRN when no mapping is configured', async () => {
      dummyCrnToSbiMapping.clear()

      await expect(
        mappedContext(signToken({ contactId: '9100000001' }, wrongPrivateKey))
      ).rejects.toThrow(new Unauthorized('Defra ID token failed verification'))
    })
  })
})
