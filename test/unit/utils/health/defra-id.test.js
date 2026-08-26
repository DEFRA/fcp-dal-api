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
jest.unstable_mockModule('../../../../app/data-sources/DefraIdJWKS.js', () => ({
  DefraIdJWKS: class {
    getPublicKey = mockGetPublicKey
  }
}))

const { healthCheck } = await import('../../../../app/utils/health/defra-id.js')

describe('Defra ID health check', () => {
  const originalFetch = global.fetch
  const wellKnownUrl = 'https://defra-id.example/well-known'
  let configGetSpy

  beforeEach(() => {
    configGetSpy = jest.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'auth.disabled') {
        return false
      }
      if (key === 'defraId.wellKnownUrl') {
        return wellKnownUrl
      }
      throw new Error(`Unexpected config key requested in test: ${key}`)
    })

    mockGetPublicKey.mockResolvedValue('public-key')
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === wellKnownUrl) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ jwks_uri: 'https://defra-id.example/keys' })
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ keys: [{ kid: 'mock-defra-id-key-id' }] })
      })
    })
  })

  afterEach(() => {
    mockGetPublicKey.mockReset()
    mockLogger.logger.error.mockReset()
    mockLogger.logger.info.mockReset()
    global.fetch = originalFetch
    configGetSpy.mockRestore()
    jest.restoreAllMocks()
  })

  it('should skip the health check when auth is disabled', async () => {
    configGetSpy.mockImplementation((key) => key === 'auth.disabled')

    expect(await healthCheck()).toBeUndefined()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should fetch the well known configuration, the jwks_uri, and resolve a public key', async () => {
    await healthCheck()

    expect(global.fetch).toHaveBeenCalledWith(wellKnownUrl)
    expect(global.fetch).toHaveBeenCalledWith('https://defra-id.example/keys')
    expect(mockGetPublicKey).toHaveBeenCalledWith('mock-defra-id-key-id')
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: Resolved first Defra ID JWKS key for kid: mock-defra-id-key-id'
    )
  })

  it('should log and throw when the well known configuration request is unsuccessful', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: jest.fn().mockResolvedValue('some upstream error')
    })

    await expect(healthCheck()).rejects.toThrow(
      'Problem fetching Defra ID well known configuration, status: 429'
    )
    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error fetching Defra ID well known configuration',
      {
        code: expect.any(String),
        res: expect.any(Object),
        error: { message: 'some upstream error' }
      }
    )
  })

  it('should log and throw when the well known configuration has no jwks_uri', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({})
    })

    await expect(healthCheck()).rejects.toThrow(
      'Defra ID well known configuration does not contain a jwks_uri'
    )
    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error parsing Defra ID well known configuration',
      { code: expect.any(String), res: expect.any(Object) }
    )
  })

  it('should log and throw when the JWKS request is unsuccessful', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ jwks_uri: 'https://defra-id.example/keys' })
      })
    )
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('some upstream error')
    })

    await expect(healthCheck()).rejects.toThrow('Problem fetching Defra ID JWKS keys, status: 500')
    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error fetching Defra ID JWKS keys',
      {
        code: expect.any(String),
        res: expect.any(Object),
        error: { message: 'some upstream error' }
      }
    )
  })

  it('should log and throw when no JWKS keys array is returned', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ jwks_uri: 'https://defra-id.example/keys' })
      })
    )
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({})
    })

    await expect(healthCheck()).rejects.toThrow('Problem inspecting Defra ID JWKS keys response')
    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error parsing Defra ID JWKS keys',
      {
        code: expect.any(String),
        res: expect.any(Object)
      }
    )
  })

  it('should log and throw when no JWKS keys are returned', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ jwks_uri: 'https://defra-id.example/keys' })
      })
    )
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ keys: [] })
    })

    await expect(healthCheck()).rejects.toThrow('Missing Defra ID JWKS keys')
    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error checking Defra ID JWKS keys',
      {
        error: expect.any(Error),
        code: expect.any(String)
      }
    )
  })

  it('should log and throw when Defra ID public key retrieval fails', async () => {
    mockGetPublicKey.mockRejectedValueOnce(new Error('Unable to resolve key'))

    await expect(healthCheck()).rejects.toThrow('Unable to resolve key')
    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error checking Defra ID JWKS keys',
      {
        error: expect.any(Error),
        code: expect.any(String)
      }
    )
  })
})
