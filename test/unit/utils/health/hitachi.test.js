import { expect, jest } from '@jest/globals'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const HitachiPaymentsMock = jest.fn()
const getSupplierPaymentsMock = jest.fn()

jest.unstable_mockModule('../../../../app/logger/logger.js', () => mockLogger)

jest.unstable_mockModule('../../../../app/data-sources/hitachi/HitachiPayments.js', () => ({
  HitachiPayments: HitachiPaymentsMock
}))

const { HttpError, NotFound } = await import('../../../../app/errors/graphql.js')
const { healthCheck } = await import('../../../../app/utils/health/hitachi.js')

describe('Hitachi payments health check', () => {
  beforeEach(() => {
    HitachiPaymentsMock.mockImplementation(() => ({
      getSupplierPayments: getSupplierPaymentsMock
    }))
    getSupplierPaymentsMock.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log success when Hitachi payments connects', async () => {
    await healthCheck()

    expect(HitachiPaymentsMock).toHaveBeenCalledWith({
      logger: mockLogger.logger,
      audit: {
        requestedSystem: 'dal-api-healthcheck',
        requesterId: 'dal-api-healthcheck',
        correlationId: 'healthcheck'
      }
    })
    expect(getSupplierPaymentsMock).toHaveBeenCalledWith({
      frn: '000000000',
      userIP: '127.0.0.1',
      resourceId: 'healthcheck'
    })
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to Hitachi Payments upstream succeeded'
    )
    expect(mockLogger.logger.error).not.toHaveBeenCalled()
  })

  it('should log success, and not throw, when upstream responds with a business not found error', async () => {
    getSupplierPaymentsMock.mockRejectedValue(new NotFound('Hitachi payments business not found'))

    await expect(healthCheck()).resolves.toBeUndefined()

    expect(mockLogger.logger.error).not.toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to Hitachi Payments upstream succeeded (received expected not-found response)'
    )
  })

  it('should log error and throw when Hitachi payments fails to connect', async () => {
    const mockError = new Error('Hitachi payments connection failed')
    getSupplierPaymentsMock.mockRejectedValue(mockError)

    await expect(healthCheck()).rejects.toThrow('Hitachi payments connection failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to Hitachi Payments upstream',
      {
        error: mockError,
        code: expect.any(String)
      }
    )
  })

  it('should log error and throw when the upstream returns a generic HTTP 404, e.g. a misconfigured URL', async () => {
    const httpError = new HttpError(404, { extensions: { response: { status: 404 } } })
    getSupplierPaymentsMock.mockRejectedValue(httpError)

    await expect(healthCheck()).rejects.toBe(httpError)

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to Hitachi Payments upstream',
      {
        error: httpError,
        code: expect.any(String)
      }
    )
    expect(mockLogger.logger.info).not.toHaveBeenCalledWith(expect.stringContaining('SUCCESS'))
  })
})
