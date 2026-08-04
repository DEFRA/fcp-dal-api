import { RESTDataSource } from '@apollo/datasource-rest'
import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals'
import StatusCodes from 'http-status-codes'
import jwt from 'jsonwebtoken'
import {
  RuralPayments,
  extractCrnFromDefraIdToken
} from '../../../../app/data-sources/rural-payments/RuralPayments.js'
import { BadRequest, HttpError } from '../../../../app/errors/graphql.js'
import { RURALPAYMENTS_API_REQUEST_001 } from '../../../../app/logger/codes.js'

const logger = {
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn()
}

const datasourceOptions = [
  { logger },
  {
    request: {
      headers: {
        email: 'test@test.test'
      }
    }
  }
]

describe('RuralPayments', () => {
  describe('fetch', () => {
    const mockFetch = jest.spyOn(RESTDataSource.prototype, 'fetch')
    const dummyRequest = { method: 'POST' }

    beforeEach(() => {
      mockFetch.mockReset()
    })
    afterAll(() => {
      mockFetch.mockRestore()
    })

    test('returns data from RPP', async () => {
      const rp = new RuralPayments(...datasourceOptions)

      mockFetch.mockResolvedValueOnce('data')

      expect(await rp.fetch('path', dummyRequest)).toBe('data')
      expect(mockFetch).toBeCalledTimes(1)
    })

    describe('throws upstream errors from RPP', () => {
      test('when the RPP service encounters an error', async () => {
        const error = new Error('Server error')
        error.extensions = { response: { status: StatusCodes.INTERNAL_SERVER_ERROR } }

        mockFetch.mockRejectedValue(error)

        const rp = new RuralPayments(...datasourceOptions)
        try {
          await rp.fetch('path', dummyRequest)
        } catch (thrownError) {
          expect(thrownError.extensions).toMatchObject({
            response: { status: StatusCodes.INTERNAL_SERVER_ERROR }
          })
          expect(mockFetch).toBeCalledTimes(1)
        }

        // Ensure we actually ran the catch block assertions (i.e. the test did throw)
        expect.assertions(2)
      })

      test('when the RPP service is totally unreachable', async () => {
        mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

        const rp = new RuralPayments(...datasourceOptions)
        await expect(rp.fetch('path', dummyRequest)).rejects.toThrow(new Error('ECONNREFUSED'))
        expect(mockFetch).toBeCalledTimes(1)
      })
    })
  })

  describe('didEncounterError', () => {
    test('handles errors', () => {
      const rp = new RuralPayments(...datasourceOptions)

      const error = new Error('test error')
      error.extensions = { response: { status: 400, headers: { get: () => 'text/html' } } }
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - Rural payments - request error', {
        error: expect.objectContaining({ message: 'test error' }),
        request,
        response: error.extensions.response,
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })

    test('handles complex errors with causes', () => {
      const rp = new RuralPayments(...datasourceOptions)

      const error = new Error('test error')
      const intermediateError = new TypeError('intermediate cause')
      intermediateError.cause = new Error('root cause error')
      error.cause = intermediateError
      error.extensions = { response: { status: 500 } }
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - Rural payments - request error', {
        error: expect.objectContaining({
          message:
            'test error | Caused by TypeError: intermediate cause | Caused by Error: root cause error'
        }),
        request,
        response: error.extensions.response,
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })

    test('handles unknown errors', () => {
      const rp = new RuralPayments(...datasourceOptions)

      const error = undefined
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - Rural payments - request error', {
        error: { message: 'unknown/empty error while trying to fetch upstream data' },
        request,
        response: {},
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })
  })

  describe('gatewayType / isExternalRoute resolution', () => {
    test('resolves to internal when an email header is present', () => {
      const rp = new RuralPayments(
        { logger },
        { request: { headers: { email: 'test@test.test' } } }
      )

      expect(rp.gatewayType).toBe('rural-payments-internal')
      expect(rp.isExternalRoute()).toBe(false)
    })

    test('resolves to client-service-account when only a service-account header is present', () => {
      const rp = new RuralPayments(
        { logger },
        { request: { headers: { 'service-account': 'dal-service-account@example.com' } } }
      )

      expect(rp.gatewayType).toBe('rural-payments-client-service-account')
      expect(rp.isExternalRoute()).toBe(false)
    })

    test('resolves to external when only an x-forwarded-authorization header is present', () => {
      const rp = new RuralPayments(
        { logger },
        { request: { headers: { 'x-forwarded-authorization': 'token123' } } }
      )

      expect(rp.gatewayType).toBe('rural-payments-external')
      expect(rp.isExternalRoute()).toBe(true)
    })

    test('resolves to dal-service-account when both x-forwarded-authorization and service-account headers are present', () => {
      const rp = new RuralPayments(
        { logger },
        {
          request: {
            headers: {
              'x-forwarded-authorization': 'token123',
              'service-account': 'dal-service-account@example.com'
            }
          }
        }
      )

      expect(rp.gatewayType).toBe('rural-payments-dal-service-account')
      expect(rp.isExternalRoute()).toBe(false)
    })

    test('email always wins, regardless of what other auth headers are also present', () => {
      const rp = new RuralPayments(
        { logger },
        {
          request: {
            headers: {
              email: 'test@test.test',
              'x-forwarded-authorization': 'token123',
              'service-account': 'dal-service-account@example.com'
            }
          }
        }
      )

      expect(rp.gatewayType).toBe('rural-payments-internal')
      expect(rp.isExternalRoute()).toBe(false)
    })

    test('throws if none of email, x-forwarded-authorization or service-account headers are present', () => {
      try {
        new RuralPayments({ logger }, { request: { headers: {} } })
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(HttpError)
        expect(thrownError.extensions).toMatchObject({
          http: { status: StatusCodes.UNPROCESSABLE_ENTITY },
          message:
            'Invalid request headers, must be either "email: {valid user email}", "service-account: {valid service account email}" or "X-Forwarded-Authorization: {defra-id token}" headers'
        })
      }

      // Ensure we actually ran the catch block assertions (i.e. the test did throw)
      expect.assertions(2)
    })
  })

  describe('willSendRequest', () => {
    test('adds email header from request headers for internal requests', async () => {
      const rp = new RuralPayments(...datasourceOptions)
      const request = { headers: {} }
      const path = 'test-path'

      await rp.willSendRequest(path, request)

      expect(request.headers).toEqual({ email: 'test@test.test' })
      expect(logger.debug).toHaveBeenCalledWith('#datasource - Rural payments - request', {
        request: { ...request, url: 'https://rp_kits_gateway_internal_url/test-path' },
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })

    test('adds crn & Authorization headers from x-forwarded-authorization for external requests', async () => {
      const token = jwt.sign({ contactId: 'test-crn' }, 'secret', {
        expiresIn: '1h'
      })
      const rp = new RuralPayments(
        { logger },
        {
          request: {
            headers: {
              'x-forwarded-authorization': token
            }
          }
        }
      )
      const request = { headers: {} }
      const path = 'test-path'

      await rp.willSendRequest(path, request)

      expect(request.headers).toEqual({
        Authorization: token,
        crn: 'test-crn'
      })
      expect(logger.debug).toHaveBeenCalledWith('#datasource - Rural payments - request', {
        request: { ...request, url: 'https://rp_kits_gateway_external_url/test-path' },
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })

    test('adds email header from the service-account value for dal-service-account requests', async () => {
      const rp = new RuralPayments(
        { logger },
        {
          request: {
            headers: {
              'x-forwarded-authorization': 'token123',
              'service-account': 'dal-service-account@example.com'
            }
          }
        }
      )
      const request = { headers: {} }
      const path = 'test-path'

      await rp.willSendRequest(path, request)

      expect(request.headers).toEqual({ email: 'dal-service-account@example.com' })
      expect(logger.debug).toHaveBeenCalledWith('#datasource - Rural payments - request', {
        request: { ...request, url: 'https://rp_kits_gateway_internal_url/test-path' },
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })

    test('does not throw and sends the request unauthenticated when the healthcheck header is present', async () => {
      const rp = new RuralPayments(
        { logger },
        {
          request: {
            headers: {
              healthcheck: true,
              'service-account': 'dal-service-account@example.com'
            }
          }
        }
      )
      const request = { headers: {} }
      const path = 'test-path'

      await expect(rp.willSendRequest(path, request)).resolves.toBeUndefined()
      expect(request.headers).toEqual({})
    })
  })

  describe('trace', () => {
    test('logs request and response details', async () => {
      const rp = new RuralPayments(...datasourceOptions)
      const url = 'test-url'
      const request = { id: '123', method: 'GET', headers: {} }
      const mockResult = {
        response: {
          status: 200,
          headers: new Headers(),
          body: { data: 'test' }
        },
        parsedBody: { data: 'test' }
      }
      const mockFn = jest.fn().mockResolvedValue(mockResult)

      const result = await rp.trace(url, request, mockFn)

      expect(result).toBe(mockResult)
      expect(logger.info).toHaveBeenCalledWith(
        '#datasource - Rural payments - response',
        expect.objectContaining({
          type: 'http',
          code: RURALPAYMENTS_API_REQUEST_001,
          gatewayType: 'rural-payments-internal',
          request: {
            id: '123',
            method: 'GET',
            headers: {},
            url: 'test-url'
          },
          response: mockResult.response
        })
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '#datasource - Rural payments - response detail',
        expect.objectContaining({
          request: { ...request, url: 'test-url' },
          response: expect.objectContaining({
            body: { data: 'test' }
          }),
          code: RURALPAYMENTS_API_REQUEST_001
        })
      )
    })

    test('logs the external gatewayType', async () => {
      const rp = new RuralPayments(
        { logger },
        { request: { headers: { 'x-forwarded-authorization': 'token123' } } }
      )
      const mockFn = jest.fn().mockResolvedValue({
        response: { status: 200, headers: new Headers(), body: {} },
        parsedBody: {}
      })

      await rp.trace('test-url', { id: '123', method: 'GET', headers: {} }, mockFn)

      expect(logger.info).toHaveBeenCalledWith(
        '#datasource - Rural payments - response',
        expect.objectContaining({ gatewayType: 'rural-payments-external' })
      )
    })

    test('logs the dal-service-account gatewayType', async () => {
      const rp = new RuralPayments(
        { logger },
        {
          request: {
            headers: {
              'x-forwarded-authorization': 'token123',
              'service-account': 'dal-service-account@example.com'
            }
          }
        }
      )
      const mockFn = jest.fn().mockResolvedValue({
        response: { status: 200, headers: new Headers(), body: {} },
        parsedBody: {}
      })

      await rp.trace('test-url', { id: '123', method: 'GET', headers: {} }, mockFn)

      expect(logger.info).toHaveBeenCalledWith(
        '#datasource - Rural payments - response',
        expect.objectContaining({ gatewayType: 'rural-payments-dal-service-account' })
      )
    })
  })

  describe('requestDeduplicationPolicyFor', () => {
    test('returns correct deduplication policy', () => {
      const rp = new RuralPayments(...datasourceOptions)
      const url = 'test-url'
      const request = { id: '123', method: 'POST' }

      const policy = rp.requestDeduplicationPolicyFor(url, request)

      expect(policy).toEqual({
        policy: 'deduplicate-during-request-lifetime',
        deduplicationKey: expect.stringContaining('123 POST')
      })
    })
  })

  describe('parseBody', () => {
    test('returns NO_CONTENT status for 204 responses', () => {
      const rp = new RuralPayments(...datasourceOptions)
      const response = {
        status: StatusCodes.NO_CONTENT,
        headers: new Headers()
      }

      const result = rp.parseBody(response)

      expect(result).toEqual({ status: StatusCodes.NO_CONTENT })
    })

    test('parses JSON response when content type is application/json', async () => {
      const rp = new RuralPayments(...datasourceOptions)
      const mockJson = { data: 'test' }
      const response = {
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
          'Content-Length': '20'
        }),
        json: jest.fn().mockResolvedValue(mockJson)
      }

      const result = await rp.parseBody(response)

      expect(result).toBe(mockJson)
      expect(response.json).toHaveBeenCalled()
    })

    test('parses text response for non-JSON content', async () => {
      const rp = new RuralPayments(...datasourceOptions)
      const mockText = 'plain text response'
      const response = {
        status: 200,
        headers: new Headers({
          'Content-Type': 'text/plain',
          'Content-Length': '20'
        }),
        text: jest.fn().mockResolvedValue(mockText)
      }

      const result = await rp.parseBody(response)

      expect(result).toBe(mockText)
      expect(response.text).toHaveBeenCalled()
    })
  })

  describe('throwIfResponseIsError', () => {
    test('throws an HttpError with response details when the response is not ok', async () => {
      const rp = new RuralPayments(...datasourceOptions)
      const options = {
        response: {
          ok: false,
          status: StatusCodes.BAD_REQUEST
        }
      }

      await expect(rp.throwIfResponseIsError(options)).rejects.toBeInstanceOf(HttpError)
      await expect(rp.throwIfResponseIsError(options)).rejects.toMatchObject({
        extensions: {
          http: { status: StatusCodes.BAD_REQUEST },
          response: {
            status: StatusCodes.BAD_REQUEST,
            headers: undefined,
            body: undefined
          }
        }
      })
    })

    test('does not throw when the response is ok', async () => {
      const rp = new RuralPayments(...datasourceOptions)
      const options = { response: { ok: true, status: StatusCodes.OK } }

      await expect(rp.throwIfResponseIsError(options)).resolves.toBeUndefined()
    })
  })
})

describe('extractCrnFromDefraIdToken', () => {
  test('extracts crn successfully from valid token', async () => {
    const response = extractCrnFromDefraIdToken(
      jwt.sign({ contactId: '11111111' }, 'secret', { expiresIn: '1h' })
    )
    expect(response).toEqual('11111111')
  })
  test('Throws error when provided an invalid token', async () => {
    const invalidToken = jwt.sign({}, 'secret', { expiresIn: '1h' })
    expect(() => extractCrnFromDefraIdToken(invalidToken)).toThrow(
      new BadRequest('Defra ID token does not contain crn')
    )
  })
})
