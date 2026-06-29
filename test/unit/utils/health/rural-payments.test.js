import { expect, jest } from '@jest/globals'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const RuralPaymentsReferenceMock = jest.fn()
const legalStatusMock = jest.fn()
RuralPaymentsReferenceMock.prototype.legalStatus = legalStatusMock

jest.unstable_mockModule('../../../../app/logger/logger.js', () => mockLogger)

jest.unstable_mockModule(
  '../../../../app/data-sources/rural-payments/RuralPaymentsReference.js',
  () => ({ RuralPaymentsReference: RuralPaymentsReferenceMock })
)

jest.unstable_mockModule('../../../../app/config.js', () => ({
  config: {
    get: jest.fn().mockReturnValue('test@example.com')
  }
}))

const { healthCheck } = await import('../../../../app/utils/health/rural-payments.js')

describe('Rural payments health check', () => {
  beforeEach(() => {
    legalStatusMock.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log success when rural payments connects', async () => {
    await healthCheck()

    expect(legalStatusMock).toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith('Connected to rural payments')
  })

  it('should log error and throw when rural payments fails to connect', async () => {
    const mockError = new Error('Rural payments connection failed')
    legalStatusMock.mockRejectedValueOnce(mockError)

    await expect(healthCheck()).rejects.toThrow('Rural payments connection failed')

    expect(mockLogger.logger.error).toHaveBeenCalledWith(
      '#DAL - Error connecting to rural payments',
      {
        error: mockError,
        code: expect.any(String)
      }
    )
  })
})
