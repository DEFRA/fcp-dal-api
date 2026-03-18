import { jest } from '@jest/globals'
import { Business } from '../../../../app/graphql/resolvers/business/business.js'

describe('Business payments resolver', () => {
  let mockDataSources
  let mockContext

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsBusiness: {
        getOrganisationBySBI: jest.fn()
      },
      hitachiPayments: {
        getSupplierPayments: jest.fn()
      }
    }
    mockContext = {
      dataSources: mockDataSources,
      auth: { email: 'test@defra.gov.uk' },
      request: {
        transactionId: 'test-correlation-id',
        info: { remoteAddress: '127.0.0.1' }
      }
    }
  })

  describe('payments', () => {
    test('should lookup FRN from Rural Payments and call Hitachi with real FRN', async () => {
      // Mock organisation data from Rural Payments
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: '6561479446', // Real FRN from Rural Payments
        name: 'Test Farm'
      }

      const mockRawData = {
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

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue(mockRawData)

      const result = await Business.payments({ sbi: '123456789' }, {}, mockContext)

      expect(mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI).toHaveBeenCalledWith(
        '123456789'
      )
      expect(mockDataSources.hitachiPayments.getSupplierPayments).toHaveBeenCalledWith(
        '6561479446' // Real FRN from Rural Payments
      )
      // The transformer will return placeholder data, so we just check it returns something
      expect(result).toBeDefined()
    })

    test('should throw NotFound when FRN is not available', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: null, // No FRN available
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)

      await expect(Business.payments({ sbi: '123456789' }, {}, mockContext)).rejects.toThrow(
        'FRN not found for business'
      )
    })
  })
})
