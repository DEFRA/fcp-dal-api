import { expect, jest } from '@jest/globals'
import { config } from '../../../../../app/config.js'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

const RuralPaymentsReferenceDataMock = jest.fn()
const getReferenceDataMock = jest.fn()

jest.unstable_mockModule('../../../../../app/logger/logger.js', () => mockLogger)

jest.unstable_mockModule(
  '../../../../../app/data-sources/rural-payments/RuralPaymentsReferenceData.js',
  () => ({ RuralPaymentsReferenceData: RuralPaymentsReferenceDataMock })
)

const { runRuralPaymentsCheck } =
  await import('../../../../../app/utils/health/rural-payments/datasource-check.js')

describe('Rural payments datasource check', () => {
  beforeEach(() => {
    RuralPaymentsReferenceDataMock.mockImplementation(() => ({
      getReferenceData: getReferenceDataMock
    }))
    getReferenceDataMock.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call the internal gateway using the DAL service account and log success', async () => {
    await runRuralPaymentsCheck('internal')

    expect(getReferenceDataMock).toHaveBeenCalledWith('legalstatus')
    expect(RuralPaymentsReferenceDataMock).toHaveBeenCalledWith(
      { logger: mockLogger.logger },
      {
        request: {
          headers: {
            'service-account': config.get('kits.dalServiceAccountEmail')
          }
        }
      }
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to internal Rural Payments upstream succeeded'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledTimes(1)
  })

  it('should call the external gateway using healthcheck headers and log success', async () => {
    await runRuralPaymentsCheck('external')

    expect(getReferenceDataMock).toHaveBeenCalledWith('legalstatus')
    expect(RuralPaymentsReferenceDataMock).toHaveBeenCalledWith(
      { logger: mockLogger.logger },
      {
        request: { headers: { healthcheck: true, 'x-forwarded-authorization': 'healthcheck' } }
      }
    )
    expect(mockLogger.logger.info).toHaveBeenCalledWith(
      'SUCCESS: HTTP connection to external Rural Payments upstream succeeded'
    )
    expect(mockLogger.logger.info).toHaveBeenCalledTimes(1)
  })

  it.each(['internal', 'external'])(
    'should log success, and not throw, when the %s upstream responds with a 403 Forbidden',
    async (type) => {
      const forbiddenError = Object.assign(new Error('Forbidden'), {
        extensions: { http: { status: 403 } }
      })
      getReferenceDataMock.mockRejectedValue(forbiddenError)

      await expect(runRuralPaymentsCheck(type)).resolves.toBeUndefined()

      expect(mockLogger.logger.error).not.toHaveBeenCalled()
      expect(mockLogger.logger.info).toHaveBeenCalledWith(
        `SUCCESS: HTTP connection to ${type} Rural Payments upstream succeeded (received expected 403 Forbidden)`
      )
    }
  )

  it.each(['internal', 'external'])(
    'should log error and throw when the %s gateway fails to connect',
    async (type) => {
      const mockError = new Error('Rural payments connection failed')
      getReferenceDataMock.mockRejectedValue(mockError)

      await expect(runRuralPaymentsCheck(type)).rejects.toThrow('Rural payments connection failed')

      expect(mockLogger.logger.error).toHaveBeenCalledWith(
        `#DAL - Error connecting to ${type} Rural Payments upstream`,
        {
          error: mockError,
          code: expect.any(String)
        }
      )
    }
  )
})
