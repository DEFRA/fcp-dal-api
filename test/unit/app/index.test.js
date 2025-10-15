import hapiApollo from '@as-integrations/hapi'
import { secureContext } from '@defra/hapi-secure-context'
import { expect, jest } from '@jest/globals'
import { apolloServer } from '../../../app/graphql/server.js'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

jest.unstable_mockModule('../../../app/logger/logger.js', () => mockLogger)

const { server } = await import('../../../app/server.js')

describe('App initialization', () => {
  beforeEach(() => {
    jest.spyOn(apolloServer, 'start').mockResolvedValue()
    jest.spyOn(server, 'register').mockResolvedValue()
    jest.spyOn(server, 'start').mockResolvedValue()
    jest.spyOn(process, 'exit').mockReturnValue(1)

    server.info = { uri: 'http://localhost:3000' }
  })

  afterEach(() => {
    jest.restoreAllMocks()
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

    // Verify server was started
    expect(server.start).toHaveBeenCalled()
  })

  it('should handle unhandled rejections', async () => {
    const error = new Error('Test rejection')

    // Import the app
    await import('../../../app/index.js')

    // Simulate unhandled rejection
    process.emit('unhandledRejection', error)

    // Verify process exit was called
    expect(process.exit).toHaveBeenCalledWith(1)
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - unhandled rejection', {
      error,
      code: expect.any(String)
    })
  })

  it('should handle uncaught exceptions', async () => {
    const error = new Error('Test exception')

    // Import the app
    await import('../../../app/index.js')

    // Simulate uncaught exception
    process.emit('uncaughtException', error)

    // Verify process exit was called
    expect(process.exit).toHaveBeenCalledWith(1)
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - uncaught reception', {
      error,
      code: expect.any(String)
    })
  })
})
