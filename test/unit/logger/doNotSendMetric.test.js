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
  it('does not log a metric when NODE_ENV is not production', async () => {
    config.set('nodeEnv', 'development')
    jest.unstable_mockModule('aws-embedded-metrics', () => mockAwsEmbeddedReturnValue)
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    expect(await sendMetric('TestMetric')).toBeUndefined()
    expect(createMetricsLogger).not.toHaveBeenCalled()
  })
})
