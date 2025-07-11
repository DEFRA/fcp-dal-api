import { RESTDataSource } from '@apollo/datasource-rest'
import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals'
import StatusCodes from 'http-status-codes'
import { RuralPayments } from '../../../app/data-sources/rural-payments/RuralPayments.js'
import { HttpError } from '../../../app/errors/graphql.js'
import { RURALPAYMENTS_API_REQUEST_001 } from '../../../app/logger/codes.js'

const logger = {
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn()
}

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
      const rp = new RuralPayments({ logger })

      mockFetch.mockResolvedValueOnce('data')

      expect(await rp.fetch('path', dummyRequest)).toBe('data')
      expect(mockFetch).toBeCalledTimes(1)
    })

    describe('throws upstream errors from RPP', () => {
      test('when the RPP service encounters an error', async () => {
        const error = new Error('Server error')
        error.extensions = { response: { status: StatusCodes.INTERNAL_SERVER_ERROR } }

        mockFetch.mockRejectedValue(error)

        const rp = new RuralPayments({ logger })
        try {
          await rp.fetch('path', dummyRequest)
        } catch (thrownError) {
          expect(thrownError.extensions).toMatchObject({
            response: { status: StatusCodes.INTERNAL_SERVER_ERROR }
          })
          expect(mockFetch).toBeCalledTimes(1)
        }
        expect.assertions(2)
      })

      test('when the RPP service is totally unreachable', async () => {
        mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

        const rp = new RuralPayments({ logger })
        await expect(rp.fetch('path', dummyRequest)).rejects.toThrow(new Error('ECONNREFUSED'))
        expect(mockFetch).toBeCalledTimes(1)
      })
    })
  })

  describe('didEncounterError', () => {
    test('handles RPP errors', () => {
      const rp = new RuralPayments({ logger })

      const error = new Error('test error')
      error.extensions = { response: { status: 400, headers: { get: () => 'text/html' } } }
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - Rural payments - request error', {
        error,
        request,
        response: error.extensions.response,
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })
    test('handles unknown RPP errors', () => {
      const rp = new RuralPayments({ logger })

      const error = undefined
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - Rural payments - request error', {
        error,
        request,
        response: {},
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })
  })

  describe('willSendRequest', () => {
    test('adds email header from request headers', () => {
      const rp = new RuralPayments({ logger }, { headers: { email: 'test@example.com' } })
      const request = { headers: {} }
      const path = 'test-path'

      rp.willSendRequest(path, request)

      expect(request.headers).toEqual({ email: 'test@example.com' })
      expect(logger.debug).toHaveBeenCalledWith('#datasource - Rural payments - request', {
        request: { ...request, path: 'test-path' },
        code: RURALPAYMENTS_API_REQUEST_001
      })
    })
  })

  describe('trace', () => {
    test('logs request and response details', async () => {
      const rp = new RuralPayments({ logger })
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
          request: {
            id: '123',
            method: 'GET',
            headers: {},
            path: 'test-url'
          },
          response: { statusCode: 200 }
        })
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '#datasource - Rural payments - response detail',
        expect.objectContaining({
          request: { ...request, path: 'test-url' },
          response: expect.objectContaining({
            body: { data: 'test' }
          }),
          code: RURALPAYMENTS_API_REQUEST_001
        })
      )
    })
  })

  describe('requestDeduplicationPolicyFor', () => {
    test('returns correct deduplication policy', () => {
      const rp = new RuralPayments({ logger })
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
      const rp = new RuralPayments({ logger })
      const response = {
        status: StatusCodes.NO_CONTENT,
        headers: new Headers()
      }

      const result = rp.parseBody(response)

      expect(result).toEqual({ status: StatusCodes.NO_CONTENT })
    })

    test('parses JSON response when content type is application/json', async () => {
      const rp = new RuralPayments({ logger })
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
      const rp = new RuralPayments({ logger })
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
    test('returns NO_CONTENT status for 204 responses', () => {
      const rp = new RuralPayments({ logger })
      const options = {
        response: {
          ok: false,
          status: StatusCodes.BAD_REQUEST
        }
      }

      const extensions = {
        ...options,
        response: {
          status: options.response?.status,
          headers: options.response?.headers,
          body: options.parsedBody
        }
      }
      expect(rp.throwIfResponseIsError(options)).rejects.toEqual(
        new HttpError(options.response?.status, {
          extensions
        })
      )
    })
  })
})
