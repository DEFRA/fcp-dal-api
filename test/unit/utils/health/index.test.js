import { expect, jest } from '@jest/globals'

const mockMongoHealthCheck = jest.fn()

jest.unstable_mockModule('../../../../app/utils/health/mongo.js', () => ({
  healthCheck: mockMongoHealthCheck
}))

const { runHealthChecks } = await import('../../../../app/utils/health/index.js')

describe('runHealthChecks', () => {
  beforeEach(() => {
    mockMongoHealthCheck.mockResolvedValue(undefined)
    jest.spyOn(process, 'exit').mockReturnValue(1)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should run all registered health checks', async () => {
    await runHealthChecks()

    expect(mockMongoHealthCheck).toHaveBeenCalledTimes(1)
  })

  it('should stop and terminate process if any mongo health check fails', async () => {
    const error = new Error('Health check failed')
    mockMongoHealthCheck.mockRejectedValueOnce(error)

    await runHealthChecks()

    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
