/*
 *
 * Levels:
 * error: // Used for errors that prevent the application from operating correctly
 * warn: // Used for errors that do not prevent the application from operating correctly, but may cause issues
 * info: // Application access logs
 * http: // Third party response logs without body
 * verbose: // Third party access logs
 * debug: // Third party response logs with body
 * silly: // Detailed function logs
 */
import ecsFormat from '@elastic/ecs-winston-format'
import { createLogger, format, transports } from 'winston'
import { redactSensitiveData, sampleResponseBodyData } from './winstonFormatters.js'

const transportTypes = []
transportTypes.push(
  new transports.Console({
    format: format.combine(sampleResponseBodyData(), redactSensitiveData(), ecsFormat())
  })
)

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: transportTypes
})

process.on('exit', () => {
  logger.transports.forEach((transport) => {
    if (typeof transport.close === 'function') {
      transport.close()
    }
  })
})
