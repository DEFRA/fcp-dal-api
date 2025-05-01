import { jest } from '@jest/globals'

const mockPutMetric = jest.fn()
const mockSetDimensions = jest.fn()
const mockFlush = jest.fn()

const mockCreateMetricsLogger = jest.fn()

const mockLogger = {
  error: jest.fn()
}

const mockErrorCode = 'DAL_METRICS_ERROR_001'

// Updated paths here:
jest.unstable_mockModule('../../../app/logger/logger.js', () => ({
  logger: mockLogger
}))

jest.unstable_mockModule('../../../app/logger/codes.js', () => ({
  DAL_METRICS_ERROR_001: mockErrorCode
}))

describe('sendMetric', () => {
  it('logs a metric with default values and no dimensions', async () => {
    jest.unstable_mockModule('aws-embedded-metrics', () => ({
      createMetricsLogger: mockCreateMetricsLogger,
      StorageResolution: { Standard: 'Standard', High: 'High' },
      Unit: { Count: 'Count', Seconds: 'Seconds' }
    }))

    mockCreateMetricsLogger.mockReturnValue({
      putMetric: mockPutMetric,
      setDimensions: mockSetDimensions,
      flush: mockFlush
    })
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    await sendMetric('TestMetric')

    expect(mockCreateMetricsLogger).toHaveBeenCalled()
    expect(mockSetDimensions).not.toHaveBeenCalled()
    expect(mockPutMetric).toHaveBeenCalledWith('TestMetric', 1, 'Count', 'Standard')
    expect(mockFlush).toHaveBeenCalled()
  })
})
