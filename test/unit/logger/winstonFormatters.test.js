import { HeaderMap } from '@apollo/server'
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import {
  redactSensitiveData,
  safeSerialise,
  safeStructuredClone,
  sampleResponseBodyData,
  serialize
} from '../../../app/logger/winstonFormatters'

const someURL = new URL('http://localhost/path')
const path = 'http://localhost/path'
const params = new URLSearchParams([
  ['p1', 'v1'],
  ['p2', 'v2']
])
const paramsObject = { p1: 'v1', p2: 'v2' }
const headers = { h1: 'v1', h2: 'v2' }
const headersMap = new HeaderMap(Object.entries(headers))

const symbols = { [Symbol('level')]: 'verbose', [Symbol('message')]: 'message contents' }
const fixture = {
  requestId: '00000000-0000-0000-0000-000000000000',
  request: {
    method: 'POST',
    body: '{"searchFieldType":"SBI","primarySearchPhrase":"107183280","offset":0,"limit":1}',
    headers: {
      'content-type': 'application/json',
      'Ocp-Apim-Subscription-Key': '00000000000000000000000000000000',
      Authorization: 'Bearer token',
      email: 'probably.should@redacted.be'
    },
    retryCount: 1,
    params,
    path: someURL
  },
  response: {
    headers: headersMap,
    body: { data: 'some data', access_token: 'something super secret' }
  },
  code: 'RURALPAYMENTS_API_REQUEST_001',
  level: 'verbose',
  message: '#datasource - Rural payments - request',
  ...symbols
}

describe('winstonFormatters', () => {
  describe('safeSerialise', () => {
    it('should simply return falsy values', () => {
      expect(safeSerialise(null)).toBe(null)
      expect(safeSerialise(undefined)).toBe(undefined)
      expect(safeSerialise(0)).toBe(0)
    })
    it('should turn unserialisable objects into plain serialisable equivalents', () => {
      expect(safeSerialise(params)).toEqual(paramsObject)
    })
    it('should fallback to converting the input to a string', () => {
      expect(safeSerialise(someURL)).toEqual(path)
    })
  })

  describe('safeStructuredClone', () => {
    it('should clone objects with known unserialisable request properties', () => {
      const obj = { code: 'some code', request: { params, path: someURL, other: 'stuff' } }
      const clone = safeStructuredClone(obj)
      expect(clone).toEqual({ ...obj, request: { params: paramsObject, path, other: 'stuff' } })
      expect(clone).not.toBe(obj)
    })
    it('should clone objects with known unserialisable response properties', () => {
      const obj = { code: 'some code', response: { headers: headersMap, other: 'stuff' } }
      const clone = safeStructuredClone(obj)
      expect(clone).toEqual({ ...obj, response: { headers, other: 'stuff' } })
      expect(clone).not.toBe(obj)
    })
    it('will not work for unknown unserialisable properties', () => {
      const error = 'Cannot clone object of unsupported type.'
      expect(() => safeStructuredClone({ path: someURL })).toThrow(error)
      expect(() => safeStructuredClone({ params })).toThrow(error)
      expect(() => safeStructuredClone({ request: { paths: someURL } })).toThrow(error)
      expect(() => safeStructuredClone({ request: { parameters: params } })).toThrow(error)
    })
  })

  describe('serialize', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should handle simple message log requests', () => {
      const info = {
        level: 'info',
        message: 'hello',
        [Symbol('level')]: 'info',
        [Symbol('message')]: 'hello'
      }
      const cloneSpy = jest.spyOn(global, 'structuredClone')
      expect(serialize(info)).toEqual(info)
      expect(cloneSpy).toHaveBeenCalledTimes(1)
    })
    it('should copy object contents ready for redaction', () => {
      const cloneSpy = jest.spyOn(global, 'structuredClone')
      const clone = serialize(fixture)
      expect(clone).toEqual({
        ...fixture,
        request: {
          ...fixture.request,
          params: paramsObject,
          path
        },
        response: { ...fixture.response, headers }
      })
      expect(clone).not.toBe(fixture)
      expect(cloneSpy).toHaveBeenCalledTimes(2)
    })
    it('should copy all keep all symbols too', () => {
      const symbols = Object.getOwnPropertySymbols(fixture)
      const cloneSymbols = Object.getOwnPropertySymbols(serialize(fixture))
      expect(cloneSymbols).toEqual(symbols)
      symbols.forEach((symbol, i) => expect(symbol).toBe(cloneSymbols[i]))
    })
    it('should redact all data and add a note to the log when cloning fails', () => {
      const cloneSpy = jest.spyOn(global, 'structuredClone')
      const { message, code } = fixture
      const clone = serialize({ ...fixture, response: { url: someURL } })

      expect(clone).not.toHaveProperty('request')
      expect(clone).not.toHaveProperty('response')

      expect(clone).toEqual({
        code,
        level: 'error',
        message: `Error cloning log data! Redacting for safety\n${message}`,
        stack: clone.stack,
        ...symbols
      })
      expect(cloneSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('redactSensitiveData', () => {
    it('should redact sensitive data', () => {
      const clone = redactSensitiveData().transform(fixture)
      expect(clone).toEqual({
        requestId: '00000000-0000-0000-0000-000000000000',
        request: {
          method: 'POST',
          body: '{"searchFieldType":"SBI","primarySearchPhrase":"107183280","offset":0,"limit":1}',
          headers: {
            'content-type': 'application/json',
            'Ocp-Apim-Subscription-Key': '00000000000000000000000000000000',
            Authorization: '[REDACTED]',
            email: 'probably.should@redacted.be'
          },
          retryCount: 1,
          params: paramsObject,
          path
        },
        response: { headers, body: { data: 'some data', access_token: '[REDACTED]' } },
        code: 'RURALPAYMENTS_API_REQUEST_001',
        level: 'verbose',
        message: '#datasource - Rural payments - request',
        ...symbols
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
