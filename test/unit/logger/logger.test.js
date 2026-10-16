import { vi } from 'vitest'
import { createLogger, format, transports } from 'winston'
import ConsoleTransportInstance from 'winston-transport'
import { config } from '../../../app/config.js'

const loadFreshLogger = async () => {
  vi.resetModules()
  vi.doMock('../../../app/config.js', () => ({ config }))
  return await import('../../../app/logger/logger.js')
}

describe('logger', () => {
  let configMockPath

  beforeEach(async () => {
    configMockPath = {}
    const originalConfig = { ...config }
    vi.spyOn(config, 'get').mockImplementation((path) =>
      configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
    )
  })

  afterEach(async () => {
    vi.restoreAllMocks()
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
    logger.transports[0].close = vi.fn()
    process.emit('exit')
    expect(logger.transports[0].close).toHaveBeenCalled()
  })

  describe('top-level format', () => {
    let jsonTransformSpy

    beforeEach(() => {
      // format.json() instances share this prototype transform (see logform/format.js).
      // Winston falls back to this exact format when `createLogger` is given no `format`
      // option (see node_modules/winston/lib/winston/logger.js), stringifying the whole
      // info object on every log call - including ones a transport will end up dropping.
      jsonTransformSpy = vi.spyOn(format.json.Format.prototype, 'transform')
    })

    it('does not fall back to winston default JSON formatting', async () => {
      const { logger } = await loadFreshLogger()

      logger.info('this should not be JSON formatted at the logger level')

      expect(jsonTransformSpy).not.toHaveBeenCalled()
    })

    // Control: proves the spy above would actually catch the fallback if
    // logger.js ever stopped passing a `format` option.
    it('control: a logger created with no format option does fall back to JSON formatting', () => {
      const controlLogger = createLogger({
        level: 'info',
        transports: [new transports.Console()]
      })

      controlLogger.info('this should be JSON formatted via the winston default')

      expect(jsonTransformSpy).toHaveBeenCalled()
    })
  })
})
