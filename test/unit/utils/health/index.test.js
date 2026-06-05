import { expect, jest } from '@jest/globals'

const mockMongoHealthCheck = jest.fn()

jest.unstable_mockModule('../../../../app/utils/health/mongo.js', () => ({
  healthCheck: mockMongoHealthCheck
}))

const { runHealthChecks } = await import('../../../../app/utils/health/index.js')

describe('runHealthChecks', () => {
  beforeEach(() => {
    mockMongoHealthCheck.mockResolvedValue()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should run all registered health checks', async () => {
    await runHealthChecks()

    expect(mockMongoHealthCheck).toHaveBeenCalledTimes(1)
  })

  it('should stop and propagate error on first failing health check', async () => {
    const error = new Error('Health check failed')
    mockMongoHealthCheck.mockRejectedValueOnce(error)

    await expect(runHealthChecks()).rejects.toThrow(error)
  })
})
