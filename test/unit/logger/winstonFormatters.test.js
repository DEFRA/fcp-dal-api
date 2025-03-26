import { HeaderMap } from '@apollo/server'
import { describe, expect, it } from '@jest/globals'
import { cdpSchemaTranslator, sampleResponseBodyData } from '../../../app/logger/winstonFormatters'

const someURL = new URL('http://localhost/path')
const path = 'http://localhost/path'
const params = new URLSearchParams([
  ['p1', 'v1'],
  ['p2', 'v2']
])
const paramsObject = { p1: 'v1', p2: 'v2' }
const headers = { h1: 'v1', h2: 'v2' }
const headersMap = new HeaderMap(Object.entries(headers))

const fixture = {
  event: 'RURALPAYMENTS_API_REQUEST_001',
  message: '#datasource - Rural payments - request',
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
  request: {
    method: 'POST',
    body: '{"searchFieldType":"SBI","primarySearchPhrase":"107183280","offset":0,"limit":1}',
    headers: {
      'content-type': 'application/json',
      'Ocp-Apim-Subscription-Key': '00000000000000000000000000000000',
      Authorization: 'Bearer token',
      email: 'probably.should@redacted.be',
      'x-cdp-request-id': '00000000-0000-0000-0000-000000000000'
    },
    retryCount: 1,
    params,
    path: someURL
  },
  response: {
    headers: headersMap,
    body: { data: 'some data' },
    statusCode: 200
  },
  responseTimeMs: 100,
  otherItems: 'will be omitted' // because they will be pruned by CDP's log processing
}

describe('winstonFormatters', () => {
  describe('cdpSchemaTranslator', () => {
    it('should return a new object conforming to the CDP schema', () => {
      const error = new Error('test error')
      const result = cdpSchemaTranslator().transform({ error, ...fixture })
      expect(result).toEqual({
        // NOTE: this example was built based on the CDP source schema config, found at:
        // https://github.com/DEFRA/cdp-tf-modules/blob/b061f1bc62c8653d173046307ec18d1d888207c2/opensearch_ingestion/vars.tf#L157
        error: {
          type: 'Error',
          message: 'test error',
          stack_trace: error.stack
        },
        event: 'RURALPAYMENTS_API_REQUEST_001',
        message: '#datasource - Rural payments - request',
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
        req: {
          method: 'POST',
          body: '{"searchFieldType":"SBI","primarySearchPhrase":"107183280","offset":0,"limit":1}',
          headers: {
            'content-type': 'application/json',
            'Ocp-Apim-Subscription-Key': '00000000000000000000000000000000',
            Authorization: 'Bearer token',
            email: 'probably.should@redacted.be',
            'x-cdp-request-id': '00000000-0000-0000-0000-000000000000'
          },
          retryCount: 1,
          params,
          path: someURL
        },
        res: {
          headers: headersMap,
          body: { data: 'some data' },
          statusCode: 200
        },
        responseTime: 100,
        'trace.id': '00000000-0000-0000-0000-000000000000'
      })
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
