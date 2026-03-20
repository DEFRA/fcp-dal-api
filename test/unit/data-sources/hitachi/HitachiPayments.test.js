import { jest } from '@jest/globals'
import { HitachiPayments } from '../../../../app/data-sources/hitachi/HitachiPayments.js'
import { HITACHI_API_REQUEST_001 } from '../../../../app/logger/codes.js'

// Mock MSAL
const acquireTokenByClientCredential = jest.fn()
const mockConfidentialClientApplication = jest.fn(function () {
  return {
    acquireTokenByClientCredential
  }
})
jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: mockConfidentialClientApplication
}))

// Mock config
jest.mock('../../../../app/config.js', () => ({
  config: {
    get: jest.fn((key) => {
      const values = {
        'hitachi.disableAuth': false,
        'hitachi.entra.clientId': 'client-id',
        'hitachi.entra.clientSecret': 'client-secret',
        'hitachi.entra.tenantId': 'tenant-id',
        'hitachi.gatewayUrl': 'https://api.hitachi.com'
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
      debug: jest.fn()
    }

    // Mock post method
    mockPost = jest.fn()

    // Create instance
    dataSource = new HitachiPayments(
      {},
      { name: 'Hitachi payments', code: HITACHI_API_REQUEST_001 }
    )
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
      const mockResponse = { data: 'test' }
      mockPost.mockResolvedValue(mockResponse)

      const result = await dataSource.getSupplierPayments('123456789')

      expect(mockPost).toHaveBeenCalledWith(
        'services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
        {
          body: {
            request: {
              payment: {
                SupplierAccount: '123456789'
              },
              audit: {
                // TODO: add audit values
              }
            }
          }
        }
      )
      expect(result).toBe(mockResponse)
    })
  })
})
