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
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: '6561479446',
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      const result = await Business.payments(
        { sbi: '123456789' },
        { userIP: '192.168.1.1' },
        mockContext
      )

      expect(mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI).toHaveBeenCalledWith(
        '123456789'
      )
      expect(mockDataSources.hitachiPayments.getSupplierPayments).toHaveBeenCalledWith({
        frn: '6561479446',
        fromDate: undefined,
        toDate: undefined,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })
      expect(result).toBeDefined()
    })

    test('should pass date filters to Hitachi datasource', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: '6561479446',
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      const fromDate = new Date('2023-01-01')
      const toDate = new Date('2023-12-31')

      await Business.payments(
        { sbi: '123456789' },
        { fromDate, toDate, userIP: '192.168.1.1' },
        mockContext
      )

      expect(mockDataSources.hitachiPayments.getSupplierPayments).toHaveBeenCalledWith({
        frn: '6561479446',
        fromDate,
        toDate,
        userIP: '192.168.1.1',
        resourceId: '123456789'
      })
    })

    test('should throw NotFound when FRN is not available', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: null, // No FRN available
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)

      await expect(
        Business.payments({ sbi: '123456789' }, { userIP: '192.168.1.1' }, mockContext)
      ).rejects.toThrow('FRN not found for business')
    })

    test('should throw NotFound when Hitachi returns Result: false', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: '6561479446',
        name: 'Test Farm'
      }

      const { NotFound } = await import('../../../../app/errors/graphql.js')
      const notFoundError = new NotFound(
        'Hitachi payments: *** FRN does not exist, No data retrieved for this request'
      )

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockRejectedValue(notFoundError)

      await expect(
        Business.payments({ sbi: '123456789' }, { userIP: '192.168.1.1' }, mockContext)
      ).rejects.toThrow(
        'Hitachi payments: *** FRN does not exist, No data retrieved for this request'
      )
    })
  })
})
