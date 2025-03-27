import { format } from 'winston'
import { sampleResponse } from './utils.js'

export const cdpSchemaTranslator = format(
  ({ error, event, http, level, message, request, response, responseTimeMs }) =>
    Object.assign(
      { level },
      ...[
        error && { error: { type: error.name, message: error.message, stack_trace: error.stack } },
        event && { event },
        http && { http },
        message && { message },
        request && { req: request },
        response && { res: response },
        responseTimeMs && { responseTime: responseTimeMs },
        request?.headers?.['x-cdp-request-id'] && {
          'trace.id': request.headers['x-cdp-request-id']
        }
      ]
    )
)

export const sampleResponseBodyData = format((info) => {
  if (info?.response?.body) {
    info.response.sampleResponseBody = sampleResponse(info.response.body)
    delete info.response.body
  }
  return info
})
