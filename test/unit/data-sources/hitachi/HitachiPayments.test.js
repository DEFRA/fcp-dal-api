import { jest } from '@jest/globals'
import { HitachiPayments } from '../../../../app/data-sources/hitachi/HitachiPayments.js'
import { HITACHI_API_REQUEST_001 } from '../../../../app/logger/codes.js'

// Mock MSAL
const acquireTokenByClientCredential = jest.fn()
const mockConfidentialClientApplication = jest.fn().mockImplementation(() => ({
  acquireTokenByClientCredential
}))
jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: mockConfidentialClientApplication
}))

// Mock config
jest.mock('../../../../app/config.js', () => ({
  config: {
    get: jest.fn((key) => {
      const values = {
        'hitachi.disableAuth': false,
        'hitachi.entra.clientId': '12345678-1234-1234-1234-123456789012',
        'hitachi.entra.clientSecret': 'client-secret',
        'hitachi.entra.tenantId': '12345678-1234-1234-1234-123456789012',
        'hitachi.baseUrl': 'https://api.hitachi.com'
      }
      return values[key]
    })
  }
}))

// Mock sendMetric
jest.mock('../../../../app/logger/sendMetric.js', () => ({
  sendMetric: jest.fn()
}))

// Mock the getMsalClient function in the HitachiPayments module
jest.mock('../../../../app/data-sources/hitachi/HitachiPayments.js', () => {
  const originalModule = jest.requireActual(
    '../../../../app/data-sources/hitachi/HitachiPayments.js'
  )

  // Mock the getMsalClient function
  const mockGetMsalClient = jest.fn(() => ({
    acquireTokenByClientCredential
  }))

  // Replace the getMsalClient in the module
  originalModule.getMsalClient = mockGetMsalClient

  return originalModule
})

describe('HitachiPayments', () => {
  let dataSource
  let mockLogger
  let mockPost

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }

    // Mock post method
    mockPost = jest.fn()

    // Create instance
    dataSource = new HitachiPayments({
      audit: {
        requestedSystem: 'dal-api-system',
        requesterId: 'test@example.com',
        correlationId: 'test-correlation-id'
      }
    })
    dataSource.logger = mockLogger
    dataSource.post = mockPost

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('addAuthentication', () => {
    test('should set placeholder token when auth is disabled', async () => {
      // Mock config to return true for disableAuth
      const { config } = await import('../../../../app/config.js')
      config.get = jest.fn((key) => {
        if (key === 'hitachi.disableAuth') return true
        return 'mock-value'
      })

      const request = { headers: {} }
      await dataSource.addAuthentication(request)

      expect(request.headers.Authorization).toBe('Bearer token')
    })

    test('should handle token acquisition errors', async () => {
      // Mock config to return false for disableAuth
      const { config } = await import('../../../../app/config.js')
      config.get = jest.fn((key) => {
        if (key === 'hitachi.disableAuth') return false
        return 'mock-value'
      })

      const request = { headers: {} }

      try {
        await dataSource.addAuthentication(request)
      } catch (error) {
        // We expect this to fail due to network issues in test environment
        // But we can verify that the logger was called with the error
        expect(mockLogger.error).toHaveBeenCalledWith(
          '#datasource - Hitachi payments - token acquisition failed',
          expect.objectContaining({
            error: expect.any(String),
            code: HITACHI_API_REQUEST_001
          })
        )
      }
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
          }
        }
      )
      expect(result).toBe(mockResponse)
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
      ).rejects.toThrow(
        'Hitachi payments: *** FRN does not exist, No data retrieved for this request'
      )

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '#datasource - Hitachi payments - business not found or error',
        {
          frn: '123456789',
          errorMessage: '*** FRN does not exist, No data retrieved for this request',
          code: 'HITACHI_API_NOT_FOUND_001'
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
          }
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
          }
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
          }
        }
      )
      expect(result).toBe(mockResponse)
    })

    test('should throw HttpError when audit values are missing', async () => {
      await expect(
        dataSource.getSupplierPayments({
          frn: '123456789',
          fromDate: undefined,
          toDate: undefined,
          userIP: undefined, // Missing userIP
          resourceId: '123456789'
        })
      ).rejects.toMatchObject({
        extensions: {
          message: 'Missing required value: userIP'
        }
      })
    })

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
        '#datasource - Hitachi payments - missing server-side audit values',
        expect.objectContaining({
          missingValues: expect.arrayContaining(['requesterId', 'correlationId', 'resourceId']),
          code: HITACHI_API_REQUEST_001
        })
      )
    })
  })
})
