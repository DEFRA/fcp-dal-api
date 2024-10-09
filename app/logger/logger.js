/*
 *
 * Levels:
 * error: // Used for errors that prevent the application from operating correctly
 * warn: // Used for errors that do not prevent the application from operating correctly, but may cause issues
 * info: // Application access logs
 * verbose: // Third party access logs
 * debug: // Third party response logs
 * silly: // Detailed function logs
 */

import { createLogger, format, transports } from 'winston'
import { jsonStringify } from './utils.js'
import { stackTraceFormatter, redactSensitiveData } from './winstonFormatters.js'

const transportTypes = []
// If AppInsights is enabled, means we are running in Azure, format logs for AppInsights
if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
  transportTypes.push(
    new transports.Console({
      format: format.combine(redactSensitiveData, stackTraceFormatter, format.json())
    })
  )
} else {
// if AppInsights is not enabled, send logs to console
  transportTypes.push(new transports.Console({
    format: format.combine(
      format.align(),
      format.colorize(),
      redactSensitiveData,
      stackTraceFormatter,
      format.printf(info => {
        return `${info.level}: ${info.message} ${jsonStringify(info)}`
      })
    )
  }))
}

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: transportTypes
})
