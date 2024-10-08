import fastRedact from 'fast-redact'
import { format } from 'winston'

const maxStackTrace = 50

Error.stackTraceFormatterLimit = Error.stackTraceFormatterLimit < maxStackTrace ? maxStackTrace : Error.stackTraceFormatterLimit

const redact = fastRedact({
  paths: ['request.headers.authorization'],
  serialize: false
})

export const stackTraceFormatter = format.printf((info) => {
  if (!info?.stack && !info?.error?.stack) {
    try {
      throw new Error()
    } catch (e) {
      info.stack = e.stack
        .split('\n')
        .filter(
          line =>
            !line.includes('node_modules') &&
            !line.includes('logger.js') &&
            !line.includes('winstonFormatters.js') &&
            !line.includes('node:')
        )
      info.stack.shift()
      if (!info?.stack?.length) {
        delete info.stack
      }
    }
  }

  return info
})

export const redactSensitiveData = format.printf(info => {
  return redact(info)
})
