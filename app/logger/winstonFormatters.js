import { format } from 'winston'

const maxStackTrace = 50

Error.stackTraceFormatterLimit = Error.stackTraceFormatterLimit < maxStackTrace ? maxStackTrace : Error.stackTraceFormatterLimit

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
