import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../../../../app/config.js'

const mockGetPublicKey = vi.fn()
const mockLogger = {
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}

vi.doMock('../../../../app/logger/logger.js', () => mockLogger)
vi.doMock('../../../../app/data-sources/JWKS.js', () => ({
  JWKS: class {
    getPublicKey = mockGetPublicKey
  }
}))

const { healthCheck } = await import('../../../../app/utils/health/jwks.js')

describe('JWKS health check', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockGetPublicKey.mockResolvedValue('public-key')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        keys: [{ kid: 'mock-key-id-123' }]
      })
    })
    config.set('auth.disabled', false)
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('should fetch JWKS keys and resolve a public key', async () => {
    await healthCheck()

    expect(global.fetch).toHaveBeenCalledWith(config.get('oidc.jwksURI'), {
      signal: expect.any(AbortSignal)
    })
    expect(mockGetPublicKey).toHaveBeenCalledWith('mock-key-id-123')
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: Resolved first JWKS key for kid: mock-key-id-123'
    )
  })

  it('should log and throw when JWKS request is unsuccessful, e.g. rate limiting', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: vi.fn().mockResolvedValue('some upstream error')
    })

    await expect(healthCheck()).rejects.toThrow('Problem fetching JWKS keys, status: 429')
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error fetching JWKS keys', {
      code: expect.any(String),
      res: expect.any(Object),
      tenant: { message: 'some upstream error' }
    })
  })

  it('should log and throw when no JWKS keys array is returned', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({})
    })

    await expect(healthCheck()).rejects.toThrow('Problem inspecting JWKS keys response')
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error parsing JWKS keys', {
      code: expect.any(String),
      res: expect.any(Object)
    })
  })

  it('should log and throw when no JWKS keys are returned', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ keys: [] })
    })

    await expect(healthCheck()).rejects.toThrow('Missing JWKS keys')
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error checking JWKS keys', {
      error: expect.any(Error),
      code: expect.any(String)
    })
  })

  it('should log and throw when JWKS public key retrieval fails', async () => {
    mockGetPublicKey.mockRejectedValueOnce(new Error('Unable to resolve key'))

    await expect(healthCheck()).rejects.toThrow('Unable to resolve key')
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error checking JWKS keys', {
      error: expect.any(Error),
      code: expect.any(String)
    })
  })

  it('should skip JWKS health check when auth is disabled', async () => {
    config.set('auth.disabled', true)

    expect(global.fetch).not.toHaveBeenCalled()
    expect(await healthCheck()).toBeUndefined()
  })
})
