import { jest } from '@jest/globals'
import { DAL_METRICS_ERROR_001 } from '../../../app/logger/codes.js'

const mockStorageResolution = { Standard: 'Standard', High: 'High' }
const mockUnits = { Count: 'Count', Seconds: 'Seconds' }

const mockLogger = {
  logger: {
    error: jest.fn()
  }
}

const mockPutMetric = jest.fn()
const mockSetDimensions = jest.fn()
const mockFlush = jest.fn()
const mockMetricsLoggerReturnValue = {
  putMetric: mockPutMetric,
  setDimensions: mockSetDimensions,
  flush: mockFlush
}

const mockCreateMetricsLogger = jest.fn()
const mockawsEmbeddedReturnValue = {
  createMetricsLogger: mockCreateMetricsLogger,
  StorageResolution: mockStorageResolution,
  Unit: mockUnits
}

const metricError = new Error('Metric Error')
const errorMockMetricsLoggerReturnValue = {
  putMetric: () => {
    throw metricError
  },
  setDimensions: mockSetDimensions,
  flush: mockFlush
}
jest.unstable_mockModule('../../../app/logger/logger.js', () => mockLogger)

describe('sendMetric', () => {
  it('logs a metric with default values and no dimensions', async () => {
    jest.unstable_mockModule('aws-embedded-metrics', () => mockawsEmbeddedReturnValue)
    mockCreateMetricsLogger.mockReturnValue(mockMetricsLoggerReturnValue)
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    await sendMetric('TestMetric')
    expect(mockCreateMetricsLogger).toHaveBeenCalled()
    expect(mockSetDimensions).not.toHaveBeenCalled()
    expect(mockPutMetric).toHaveBeenCalledWith(
      'TestMetric',
      1,
      mockUnits.Count,
      mockStorageResolution.Standard
    )
    expect(mockFlush).toHaveBeenCalled()
  })

  it('logs a metric with custom value, unit, dimensions and storage resolution', async () => {
    jest.unstable_mockModule('aws-embedded-metrics', () => mockawsEmbeddedReturnValue)
    mockCreateMetricsLogger.mockReturnValue(mockMetricsLoggerReturnValue)
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    const customDimension = { exampleDimension: 'dimension value' }
    await sendMetric(
      'TestMetric',
      100,
      mockUnits.Seconds,
      customDimension,
      mockStorageResolution.High
    )
    expect(mockCreateMetricsLogger).toHaveBeenCalled()
    expect(mockSetDimensions).toHaveBeenCalledWith(customDimension)
    expect(mockPutMetric).toHaveBeenCalledWith(
      'TestMetric',
      100,
      mockUnits.Seconds,
      mockStorageResolution.High
    )
    expect(mockFlush).toHaveBeenCalled()
  })

  it('logs an error when custom metric sending fails', async () => {
    jest.unstable_mockModule('aws-embedded-metrics', () => mockawsEmbeddedReturnValue)

    mockCreateMetricsLogger.mockReturnValue(errorMockMetricsLoggerReturnValue)
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    await sendMetric('TestMetric')
    const error = metricError
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - failed to send metric', {
      error,
      code: DAL_METRICS_ERROR_001
    })
  })
})
