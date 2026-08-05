import ecsFormat from '@elastic/ecs-winston-format'
import { createLogger, format, transports } from 'winston'
import { config } from '../config.js'
import { cdpSchemaTranslator } from './winstonFormatters.js'

const transportTypes = []
transportTypes.push(
  new transports.Console({
    format: format.combine(cdpSchemaTranslator(), ecsFormat())
  })
)

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
}

// Runs first in the logger's format chain so a disabled level short-circuits
// (logform/combine's cascade stops on a falsy return) before the JSON
// serialisation format below ever executes, avoiding the full formatting
// cost for calls like `logger.debug(...)` that no transport would accept.
const levelGuard = format((info) => logger.isLevelEnabled(info.level) && info)

export const logger = createLogger({
  level: config.get('logLevel'),
  transports: transportTypes,
  levels: logLevels,
  format: format.combine(levelGuard(), format.json())
})

process.on('exit', () => {
  for (const transport of logger.transports) {
    if (typeof transport.close === 'function') {
      transport.close()
    }
  }
})
