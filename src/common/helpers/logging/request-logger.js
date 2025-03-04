import hapiPino from 'hapi-pino'

import { loggerOptions } from './logger-options.js'

const requestLogger = {
  plugin: hapiPino,
  options: loggerOptions
}

export { requestLogger }
