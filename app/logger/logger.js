import ecsFormat from '@elastic/ecs-winston-format'
import { createLogger, format, transports } from 'winston'
import { config } from '../config.js'
import { cdpSchemaTranslator, sampleResponseBodyData } from './winstonFormatters.js'

const transportTypes = []
transportTypes.push(
  new transports.Console({
    format:
      config.get('nodeEnv') === 'production'
        ? format.combine(cdpSchemaTranslator(), ecsFormat())
        : sampleResponseBodyData()
  })
)

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
}

export const logger = createLogger({
  level: config.get('logLevel'),
  transports: transportTypes,
  levels: logLevels
})

process.on('exit', () => {
  for (const transport of logger.transports) {
    if (typeof transport.close === 'function') {
      transport.close()
    }
  }
})
