import { expect, jest } from '@jest/globals'
import { config } from '../../../../app/config.js'

const mockGetPublicKey = jest.fn()
const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

jest.unstable_mockModule('../../../../app/logger/logger.js', () => mockLogger)
jest.unstable_mockModule('../../../../app/data-sources/JWKS.js', () => ({
  JWKS: class {
    getPublicKey = mockGetPublicKey
  }
}))

const { healthCheck } = await import('../../../../app/utils/health/jwks.js')

describe('JWKS health check', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockGetPublicKey.mockResolvedValue('public-key')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        keys: [{ kid: 'mock-key-id-123' }]
      })
    })
  })

  afterEach(() => {
    mockGetPublicKey.mockReset()
    mockLogger.logger.error.mockReset()
    mockLogger.logger.info.mockReset()
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('should fetch JWKS keys and resolve a public key', async () => {
    await healthCheck()

    expect(global.fetch).toHaveBeenCalledWith(config.get('oidc.jwksURI'))
    expect(mockGetPublicKey).toHaveBeenCalledWith('mock-key-id-123')
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: Resolved first JWKS key for kid: mock-key-id-123'
    )
  })

  it('should log and throw when JWKS request is unsuccessful, e.g. rate limiting', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue('')
    })

    await expect(healthCheck()).rejects.toThrow('Problem fetching JWKS keys, status: 429')
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error fetching JWKS keys', {
      code: expect.any(String),
      res: expect.any(Object)
    })
  })

  it('should log and throw when no JWKS keys array is returned', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({})
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
      json: jest.fn().mockResolvedValue({ keys: [] })
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
})
