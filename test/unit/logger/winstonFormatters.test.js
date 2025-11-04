import { beforeEach, describe, expect, it } from '@jest/globals'
import { cdpSchemaTranslator, sampleResponseBodyData } from '../../../app/logger/winstonFormatters'

const params = new URLSearchParams([
  ['p1', 'v1'],
  ['p2', 'v2']
])
const headers = { h1: 'v1', h2: 'v2' }

const fixture = {
  code: 'RURALPAYMENTS_API_REQUEST_001',
  message: '#datasource - Rural payments - request',
  type: 'http',
  http: {
    request: {
      id: 'upstream-request',
      method: 'GET',
      other: 'stuff'
    },
    response: {
      mime_type: 'application/json',
      status_code: 200,
      other: 'stuff'
    }
  },
  level: 'info',
  '@timestamp': 1752678579327,
  request: {
    id: 'power-apps-req-id',
    method: 'POST',
    body: { searchFieldType: 'SBI', primarySearchPhrase: '107183280', offset: 0, limit: 1 },
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer token',
      email: 'probably.should@redacted.be',
      'x-cdp-request-id': '00000000-0000-0000-0000-000000000000',
      'x-ms-client-request-id': 'power-apps-req-id'
    },
    retryCount: 1,
    params,
    path: 'http://localhost/path',
    url: 'http://localhost/path'
  },
  response: {
    headers,
    body: { data: 'some data' },
    statusCode: 200
  },
  requestTimeMs: 100,
  tenant: { id: 'tenant-id', message: 'some tenant info' },
  otherItems: 'will be omitted', // because they will be pruned by CDP's log processing
  transactionId: 'transaction-id',
  traceId: 'trace-id'
}

describe('winstonFormatters', () => {
  describe('cdpSchemaTranslator', () => {
    beforeEach(() => {
      process.env.API_TENANT_ID = 'tenant-id'
    })

    afterEach(() => {
      delete process.env.API_TENANT_ID
    })

    it('should return a new object conforming to the CDP schema', () => {
      const error = new Error('test error')
      const result = cdpSchemaTranslator().transform({ error, ...fixture })
      expect(result).toEqual({
        message: '#datasource - Rural payments - request',
        level: 'info',
        'transaction.id': 'transaction-id',
        'trace.id': 'trace-id',
        'span.id': 'trace-id',
        // NOTE: this example was built based on the CDP source schema config, found at:
        // https://portal.cdp-int.defra.cloud/documentation/how-to/logging.md#current-streamlined-ecs-schema-on-cdp
        error: {
          code: 'RURALPAYMENTS_API_REQUEST_001',
          type: 'Error',
          message: 'test error',
          stack_trace: error.stack
        },
        event: {
          category: 'RURALPAYMENTS_API_REQUEST_001',
          outcome: 200,
          reference: 'http://localhost/path',
          type: 'POST',
          created: 1752678579327,
          duration: 100000000,
          kind: 'http'
        },
        http: {
          request: {
            id: 'power-apps-req-id',
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              Authorization: 'Bearer token',
              email: 'probably.should@redacted.be',
              'x-cdp-request-id': '00000000-0000-0000-0000-000000000000',
              'x-ms-client-request-id': 'power-apps-req-id'
            }
          },
          response: {
            status_code: 200,
            response_time: 100
          }
        },
        tenant: { id: 'tenant-id', message: 'some tenant info' },
        url: {
          full: 'http://localhost/path',
          query: 'searchFieldType=SBI&primarySearchPhrase=107183280&offset=0&limit=1'
        }
      })
    })
  })

  it('should handle request body as a string', () => {
    const result = cdpSchemaTranslator().transform({
      level: 'info',
      message: 'test message',
      request: { ...fixture.request, body: JSON.stringify(fixture.request.body) }
    })
    expect(result).toEqual({
      level: 'info',
      message: 'test message',
      event: {
        reference: 'http://localhost/path',
        type: 'POST'
      },
      http: {
        request: {
          id: 'power-apps-req-id',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer token',
            email: 'probably.should@redacted.be',
            'x-cdp-request-id': '00000000-0000-0000-0000-000000000000',
            'x-ms-client-request-id': 'power-apps-req-id'
          }
        }
      },
      url: {
        full: 'http://localhost/path',
        query: 'searchFieldType=SBI&primarySearchPhrase=107183280&offset=0&limit=1'
      }
    })
  })

  it('should return a reduced object when only partial info is provided', () => {
    expect(cdpSchemaTranslator().transform({ level: 'info', message: 'msg' })).toEqual({
      level: 'info',
      message: 'msg'
    })
    expect(
      cdpSchemaTranslator().transform({ level: 'info', message: 'msg', request: { id: 'req-id' } })
    ).toEqual({
      level: 'info',
      message: 'msg',
      http: { request: { id: 'req-id' } }
    })
    expect(
      cdpSchemaTranslator().transform({ level: 'info', message: 'msg', requestTimeMs: 100 })
    ).toEqual({
      level: 'info',
      message: 'msg',
      event: { duration: 100000000 },
      http: { response: { response_time: 100 } }
    })
    expect(cdpSchemaTranslator().transform({ '@timestamp': 100 })).toEqual({
      event: { created: 100 },
      level: undefined,
      message: undefined
    })
  })

  describe('sampleResponseBodyData', () => {
    const info = { level: 'info', message: 'hello' }

    it('should leave a simple log request unchanged', () => {
      expect(sampleResponseBodyData().transform(info)).toBe(info)
    })
    it('should limit log response body data to 5 items', () => {
      const body = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      const data = { ...info, response: { body } }
      expect(sampleResponseBodyData().transform(data)).toEqual({
        ...info,
        response: {
          sampleResponseBody: [1, 2, 3, 4, 5]
        }
      })
    })
  })
})
