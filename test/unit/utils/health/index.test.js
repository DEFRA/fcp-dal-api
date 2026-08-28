import { expect, jest } from '@jest/globals'

const mockMongoHealthCheck = jest.fn()
const mockRuralPaymentsHealthCheck = jest.fn()
const mockJwksHealthCheck = jest.fn()
const mockDefraIdHealthCheck = jest.fn()
const mockHitachiHealthCheck = jest.fn()

jest.unstable_mockModule('../../../../app/utils/health/mongo.js', () => ({
  healthCheck: mockMongoHealthCheck
}))
jest.unstable_mockModule('../../../../app/utils/health/jwks.js', () => ({
  healthCheck: mockJwksHealthCheck
}))
jest.unstable_mockModule('../../../../app/utils/health/defra-id.js', () => ({
  healthCheck: mockDefraIdHealthCheck
}))

jest.unstable_mockModule('../../../../app/utils/health/rural-payments.js', () => ({
  healthCheck: mockRuralPaymentsHealthCheck
}))

jest.unstable_mockModule('../../../../app/utils/health/hitachi.js', () => ({
  healthCheck: mockHitachiHealthCheck
}))

const { runHealthChecks } = await import('../../../../app/utils/health/index.js')

describe('runHealthChecks', () => {
  beforeEach(() => {
    mockMongoHealthCheck.mockResolvedValue(undefined)
    mockRuralPaymentsHealthCheck.mockResolvedValue(undefined)
    mockJwksHealthCheck.mockResolvedValue(undefined)
    mockDefraIdHealthCheck.mockResolvedValue(undefined)
    mockHitachiHealthCheck.mockResolvedValue(undefined)
    jest.spyOn(process, 'exit').mockReturnValue(1)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should run all registered health checks', async () => {
    await runHealthChecks()

    expect(mockMongoHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockJwksHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockDefraIdHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockRuralPaymentsHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockHitachiHealthCheck).toHaveBeenCalledTimes(1)
  })

  it('should stop and terminate process if any health check fails', async () => {
    const error = new Error('Health check failed')
    mockMongoHealthCheck.mockRejectedValueOnce(error)
    mockJwksHealthCheck.mockRejectedValueOnce(error)
    mockDefraIdHealthCheck.mockRejectedValueOnce(error)
    mockRuralPaymentsHealthCheck.mockRejectedValueOnce(error)
    mockHitachiHealthCheck.mockRejectedValueOnce(error)

    await runHealthChecks()

    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
