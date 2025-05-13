import ecsFormat from '@elastic/ecs-winston-format'
import { createLogger, format, transports } from 'winston'
import { cdpSchemaTranslator, sampleResponseBodyData } from './winstonFormatters.js'

const transportTypes = []
transportTypes.push(
  new transports.Console({
    format:
      process.env.NODE_ENV === 'production'
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
  level: process.env.LOG_LEVEL || 'info',
  transports: transportTypes,
  levels: logLevels
})

process.on('exit', () => {
  logger.transports.forEach((transport) => {
    if (typeof transport.close === 'function') {
      transport.close()
    }
  })
})
