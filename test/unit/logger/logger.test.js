import { jest } from '@jest/globals'
import ConsoleTransportInstance from 'winston-transport'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../../../app/config.js'

const loadFreshLogger = async () => {
  return await import(`../../../app/logger/logger.js?version=${uuidv4()}`)
}

describe('logger', () => {
  let configMockPath

  beforeEach(async () => {
    configMockPath = {}
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
  })

  afterEach(async () => {
    jest.restoreAllMocks()
  })

  it('Single default log transport enabled', async () => {
    const { logger } = await loadFreshLogger()
    expect(logger.transports.length).toEqual(1)
    expect(logger.transports[0]).toBeInstanceOf(ConsoleTransportInstance)
  })

  it('should use ecsFormat in production environment', async () => {
    configMockPath.nodeEnv = 'production'
    const { logger } = await loadFreshLogger()
    expect(logger.transports[0].format).toBeDefined()
  })

  it('should set the log level based on LOG_LEVEL environment variable', async () => {
    configMockPath.logLevel = 'debug'
    const { logger } = await loadFreshLogger()
    expect(logger.level).toEqual('debug')
  })

  it('should close transports on process exit', async () => {
    const { logger } = await loadFreshLogger()
    logger.transports[0].close = jest.fn()
    process.emit('exit')
    expect(logger.transports[0].close).toHaveBeenCalled()
  })
})
