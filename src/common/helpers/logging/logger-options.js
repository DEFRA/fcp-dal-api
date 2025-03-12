import { ecsFormat } from '@elastic/ecs-pino-format'
import { config } from '../../../config.js'
import { getTraceId } from '@defra/hapi-tracing'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion,
      serviceName
    })
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

export const loggerOptions = {
  enabled: logConfig.enabled,
  // ignorePaths: ['/health'],
  redact: {
    paths: logConfig.redact,
    censor: (value, path) => {
      const dotPath = path.join('.')
      if (
        !value &&
        [
          'kitsConnection.key',
          'kitsConnection.cert',
          'req.headers.authorization'
        ].includes(dotPath)
      ) {
        return '<empty>'
      } else if (['req.headers.cookie', 'res.headers'].includes(dotPath)) {
        return '<truncated>'
      }
      return '[REDACTED]'
    }
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin () {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
