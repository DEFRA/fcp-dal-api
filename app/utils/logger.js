import winston from 'winston'

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
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return
      cache.add(value)
    }
    return value
  })
}

const format = winston.format.combine(
  winston.format.align(),
  winston.format.printf(info => {
    return `${info.level}: ${info.message} ${jsonStringifyRecursive(info)}`
  })
)

const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()],
  format
})

export default log
