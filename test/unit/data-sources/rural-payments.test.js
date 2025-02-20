import { RESTDataSource } from '@apollo/datasource-rest'
import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { RuralPayments } from '../../../app/data-sources/rural-payments/RuralPayments.js'
import { APIM_APIM_REQUEST_001, RURALPAYMENTS_API_REQUEST_001 } from '../../../app/logger/codes.js'

const logger = {
  error: jest.fn(),
  warn: jest.fn()
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
        error.extensions = { response: { status: 500 } }

        mockFetch.mockRejectedValue(error)

        const rp = new RuralPayments({ logger })
        try {
          await rp.fetch('path', dummyRequest)
        } catch (thrownError) {
          expect(thrownError.extensions).toMatchObject({ response: { status: 500 } })
          expect(mockFetch).toBeCalledTimes(3) // same as `maximumRetries` in RuralPayments.js
        }
        expect.assertions(2)
      })

      test('when the RPP service is totally unreachable', async () => {
        mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

        const rp = new RuralPayments({ logger })
        await expect(rp.fetch('path', dummyRequest)).rejects.toThrow(new Error('Bad Gateway'))
        expect(mockFetch).toBeCalledTimes(1)
      })
    })
  })

  describe('didEncounterError', () => {
    test('handles RPP errors', () => {
      // eslint-disable-next-line no-new
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

    test('handles APIM errors with error.extensions', () => {
      // eslint-disable-next-line no-new
      const rp = new RuralPayments({ logger })

      const error = new Error('test error')
      error.extensions = { response: { status: 400 } }
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - apim - request error', {
        error,
        request,
        response: error.extensions.response,
        code: APIM_APIM_REQUEST_001
      })
    })

    test('handles APIM errors without error.extensions', () => {
      // eslint-disable-next-line no-new
      const rp = new RuralPayments({ logger })

      const error = new Error('test error')
      const request = {}
      const url = 'test url'

      rp.didEncounterError(error, request, url)

      expect(logger.error).toHaveBeenCalledWith('#datasource - apim - request error', {
        error,
        request,
        response: error?.extensions?.response,
        code: APIM_APIM_REQUEST_001
      })
    })
  })
})
