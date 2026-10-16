import { expect, vi } from 'vitest'
import { DAL_HEALTH_CHECK_001 } from '../../../../app/logger/codes.js'

const mockLogger = {
  info: vi.fn(),
  error: vi.fn()
}

const mockPutMetric = vi.fn()
const mockFlush = vi.fn()
const mockCreateMetricsLogger = vi.fn(() => ({
  putMetric: mockPutMetric,
  flush: mockFlush
}))

vi.doMock('../../../../app/logger/logger.js', () => ({ logger: mockLogger }))
vi.doMock('aws-embedded-metrics', () => ({
  createMetricsLogger: mockCreateMetricsLogger,
  StorageResolution: { Standard: 'Standard' },
  Unit: { Count: 'Count' }
}))

const { healthCheck } = await import('../../../../app/utils/health/metrics.js')

describe('metrics startup health check', () => {
  beforeEach(() => {
    mockCreateMetricsLogger.mockReturnValue({
      putMetric: mockPutMetric,
      flush: mockFlush
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('publishes a dummy metric in production', async () => {
    const configGet = vi.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => (key === 'nodeEnv' ? 'production' : undefined))

    await healthCheck()

    expect(mockCreateMetricsLogger).toHaveBeenCalledTimes(1)
    expect(mockPutMetric).toHaveBeenCalledWith('DAL start-up healthcheck', 1, 'Count', 'Standard')
    expect(mockFlush).toHaveBeenCalledTimes(1)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'SUCCESS: Published startup metric to CloudWatch: DAL start-up healthcheck'
    )
  })

  it('skips in non-production environments', async () => {
    const configGet = vi.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => (key === 'nodeEnv' ? 'development' : undefined))

    await healthCheck()

    expect(mockCreateMetricsLogger).not.toHaveBeenCalled()
    expect(mockLogger.info).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('logs and rethrows when metric publishing fails', async () => {
    const configGet = vi.spyOn((await import('../../../../app/config.js')).config, 'get')
    configGet.mockImplementation((key) => (key === 'nodeEnv' ? 'production' : undefined))

    const error = new Error('Metrics publish failed')
    mockCreateMetricsLogger.mockImplementationOnce(() => ({
      putMetric: () => {
        throw error
      },
      flush: vi.fn()
    }))

    await expect(healthCheck()).rejects.toThrow('Metrics publish failed')

    expect(mockLogger.error).toHaveBeenCalledWith('#DAL - Error publishing startup metric', {
      error,
      code: DAL_HEALTH_CHECK_001
    })
  })
})
