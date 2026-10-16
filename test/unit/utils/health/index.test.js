import { expect, vi } from 'vitest'

const mockMongoHealthCheck = vi.fn()
const mockRuralPaymentsHealthCheck = vi.fn()
const mockJwksHealthCheck = vi.fn()
const mockDefraIdHealthCheck = vi.fn()
const mockHitachiHealthCheck = vi.fn()
const mockAuditHealthCheck = vi.fn()
const mockMetricsHealthCheck = vi.fn()

vi.doMock('../../../../app/utils/health/mongo.js', () => ({
  healthCheck: mockMongoHealthCheck
}))
vi.doMock('../../../../app/utils/health/jwks.js', () => ({
  healthCheck: mockJwksHealthCheck
}))
vi.doMock('../../../../app/utils/health/defra-id.js', () => ({
  healthCheck: mockDefraIdHealthCheck
}))

vi.doMock('../../../../app/utils/health/rural-payments.js', () => ({
  healthCheck: mockRuralPaymentsHealthCheck
}))
vi.doMock('../../../../app/utils/health/audit.js', () => ({
  healthCheck: mockAuditHealthCheck
}))
vi.doMock('../../../../app/utils/health/metrics.js', () => ({
  healthCheck: mockMetricsHealthCheck
}))

vi.doMock('../../../../app/utils/health/hitachi.js', () => ({
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
    mockAuditHealthCheck.mockResolvedValue(undefined)
    mockMetricsHealthCheck.mockResolvedValue(undefined)
    vi.spyOn(process, 'exit').mockReturnValue(1)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should run all registered health checks', async () => {
    await runHealthChecks()

    expect(mockMongoHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockJwksHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockDefraIdHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockRuralPaymentsHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockHitachiHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockAuditHealthCheck).toHaveBeenCalledTimes(1)
    expect(mockMetricsHealthCheck).toHaveBeenCalledTimes(1)
  })

  it('should stop and terminate process if any health check fails', async () => {
    const error = new Error('Health check failed')
    mockMongoHealthCheck.mockRejectedValueOnce(error)
    mockJwksHealthCheck.mockRejectedValueOnce(error)
    mockDefraIdHealthCheck.mockRejectedValueOnce(error)
    mockRuralPaymentsHealthCheck.mockRejectedValueOnce(error)
    mockHitachiHealthCheck.mockRejectedValueOnce(error)
    mockAuditHealthCheck.mockRejectedValueOnce(error)
    mockMetricsHealthCheck.mockRejectedValueOnce(error)

    await runHealthChecks()

    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
