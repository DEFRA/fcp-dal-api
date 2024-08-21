import winston from 'winston'

Error.stackTraceLimit = Error.stackTraceLimit < 20 ? 20 : Error.stackTraceLimit

function jsonStringifyRecursive (obj) {
  delete obj.level
  delete obj.message

  // Log error instances as objects
  if (obj.error) {
    const error = {
      message: obj.error.message,
      stack: obj.error.stack.split('\n')
    }
    if (obj.error?.request) {
      error.request = {
        headers: obj.error?.request?.headers,
        data: obj.error?.request?.data
      }
    }
    if (obj.error?.response) {
      error.response = {
        status: obj.error?.response?.statusCode,
        headers: obj.error?.response?.headers,
        body: obj.error?.response?.body
      }
    }
    obj.error = error
  }

  // Prevent logging circular references
  const cache = new Set()
  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return
        cache.add(value)
      }
      return value
    },
    4
  )
}

const format = winston.format.combine(
  winston.format.align(),
  winston.format.colorize(),
  winston.format.printf(info => {
    if (!info.stack && !info.error?.stack) {
      try {
        throw new Error()
      } catch (e) {
        info.stack = e.stack
          .split('\n')
          .filter(
            line =>
              !line.includes('node_modules') &&
              !line.includes('logger.js') &&
              !line.includes('node:internal')
          )
        info.stack.shift()
      }
    }
    return `${info.level}: ${info.message} ${jsonStringifyRecursive(info)}`
  })
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()],
  format
})
