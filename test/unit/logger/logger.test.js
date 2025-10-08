import { jest } from '@jest/globals'
import ConsoleTransportInstance from 'winston-transport'
import { config } from '../../../app/config.js'

describe('logger', () => {
  let configMockPath

  beforeEach(async () => {
    configMockPath = {}
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] !== undefined ? configMockPath[path] : originalConfig.get(path)
      )
  })

  afterEach(async () => {
    jest.restoreAllMocks()
  })

  it('Single default log transport enabled', async () => {
    const { logger } = await import(`../../../app/logger/logger.js?version=${Date.now()}`)
    expect(logger.transports.length).toEqual(1)
    expect(logger.transports[0]).toBeInstanceOf(ConsoleTransportInstance)
  })

  it('should use ecsFormat in production environment', async () => {
    configMockPath.nodeEnv = 'production'
    const { logger } = await import(`../../../app/logger/logger.js?version=${Date.now()}`)
    expect(logger.transports[0].format).toBeDefined()
  })

  it('should set the log level based on LOG_LEVEL environment variable', async () => {
    configMockPath.logLevel = 'debug'
    const { logger } = await import(`../../../app/logger/logger.js?version=${Date.now()}`)
    expect(logger.level).toEqual('debug')
  })

  it('should close transports on process exit', async () => {
    const { logger } = await import(`../../../app/logger/logger.js?version=${Date.now()}`)
    logger.transports[0].close = jest.fn()
    process.emit('exit')
    expect(logger.transports[0].close).toHaveBeenCalled()
  })
})
