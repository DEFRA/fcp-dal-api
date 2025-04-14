/*
 * Levels:
 * error: // Used for errors that prevent the application from operating correctly
 * warn: // Used for errors that do not prevent the application from operating correctly, but may cause issues
 * metric: // Used for metrics
 * info: // Application access logs
 * http: // Third party response logs without body
 * verbose: // Third party access logs
 * debug: // Third party response logs with body
 * silly: // Detailed function logs
 */
import ecsFormat from '@elastic/ecs-winston-format'
import { createLogger, format, transports } from 'winston'
import { AWSMetricTransport } from './metricTransport.js'
import { cdpSchemaTranslator, sampleResponseBodyData } from './winstonFormatters.js'

const transportTypes = []
transportTypes.push(
  new transports.Console({
    format:
      process.env.NODE_ENV === 'production'
        ? format.combine(cdpSchemaTranslator(), ecsFormat())
        : sampleResponseBodyData()
  }),
  new AWSMetricTransport({
    level: 'metric'
  })
)

const logLevels = {
  error: 0,
  warn: 1,
  metric: 2,
  info: 3,
  http: 4,
  verbose: 5,
  debug: 6,
  silly: 7
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
