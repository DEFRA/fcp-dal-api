import { jest } from '@jest/globals'

// Mock MSAL before importing HitachiPayments
jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
    acquireTokenByClientCredential: jest.fn()
  }))
}))

// Mock config before importing HitachiPayments
const mockConfig = {
  get: jest.fn((key) => {
    const mockValues = {
      'hitachi.disableAuth': false,
      'hitachi.entra.clientId': 'test-client-id',
      'hitachi.entra.clientSecret': 'test-client-secret',
      'hitachi.entra.tenantId': 'test-tenant-id',
      'hitachi.gatewayUrl': 'https://api.example.com'
    }
    return mockValues[key]
  })
}

jest.mock('../../../../app/config.js', () => ({
  config: mockConfig
}))

import { HitachiPayments } from '../../../../app/data-sources/hitachi/HitachiPayments.js'

describe('HitachiPayments', () => {
  let dataSource
  let mockLogger

  beforeEach(() => {
    mockLogger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
    dataSource = new HitachiPayments({ logger: mockLogger })
  })

  describe('addAuthentication', () => {
    test('should add placeholder Bearer token when auth is disabled', async () => {
      // Mock config to return true for disableAuth
      mockConfig.get.mockImplementation((key) => {
        if (key === 'hitachi.disableAuth') return true
        return 'mock-value'
      })

      const mockRequest = { headers: {} }

      await dataSource.addAuthentication(mockRequest)

      expect(mockRequest.headers.Authorization).toBe('Bearer token')
    })
  })

  describe('getSupplierPayments', () => {
    test('should make POST request to correct endpoint with proper request body', async () => {
      const mockResponse = {
        Result: true,
        parmSupplierInfo: {
          parmSupplier: 'John Smith Farming Ltd',
          parmHoldCodes: ['HOLD_123'],
          parmAccountLast4: '****5678',
          parmSortCode: '123456'
        },
        parmPayments: [
          {
            parmPaymentReference: 'PY0202826',
            parmDate: '2024-03-15T00:00:00',
            parmAmount: 1500.75,
            parmCurrency: 'GBP',
            parmLineItems: [
              {
                parmAgreementNumber: 'AG12345',
                parmClaimRefNumber: 'CLM001',
                parmScheme: '10501',
                parmDescription: 'Basic Payment Scheme',
                parmMarketingYear: '2023',
                parmAmount: 1500.75
              }
            ]
          }
        ],
        InfoMessages: []
      }

      // Mock the RESTDataSource post method
      dataSource.post = jest.fn().mockResolvedValue(mockResponse)

      const result = await dataSource.getSupplierPayments('FRN123456789')

      expect(dataSource.post).toHaveBeenCalledWith(
        'services/RSFVendPaymentDetailsServiceGroup/RSFVendPaymentDetailsService/getSupplierPaymentsPackage',
        {
          body: {
            request: {
              payment: {
                SupplierAccount: 'FRN123456789'
              },
              audit: {}
            }
          }
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
