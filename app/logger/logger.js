import { createLogger, format, transports } from 'winston'
import { AzureApplicationInsightsLogger } from 'winston-azure-application-insights'
import { jsonStringify } from './utils.js'

import { stackTraceFormatter } from './winstonFormatters.js'

const levels = {
  levels: {
    health: 1,
    error: 2,
    warn: 3,
    info: 4,
    verbose: 5,
    debug: 6,
    silly: 7
  },
  colors: {
    health: 'lightblue',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'magenta'
  }
}

const transportTypes = []
// If AppInsights is enabled, send logs to it
if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
  const queryString = process.env.APPINSIGHTS_CONNECTIONSTRING.replaceAll(";", "&");
  const query = new URLSearchParams(queryString);
  const output = Object.fromEntries(query);
  transportTypes.push(
    new AzureApplicationInsightsLogger({
      key: output.InstrumentationKey,
      format: format.combine(stackTraceFormatter, format.json())
    })
  )
} else {
// if AppInsights is not enabled, send logs to console
  transportTypes.push(new transports.Console({
    format: format.combine(
      format.align(),
      format.colorize(),
      stackTraceFormatter,
      format.printf(info => {
        return `${info.level}: ${info.message} ${jsonStringify(info)}`
      })
    )
  }))
}

export const logger = createLogger({
  levels: levels.levels,
  level: process.env.LOG_LEVEL || 'info',
  transports: transportTypes
})
