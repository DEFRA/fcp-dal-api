import { jest } from '@jest/globals'
import { config } from '../../../app/config.js'

const StorageResolution = { Standard: 'Standard', High: 'High' }
const Unit = { Count: 'Count', Seconds: 'Seconds' }
const createMetricsLogger = jest.fn()
const mockAwsEmbeddedReturnValue = {
  createMetricsLogger,
  StorageResolution,
  Unit
}

describe('sendMetric - with NODE_ENV=production', () => {
  let configMockPath

  beforeEach(async () => {
    configMockPath = {}
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
  })

  afterEach(async () => {
    jest.restoreAllMocks()
  })

  it('does not log a metric when NODE_ENV is not production', async () => {
    configMockPath.nodeEnv = 'development'
    jest.unstable_mockModule('aws-embedded-metrics', () => mockAwsEmbeddedReturnValue)
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    expect(await sendMetric('TestMetric')).toBeUndefined()
    expect(createMetricsLogger).not.toHaveBeenCalled()
  })
})
