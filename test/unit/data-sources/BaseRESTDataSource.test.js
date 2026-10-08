import { jest } from '@jest/globals'
import StatusCodes from 'http-status-codes'

// Mock the logger
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// Mock sendMetric
const mockSendMetric = { sendMetric: jest.fn() }
jest.unstable_mockModule('../../../app/logger/sendMetric.js', () => mockSendMetric)

const { BaseRESTDataSource } = await import('../../../app/data-sources/BaseRESTDataSource.js')

describe('BaseRESTDataSource', () => {
  let dataSource

  beforeEach(() => {
    jest.clearAllMocks()
    dataSource = new BaseRESTDataSource(
      {},
      { name: 'Test DataSource', code: 'TEST_001', gatewayType: 'test-gateway' }
    )
    dataSource.logger = mockLogger
  })

  describe('addAuthentication', () => {
    test('should be callable with default implementation', () => {
      const mockRequest = { headers: {} }

      // Should not throw and should not modify request
      expect(() => dataSource.addAuthentication(mockRequest)).not.toThrow()
      expect(mockRequest.headers).toEqual({})
    })
  })

  describe('trace', () => {
    const url = new URL('https://api.example.com/test')
    const request = { id: '123', method: 'get', headers: {} }

    test('should log and send request time metric for successful responses', async () => {
      const mockResult = {
        response: { status: 200, headers: new Headers(), body: 'body' },
        parsedBody: { data: 'test' }
      }

      const result = await dataSource.trace(url, request, async () => mockResult)

      expect(result).toBe(mockResult)
      expect(mockSendMetric.sendMetric).toHaveBeenCalledWith(
        'RequestTime',
        expect.any(Number),
        'Milliseconds',
        { code: 'TEST_001' }
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        '#datasource - Test DataSource - response',
        expect.objectContaining({
          code: 'TEST_001',
          gatewayType: 'test-gateway',
          requestTimeMs: expect.any(Number),
          request: expect.objectContaining({ method: 'GET', url: url.toString() }),
          response: expect.objectContaining({ status: 200 })
        })
      )
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    test('should log the error with request timing and rethrow', async () => {
      const mockError = new Error('Upstream error')
      mockError.extensions = { response: { status: 503 } }

      await expect(
        dataSource.trace(url, request, async () => {
          throw mockError
        })
      ).rejects.toBe(mockError)

      expect(mockLogger.error).toHaveBeenCalledWith(
        '#datasource - Test DataSource - request error',
        {
          error: expect.objectContaining({ message: 'Upstream error' }),
          gatewayType: 'test-gateway',
          requestTimeMs: expect.any(Number),
          request: { ...request, url: url.toString() },
          response: { status: 503 },
          code: 'TEST_001'
        }
      )
      expect(mockLogger.info).not.toHaveBeenCalled()
    })

    test('should send request time metric for failed requests', async () => {
      const timeoutError = new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError'
      )

      await expect(
        dataSource.trace(url, request, async () => {
          throw timeoutError
        })
      ).rejects.toBe(timeoutError)

      expect(mockSendMetric.sendMetric).toHaveBeenCalledWith(
        'RequestTime',
        expect.any(Number),
        'Milliseconds',
        { code: 'TEST_001' }
      )
    })

    test('should include time elapsed before the failure in requestTimeMs', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1250)

      await expect(
        dataSource.trace(url, request, async () => {
          throw new Error('Timed out')
        })
      ).rejects.toThrow('Timed out')

      expect(mockSendMetric.sendMetric).toHaveBeenCalledWith('RequestTime', 250, 'Milliseconds', {
        code: 'TEST_001'
      })
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ requestTimeMs: 250 })
      )
      nowSpy.mockRestore()
    })

    test('should handle null error and log default message', async () => {
      await expect(
        dataSource.trace(url, request, async () => {
          throw null
        })
      ).rejects.toBeNull()

      expect(mockLogger.error).toHaveBeenCalledWith(
        '#datasource - Test DataSource - request error',
        expect.objectContaining({
          error: { message: 'unknown/empty error while trying to fetch upstream data' },
          response: {},
          code: 'TEST_001'
        })
      )
    })
  })

  describe('parseBody', () => {
    test('should return status object for NO_CONTENT responses', () => {
      const mockResponse = {
        status: StatusCodes.NO_CONTENT,
        headers: new Map([['Content-Type', 'application/json']])
      }

      const result = dataSource.parseBody(mockResponse)

      expect(result).toEqual({ status: StatusCodes.NO_CONTENT })
    })

    test('should parse JSON when content-type is application/json and content-length is not 0', async () => {
      const mockJsonData = { test: 'data' }
      const mockResponse = {
        status: 200,
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['Content-Length', '123']
        ]),
        json: jest.fn().mockResolvedValue(mockJsonData)
      }

      const result = await dataSource.parseBody(mockResponse)

      expect(mockResponse.json).toHaveBeenCalled()
      expect(result).toBe(mockJsonData)
    })

    test('should parse JSON when content-type ends with +json', async () => {
      const mockJsonData = { test: 'data' }
      const mockResponse = {
        status: 200,
        headers: new Map([
          ['Content-Type', 'application/vnd.api+json'],
          ['Content-Length', '123']
        ]),
        json: jest.fn().mockResolvedValue(mockJsonData)
      }

      const result = await dataSource.parseBody(mockResponse)

      expect(mockResponse.json).toHaveBeenCalled()
      expect(result).toBe(mockJsonData)
    })

    test('should return text for non-JSON content-types', async () => {
      const mockTextData = 'plain text response'
      const mockResponse = {
        status: 200,
        headers: new Map([
          ['Content-Type', 'text/plain'],
          ['Content-Length', '123']
        ]),
        text: jest.fn().mockResolvedValue(mockTextData)
      }

      const result = await dataSource.parseBody(mockResponse)

      expect(mockResponse.text).toHaveBeenCalled()
      expect(result).toBe(mockTextData)
    })

    test('should return text when content-type is missing', async () => {
      const mockTextData = 'response without content-type'
      const mockResponse = {
        status: 200,
        headers: new Map([['Content-Length', '123']]),
        text: jest.fn().mockResolvedValue(mockTextData)
      }

      const result = await dataSource.parseBody(mockResponse)

      expect(mockResponse.text).toHaveBeenCalled()
      expect(result).toBe(mockTextData)
    })

    test('should return text when content-length is 0', async () => {
      const mockTextData = 'empty response'
      const mockResponse = {
        status: 200,
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['Content-Length', '0']
        ]),
        text: jest.fn().mockResolvedValue(mockTextData)
      }

      const result = await dataSource.parseBody(mockResponse)

      expect(mockResponse.text).toHaveBeenCalled()
      expect(result).toBe(mockTextData)
    })

    test('should return text when content-length header is missing and content-type is non-JSON', async () => {
      const mockTextData = 'response without content-length header'
      const mockResponse = {
        status: 200,
        headers: new Map([['Content-Type', 'text/xml']]),
        text: jest.fn().mockResolvedValue(mockTextData)
      }

      const result = await dataSource.parseBody(mockResponse)

      expect(mockResponse.text).toHaveBeenCalled()
      expect(result).toBe(mockTextData)
    })
  })

  describe('prepareErrorForLogging', () => {
    test('returns default message for null error', () => {
      const result = dataSource.prepareErrorForLogging(null)

      expect(result).toEqual({ message: 'unknown/empty error while trying to fetch upstream data' })
    })

    test('returns message, name and stack for an error', () => {
      const error = new Error('Something went wrong')

      const result = dataSource.prepareErrorForLogging(error)

      expect(result).toEqual({ message: 'Something went wrong', name: 'Error', stack: error.stack })
    })

    test('appends single cause to message', () => {
      const error = new Error('Top level error')
      error.cause = new TypeError('Root cause')

      const result = dataSource.prepareErrorForLogging(error)

      expect(result.message).toBe('Top level error | Caused by TypeError: Root cause')
    })

    test('walks full cause chain for nested causes', () => {
      const rootCause = new Error('Root cause')
      const middleCause = new TypeError('Middle cause')
      middleCause.cause = rootCause
      const error = new Error('Top level error')
      error.cause = middleCause

      const result = dataSource.prepareErrorForLogging(error)

      expect(result.message).toBe(
        'Top level error | Caused by TypeError: Middle cause | Caused by Error: Root cause'
      )
    })

    test('does not throw for DOMException TimeoutError (read-only message property)', () => {
      // AbortSignal.timeout fires a DOMException whose `message` is getter-only in strict mode.
      const timeoutError = new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError'
      )

      expect(() => dataSource.prepareErrorForLogging(timeoutError)).not.toThrow()

      const result = dataSource.prepareErrorForLogging(timeoutError)
      expect(result).toEqual(
        expect.objectContaining({
          message: 'The operation was aborted due to timeout',
          name: 'TimeoutError'
        })
      )
    })
  })
})
