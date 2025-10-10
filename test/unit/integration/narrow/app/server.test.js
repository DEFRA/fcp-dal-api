import { describe, expect, jest } from '@jest/globals'
import net from 'net'
import { setTimeout } from 'node:timers/promises'
import { config } from '../../../../../app/config.js'

const mockSendMetric = { sendMetric: jest.fn() }
const mockLogger = {
  logger: {
    debug: jest.fn(),
    info: jest.fn()
  }
}

jest.unstable_mockModule('../../../../../app/logger/sendMetric.js', () => mockSendMetric)
jest.unstable_mockModule('../../../../../app/logger/logger.js', () => mockLogger)

const timeout = 20
const buffer = 10
const socketTimeoutTest = (socket, reject) => {
  return async () => {
    try {
      await setTimeout(timeout + buffer)
      if (!socket.destroyed) {
        socket.destroy()
        reject(new Error('Socket was not closed after timeout'))
      }
    } catch (err) {
      reject(new Error('Unknown error!', err))
    }
  }
}

describe('Server config and startup', () => {
  let server
  let configMockPath
  beforeEach(async () => {
    configMockPath = {
      PORT: '3000',
      requestTimeoutMs: timeout
    }
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
    const { server: _server } = await import(`../../../../../app/server.js?update=${Date.now()}`)
    server = _server
    await server.start()
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await server.stop()
  })

  describe('Server Initialization', () => {
    test('should set timeout from env var', () => {
      expect(server.listener.timeout).toBe(timeout)
    })

    test('idle socket should be closed by timeout', () => {
      return new Promise((resolve, reject) => {
        const socket = net.connect({ port: config.get('PORT') })
        socket.on('connect', socketTimeoutTest(socket, reject))
        socket.on('close', resolve)
        socket.on('error', console.error)
      })
    })

    test('should register routes', () => {
      const routes = server.table()
      const paths = routes.map((r) => r.path)
      expect(paths).toContain('/health')
      expect(paths).toContain('/healthy')
    })
  })

  describe('Middleware behavior', () => {
    test('onRequest adds transactionId and traceId', async () => {
      await server.inject({
        method: 'GET',
        url: '/healthy',
        headers: {
          'x-ms-client-request-id': 'test-request-id',
          'x-cdp-request-id': 'test-trace-id'
        }
      })

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
})
