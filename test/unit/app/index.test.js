import hapiApollo from '@as-integrations/hapi'
import { secureContext } from '@defra/hapi-secure-context'
import { expect, jest } from '@jest/globals'
import nock from 'nock'
import { MongoJWKS } from '../../../app/data-sources/mongo/JWKS.js'
import { apolloServer } from '../../../app/graphql/server.js'
import { mongoClient } from '../../../app/mongo.js'

const mockLogger = {
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}

jest.unstable_mockModule('../../../app/logger/logger.js', () => mockLogger)

const { server } = await import('../../../app/server.js')

describe('App initialization', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    jest.spyOn(apolloServer, 'start').mockResolvedValue()
    jest.spyOn(server, 'register').mockResolvedValue()
    jest.spyOn(server, 'start').mockResolvedValue()
    jest.spyOn(server, 'stop').mockResolvedValue()
    jest.spyOn(mongoClient, 'connect').mockResolvedValue()
    jest.spyOn(mongoClient, 'close').mockResolvedValue()
    jest
      .spyOn(MongoJWKS.prototype, 'fetchPublicKey')
      .mockResolvedValue('-----BEGIN PUBLIC KEY-----')
    jest.spyOn(process, 'exit').mockReturnValue(1)

    server.info = { uri: 'http://localhost:3000' }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should initialize the application successfully', async () => {
    const msOauth = nock('http://mock-jwks-endpoint/')
    msOauth.get('/keys').reply(200, {
      keys: [{ kid: 'test-key-id' }]
    })

    // Import the app after mocks are set up
    await import('../../../app/index.js?call=1')

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

    // Verify MongoDB connection was attempted
    expect(mongoClient.connect).toHaveBeenCalled()

    // Verify JWKS key fetched and cached
    expect(MongoJWKS.prototype.fetchPublicKey).toHaveBeenCalled()
    expect(mockLogger.logger.info).toHaveBeenCalledWith('Fetched JWKS keys', { keyCount: 1 })
    expect(nock.isDone()).toBe(true)
    expect(mockLogger.logger.info).toHaveBeenCalledWith('Cached first JWKS key successfully')

    // Verify server was started
    expect(server.start).toHaveBeenCalled()
  })

  it('should abort immediately if MongoDB fails to connect', async () => {
    const mockError = new Error('MongoDB connection failed')
    mongoClient.connect.mockRejectedValueOnce(mockError)

    // Import the app after mocks are set up
    await import('../../../app/index.js?call=2')

    // Verify MongoDB connection was attempted
    expect(mongoClient.connect).toHaveBeenCalled()

    // Verify process exit was called due to failure
    expect(process.exit).toHaveBeenCalledWith(1)

    // Verify error was logged
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - Error connecting to MongoDB', {
      error: mockError,
      code: expect.any(String)
    })
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
    expect(mockLogger.logger.error).toHaveBeenCalledWith('#DAL - uncaught reception', {
      error,
      code: expect.any(String)
    })
  })
})
