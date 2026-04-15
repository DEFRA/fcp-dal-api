import { jest } from '@jest/globals'
import StatusCodes from 'http-status-codes'
import { BaseRESTDataSource } from '../../../app/data-sources/BaseRESTDataSource.js'

// Mock the logger
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// Mock sendMetric
jest.mock('../../../app/logger/sendMetric.js', () => ({
  sendMetric: jest.fn()
}))

describe('BaseRESTDataSource', () => {
  let dataSource

  beforeEach(() => {
    dataSource = new BaseRESTDataSource({}, { name: 'Test DataSource', code: 'TEST_001' })
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

  describe('didEncounterError', () => {
    test('should set request.path and log error when error occurs', () => {
      const mockError = new Error('Test error')
      const mockRequest = { headers: {} }
      const mockUrl = 'https://api.example.com/test'

      dataSource.didEncounterError(mockError, mockRequest, mockUrl)

      expect(mockRequest.path).toBe(mockUrl)
      expect(mockLogger.error).toHaveBeenCalledWith(
        '#datasource - Test DataSource - request error',
        {
          error: mockError,
          request: mockRequest,
          response: {},
          code: 'TEST_001'
        }
      )
    })

    test('should handle null error and create default error message', () => {
      const mockRequest = { headers: {} }
      const mockUrl = 'https://api.example.com/test'

      dataSource.didEncounterError(null, mockRequest, mockUrl)

      expect(mockRequest.path).toBe(mockUrl)
      expect(mockLogger.error).toHaveBeenCalledWith(
        '#datasource - Test DataSource - request error',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'unknown/empty error while trying to fetch upstream data'
          }),
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
})
