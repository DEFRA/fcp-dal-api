import { jest, afterEach, beforeAll, beforeEach, describe, test, expect } from '@jest/globals'
import { HITACHI_API_NOT_FOUND_001, HITACHI_API_REQUEST_001 } from '../../../../app/logger/codes.js'

// jest.unstable_mockModule is required for ESM packages (@azure/msal-node exports .mjs)
jest.unstable_mockModule('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn()
}))

jest.mock('../../../../app/config.js', () => ({
  config: {
    get: jest.fn((key) => {
      const values = {
        'hitachi.disableAuth': false,
        'hitachi.entra.clientId': '12345678-1234-1234-1234-123456789012',
        'hitachi.entra.clientSecret': 'client-secret',
        'hitachi.entra.tenantId': '12345678-1234-1234-1234-123456789012',
        'hitachi.baseUrl': 'https://api.hitachi.com',
        'hitachi.timeoutMs': 20000
      }
      return values[key]
    })
  }
}))

jest.mock('../../../../app/logger/sendMetric.js', () => ({
  sendMetric: jest.fn()
}))

describe('HitachiPayments', () => {
  let dataSource
  let mockLogger
  let mockPost
  let HitachiPayments

  beforeAll(async () => {
    // HitachiPayments must be imported after unstable_mockModule so its import of @azure/msal-node
    // resolves to the mock, so deferring until beforeAll
    HitachiPayments = (await import('../../../../app/data-sources/hitachi/HitachiPayments.js'))
      .HitachiPayments
  })

  beforeEach(async () => {
    const { config } = await import('../../../../app/config.js')
    config.get = jest.fn((key) => {
      const values = {
        'hitachi.disableAuth': false,
        'hitachi.entra.clientId': '12345678-1234-1234-1234-123456789012',
        'hitachi.entra.clientSecret': 'client-secret',
        'hitachi.entra.tenantId': '12345678-1234-1234-1234-123456789012',
        'hitachi.baseUrl': 'https://api.hitachi.com',
        'hitachi.timeoutMs': 20000
      }
      return values[key]
    })

    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }

    mockPost = jest.fn()

    dataSource = new HitachiPayments({
      audit: {
        requestedSystem: 'dal-api-system',
        requesterId: 'test@example.com',
        correlationId: 'test-correlation-id'
      }
    })
    dataSource.logger = mockLogger
    dataSource.post = mockPost
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('addAuthentication', () => {
    test('should set placeholder token when auth is disabled', async () => {
      const { config } = await import('../../../../app/config.js')
      config.get = jest.fn((key) => {
        if (key === 'hitachi.disableAuth') return true
        return 'mock-value'
      })

      const request = { headers: {} }
      await dataSource.addAuthentication(request)

      expect(request.headers.Authorization).toBe('Bearer token')
    })

    test('should set Authorization header with acquired token when auth is enabled', async () => {
      const { config } = await import('../../../../app/config.js')
      config.get = jest.fn((key) => (key === 'hitachi.disableAuth' ? false : 'mock-value'))

      const acquireTokenByClientCredential = jest
        .fn()
        .mockResolvedValueOnce({ accessToken: 'test-access-token' })
      const { ConfidentialClientApplication } = await import('@azure/msal-node')
      ConfidentialClientApplication.mockImplementation(() => ({ acquireTokenByClientCredential }))

      const request = { headers: {} }
      await dataSource.addAuthentication(request)

      expect(request.headers.Authorization).toBe('Bearer test-access-token')
    })

    test('should handle token acquisition errors', async () => {
      const { config } = await import('../../../../app/config.js')
      config.get = jest.fn((key) => (key === 'hitachi.disableAuth' ? false : 'mock-value'))

      const acquireTokenByClientCredential = jest
        .fn()
        .mockRejectedValueOnce(new Error('MSAL error'))
      const { ConfidentialClientApplication } = await import('@azure/msal-node')
      ConfidentialClientApplication.mockImplementation(() => ({ acquireTokenByClientCredential }))

      const request = { headers: {} }
      await expect(dataSource.addAuthentication(request)).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(
        '#datasource - Hitachi payments - token acquisition failed',
        {
          code: HITACHI_API_REQUEST_001
        }
      )
    })
  })

  describe('getSupplierPayments', () => {
    test('should call post with correct endpoint and body', async () => {
      const mockResponse = {
        Result: true,
        parmSupplierInfo: { name: 'Test Business' },
        parmPayments: [],
        InfoMessages: []
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await dataSource.getSupplierPayments({
        frn: '123456789',
        fromDate: undefined,
        toDate: undefined,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })

      expect(mockPost).toHaveBeenCalledWith(
        '/api/services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
        {
          body: {
            request: {
              payment: {
                SupplierAccount: '123456789'
              },
              audit: {
                requestedSystem: 'dal-api-system',
                requesterId: 'test@example.com',
                userIP: '192.168.1.1',
                resourceId: '123456789',
                correlationId: 'test-correlation-id'
              }
            }
          },
          signal: expect.any(AbortSignal)
        }
      )
      expect(result).toBe(mockResponse)
    })

    test('should use the configured timeout for the abort signal', async () => {
      const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')
      mockPost.mockResolvedValue({ Result: true })

      await dataSource.getSupplierPayments({
        frn: '123456789',
        fromDate: undefined,
        toDate: undefined,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })

      expect(timeoutSpy).toHaveBeenCalledWith(20000)
    })

    test('should throw NotFound when response has Result: false', async () => {
      const mockResponse = {
        Result: false,
        parmSupplierInfo: null,
        parmPayments: null,
        InfoMessages: ['*** FRN does not exist', 'No data retrieved for this request']
      }
      mockPost.mockResolvedValue(mockResponse)

      await expect(
        dataSource.getSupplierPayments({
          frn: '123456789',
          fromDate: undefined,
          toDate: undefined,
          userIP: '192.168.1.1',
          resourceId: '123456789'
        })
      ).rejects.toThrow('Hitachi payments business not found')

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '#datasource - Hitachi payments - business not found with FRN 123456789',
        {
          code: HITACHI_API_NOT_FOUND_001
        }
      )
    })

    test('should include fromDate in payment request when provided', async () => {
      const mockResponse = {
        Result: true,
        parmSupplierInfo: { name: 'Test Business' },
        parmPayments: [],
        InfoMessages: []
      }
      mockPost.mockResolvedValue(mockResponse)

      const fromDate = new Date('2023-01-01')
      const result = await dataSource.getSupplierPayments({
        frn: '123456789',
        fromDate,
        toDate: undefined,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })

      expect(mockPost).toHaveBeenCalledWith(
        '/api/services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
        {
          body: {
            request: {
              payment: {
                SupplierAccount: '123456789',
                FromDate: fromDate.toISOString()
              },
              audit: {
                requestedSystem: 'dal-api-system',
                requesterId: 'test@example.com',
                userIP: '192.168.1.1',
                resourceId: '123456789',
                correlationId: 'test-correlation-id'
              }
            }
          },
          signal: expect.any(AbortSignal)
        }
      )
      expect(result).toBe(mockResponse)
    })

    test('should include toDate in payment request when provided', async () => {
      const mockResponse = {
        Result: true,
        parmSupplierInfo: { name: 'Test Business' },
        parmPayments: [],
        InfoMessages: []
      }
      mockPost.mockResolvedValue(mockResponse)

      const toDate = new Date('2023-12-31')
      const result = await dataSource.getSupplierPayments({
        frn: '123456789',
        fromDate: undefined,
        toDate,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })

      expect(mockPost).toHaveBeenCalledWith(
        '/api/services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
        {
          body: {
            request: {
              payment: {
                SupplierAccount: '123456789',
                ToDate: toDate.toISOString()
              },
              audit: {
                requestedSystem: 'dal-api-system',
                requesterId: 'test@example.com',
                userIP: '192.168.1.1',
                resourceId: '123456789',
                correlationId: 'test-correlation-id'
              }
            }
          },
          signal: expect.any(AbortSignal)
        }
      )
      expect(result).toBe(mockResponse)
    })

    test('should include both dates in payment request when provided', async () => {
      const mockResponse = {
        Result: true,
        parmSupplierInfo: { name: 'Test Business' },
        parmPayments: [],
        InfoMessages: []
      }
      mockPost.mockResolvedValue(mockResponse)

      const fromDate = new Date('2023-01-01')
      const toDate = new Date('2023-12-31')
      const result = await dataSource.getSupplierPayments({
        frn: '123456789',
        fromDate,
        toDate,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })

      expect(mockPost).toHaveBeenCalledWith(
        '/api/services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
        {
          body: {
            request: {
              payment: {
                SupplierAccount: '123456789',
                FromDate: fromDate.toISOString(),
                ToDate: toDate.toISOString()
              },
              audit: {
                requestedSystem: 'dal-api-system',
                requesterId: 'test@example.com',
                userIP: '192.168.1.1',
                resourceId: '123456789',
                correlationId: 'test-correlation-id'
              }
            }
          },
          signal: expect.any(AbortSignal)
        }
      )
      expect(result).toBe(mockResponse)
    })

    test('should throw HttpError when userIP is missing', async () => {
      await expect(
        dataSource.getSupplierPayments({
          frn: '123456789',
          fromDate: undefined,
          toDate: undefined,
          userIP: undefined,
          resourceId: '123456789'
        })
      ).rejects.toMatchObject({
        extensions: {
          message: 'Missing required value: userIP'
        }
      })
    })

    test.each(['not-an-ip', 'localhost', '999.999.999.999', '192.168.1'])(
      'should throw HttpError when userIP is invalid (%s)',
      async (userIP) => {
        await expect(
          dataSource.getSupplierPayments({
            frn: '123456789',
            fromDate: undefined,
            toDate: undefined,
            userIP,
            resourceId: '123456789'
          })
        ).rejects.toMatchObject({
          extensions: {
            message: 'Invalid value: userIP must be a valid IP address'
          }
        })
      }
    )

    test.each(['192.168.1.1', '10.0.0.1', '::1', '2001:db8::1'])(
      'should accept valid IP address (%s)',
      async (userIP) => {
        mockPost.mockResolvedValue({ Result: true })

        await expect(
          dataSource.getSupplierPayments({
            frn: '123456789',
            fromDate: undefined,
            toDate: undefined,
            userIP,
            resourceId: '123456789'
          })
        ).resolves.not.toThrow()
      }
    )

    test('should throw HttpError when multiple audit values are missing', async () => {
      const dataSourceWithMissingAudit = new HitachiPayments({
        audit: {
          requestedSystem: 'dal-api-system',
          requesterId: undefined, // Missing
          correlationId: undefined // Missing
        }
      })
      dataSourceWithMissingAudit.logger = mockLogger
      dataSourceWithMissingAudit.post = mockPost

      await expect(
        dataSourceWithMissingAudit.getSupplierPayments({
          frn: '123456789',
          fromDate: undefined,
          toDate: undefined,
          userIP: '192.168.1.1',
          resourceId: undefined // Missing
        })
      ).rejects.toMatchObject({
        extensions: {
          message: 'Internal server error'
        }
      })

      // Verify that the detailed error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        '#datasource - Hitachi payments - missing server-side audit values: requesterId, correlationId, resourceId',
        {
          code: HITACHI_API_REQUEST_001
        }
      )
    })
  })
})
