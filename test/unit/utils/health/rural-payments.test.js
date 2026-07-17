import { expect, jest } from '@jest/globals'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const RuralPaymentsReferenceDataMock = jest.fn()
const getReferenceDataMock = jest.fn()

jest.unstable_mockModule('../../../../app/logger/logger.js', () => mockLogger)

jest.unstable_mockModule(
  '../../../../app/data-sources/rural-payments/RuralPaymentsReferenceData.js',
  () => ({ RuralPaymentsReferenceData: RuralPaymentsReferenceDataMock })
)

const { healthCheck } = await import('../../../../app/utils/health/rural-payments.js')

describe('Rural payments health check', () => {
  beforeEach(() => {
    RuralPaymentsReferenceDataMock.mockImplementation(() => ({
      getReferenceData: getReferenceDataMock
    }))
    getReferenceDataMock.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log success when rural payments connects for both internal and external gateways', async () => {
    await healthCheck()

    expect(getReferenceDataMock).toHaveBeenCalledTimes(2)
    expect(RuralPaymentsReferenceDataMock).toHaveBeenCalledWith(
      { logger: mockLogger.logger },
      {
        gatewayType: 'internal',
        request: { headers: { healthcheck: true } }
      }
    )
    expect(RuralPaymentsReferenceDataMock).toHaveBeenCalledWith(
      { logger: mockLogger.logger },
      {
        gatewayType: 'external',
        request: { headers: { healthcheck: true } }
      }
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to internal Rural Payments upstream succeeded'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to external Rural Payments upstream succeeded'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledTimes(2)
  })

  it('should log success, and not throw, when upstream responds with a 403 Forbidden', async () => {
    const forbiddenError = Object.assign(new Error('Forbidden'), {
      extensions: { http: { status: 403 } }
    })
    getReferenceDataMock.mockRejectedValue(forbiddenError)

    await expect(healthCheck()).resolves.toBeUndefined()

    expect(mockLogger.logger.error).not.toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to internal Rural Payments upstream succeeded (received expected 403 Forbidden)'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to external Rural Payments upstream succeeded (received expected 403 Forbidden)'
    )
  })

  it('should log error and throw when the internal gateway fails to connect', async () => {
    const mockError = new Error('Rural payments connection failed')
    getReferenceDataMock.mockRejectedValueOnce(mockError)

    await expect(healthCheck()).rejects.toThrow('Rural payments connection failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to internal Rural Payments upstream',
      {
        error: mockError,
        code: expect.any(String)
      }
    )
  })

  it('should log error and throw when only the external gateway fails to connect', async () => {
    const mockError = new Error('Rural payments connection failed')
    getReferenceDataMock.mockResolvedValueOnce().mockRejectedValueOnce(mockError)

    await expect(healthCheck()).rejects.toThrow('Rural payments connection failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to external Rural Payments upstream',
      {
        error: mockError,
        code: expect.any(String)
      }
    )
  })
})
