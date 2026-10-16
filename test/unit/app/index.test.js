import hapiApollo from '@as-integrations/hapi'
import { secureContext } from '@defra/hapi-secure-context'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apolloServer } from '../../../app/graphql/server.js'
import { mongoClient } from '../../../app/mongo.js'

const mockLogger = {
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}

const mockRunHealthChecks = vi.fn()

vi.doMock('../../../app/logger/logger.js', () => mockLogger)
vi.doMock('../../../app/utils/health/index.js', () => ({
  runHealthChecks: mockRunHealthChecks
}))

const { server } = await import('../../../app/server.js')

describe('App initialization', () => {
  beforeEach(() => {
    vi.spyOn(apolloServer, 'start').mockResolvedValue()
    vi.spyOn(server, 'register').mockResolvedValue()
    vi.spyOn(server, 'start').mockResolvedValue()
    vi.spyOn(server, 'stop').mockResolvedValue()
    vi.spyOn(mongoClient, 'close').mockResolvedValue()
    mockRunHealthChecks.mockResolvedValue()
    vi.spyOn(process, 'exit').mockReturnValue(1)

    server.info = { uri: 'http://localhost:3000' }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize the application successfully', async () => {
    // Import the app after mocks are set up
    await import('../../../app/index.js')

    // Verify Apollo server was started
    expect(apolloServer.start).toHaveBeenCalled()

    // Verify Hapi Apollo plugin was registered
    expect(server.register).toHaveBeenCalledWith([
      secureContext,
      {
        plugin: hapiApollo.default,
        options: {
          context: expect.any(Function),
          apolloServer,
          path: '/graphql'
        }
      }
    ])

    // Verify that health checks were run
    expect(mockRunHealthChecks).toHaveBeenCalled()

    // Verify server was started
    expect(server.start).toHaveBeenCalled()
  })

  it('should handle unhandled rejections', async () => {
    const error = new Error('Test rejection')
    await import('../../../app/index.js')

    // Simulate unhandled rejection
    expect(process.emit('unhandledRejection', error)).toBe(true)
    await new Promise(process.nextTick) // Wait for async handlers

    // Verify clean-up and process exit was called
    expect(mongoClient.close).toHaveBeenCalled()
    expect(server.stop).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(1)
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - unhandled rejection', {
      error,
      code: expect.any(String)
    })
  })

  it('should handle uncaught exceptions', async () => {
    const error = new Error('Test exception')
    await import('../../../app/index.js')

    // Simulate uncaught exception
    process.emit('uncaughtException', error)
    await new Promise(process.nextTick) // Wait for async handlers

    // Verify clean-up and process exit was called
    expect(mongoClient.close).toHaveBeenCalled()
    expect(server.stop).toHaveBeenCalled()
    expect(process.exit).toHaveBeenCalledWith(1)
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - uncaught exception', {
      error,
      code: expect.any(String)
    })
  })
})
