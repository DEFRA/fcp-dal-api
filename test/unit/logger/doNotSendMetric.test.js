import { afterAll, beforeAll, jest } from '@jest/globals'

const StorageResolution = { Standard: 'Standard', High: 'High' }
const Unit = { Count: 'Count', Seconds: 'Seconds' }
const createMetricsLogger = jest.fn()
const mockAwsEmbeddedReturnValue = {
  createMetricsLogger,
  StorageResolution,
  Unit
}

describe('sendMetric - with NODE_ENV=production', () => {
  let env
  beforeAll(async () => {
    env = { ...process.env }
  })
  afterAll(() => {
    process.env = env
  })

  it('does not log a metric when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'development'
    jest.unstable_mockModule('aws-embedded-metrics', () => mockAwsEmbeddedReturnValue)
    const { sendMetric } = await import('../../../app/logger/sendMetric.js')

    expect(await sendMetric('TestMetric')).toBeUndefined()
    expect(createMetricsLogger).not.toHaveBeenCalled()
  })
})
