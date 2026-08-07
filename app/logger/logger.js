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

export const logger = createLogger({
  level: config.get('logLevel'),
  transports: transportTypes,
  levels: logLevels,
  // A non-empty top-level format is required here: if `format` is omitted,
  // winston falls back to its own default (`logform/json()`), which runs a
  // full JSON.stringify of the whole info object on every log call -
  // including disabled-level calls a transport will just drop. The real
  // formatting (cdpSchemaTranslator, ecsFormat) already happens per-transport
  // above, so this is intentionally a no-op.
  format: format.combine()
})

process.on('exit', () => {
  for (const transport of logger.transports) {
    if (typeof transport.close === 'function') {
      transport.close()
    }
  }
})
