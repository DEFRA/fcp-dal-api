import { describe, expect, jest } from '@jest/globals'

const mockSendMetric = { sendMetric: jest.fn() }
const mockLogger = {
  logger: {
    debug: jest.fn(),
    info: jest.fn()
  }
}

jest.unstable_mockModule('../../../../../app/logger/sendMetric.js', () => mockSendMetric)
jest.unstable_mockModule('../../../../../app/logger/logger.js', () => mockLogger)

const { server } = await import('../../../../../app/server.js')
process.env.PORT = '3000'
process.env.DAL_REQUEST_TIMEOUT_MS = '1000'

describe('Server Initialization', () => {
  beforeAll(async () => {
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should set timeout from env var', () => {
    expect(server.listener.timeout).toBe(parseInt(process.env.DAL_REQUEST_TIMEOUT_MS))
  })

  test('should register routes', () => {
    const routes = server.table()
    const paths = routes.map((r) => r.path)
    expect(paths).toContain('/health')
    expect(paths).toContain('/healthy')
  })
})

describe('Middleware behavior', () => {
  let injectOptions

  beforeEach(() => {
    injectOptions = {
      method: 'GET',
      url: '/healthy',
      headers: {
        'x-ms-client-request-id': 'test-request-id',
        'x-cdp-request-id': 'test-trace-id'
      }
    }
  })

  test('onRequest adds transactionId and traceId', async () => {
    await server.inject(injectOptions)
    expect(mockLogger.logger.debug).toHaveBeenCalledWith(
      'FCP - Access log',
      expect.objectContaining({
        transactionId: 'test-request-id',
        traceId: 'test-trace-id'
      })
    )
  })

  test('response event logs and sends metrics (non-health path)', async () => {
    await server.inject({ method: 'GET', url: '/non-health' })
    expect(mockLogger.logger.debug).toHaveBeenCalledWith(
      'FCP - Response log',
      expect.objectContaining({
        code: expect.any(String),
        transactionId: expect.any(String),
        traceId: expect.any(String)
      })
    )
    expect(mockLogger.logger.info).toHaveBeenCalled()
    expect(mockSendMetric.sendMetric).toHaveBeenCalledWith(
      'RequestTime',
      expect.any(Number),
      expect.any(String),
      expect.objectContaining({ code: expect.any(String) })
    )
  })

  test('response event skips metrics for health path', async () => {
    await server.inject({ method: 'GET', url: '/health' })
    expect(mockSendMetric.sendMetric).not.toHaveBeenCalled()
    expect(mockLogger.logger.info).not.toHaveBeenCalled()
  })
})
