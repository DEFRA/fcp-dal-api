import { jest } from '@jest/globals'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'winston'
import ConsoleTransportInstance from 'winston-transport'
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
    expect(logger.transports).toHaveLength(1)
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

  describe('level-based JSON formatting guard', () => {
    let jsonTransformSpy

    beforeEach(() => {
      // format.json() instances share this prototype transform (see logform/format.js),
      // so spying here observes every JSON-formatting attempt made via format.json().
      jsonTransformSpy = jest.spyOn(format.json.Format.prototype, 'transform')
    })

    it('does not run JSON formatting for a disabled level (debug, with level=info)', async () => {
      configMockPath.logLevel = 'info'
      const { logger } = await loadFreshLogger()

      logger.debug('this should be skipped before JSON formatting')

      expect(jsonTransformSpy).not.toHaveBeenCalled()
    })

    it('runs JSON formatting for an enabled level (info, with level=info)', async () => {
      configMockPath.logLevel = 'info'
      const { logger } = await loadFreshLogger()

      logger.info('this should be JSON formatted')

      expect(jsonTransformSpy).toHaveBeenCalled()
    })

    it('runs JSON formatting for debug once the level is raised to debug', async () => {
      configMockPath.logLevel = 'debug'
      const { logger } = await loadFreshLogger()

      logger.debug('this should be JSON formatted')

      expect(jsonTransformSpy).toHaveBeenCalled()
    })
  })
})
