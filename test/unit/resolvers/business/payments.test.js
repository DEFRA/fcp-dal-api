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

    test('records the resolved FRN as an account and a payment-list entity on the audit trail', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: '6561479446',
        name: 'Test Farm'
      }
      const auditTrail = {
        recordAccount: jest.fn(),
        recordEntity: jest.fn()
      }
      const info = { path: { key: 'business', typename: 'Query', prev: undefined } }

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      await Business.payments(
        { sbi: '123456789' },
        { userIP: '192.168.1.1' },
        { ...mockContext, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'frn', '6561479446')
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'payment-list',
        action: 'read',
        entityid: '6561479446'
      })
    })

    test('does not record anything on the audit trail when the FRN cannot be found', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '123456789',
        businessReference: null,
        name: 'Test Farm'
      }
      const auditTrail = {
        recordAccount: jest.fn(),
        recordEntity: jest.fn()
      }
      const info = { path: { key: 'business', typename: 'Query', prev: undefined } }

      mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)

      await expect(
        Business.payments(
          { sbi: '123456789' },
          { userIP: '192.168.1.1' },
          { ...mockContext, auditTrail },
          info
        )
      ).rejects.toThrow('FRN not found for business')

      expect(auditTrail.recordAccount).not.toHaveBeenCalled()
      expect(auditTrail.recordEntity).not.toHaveBeenCalled()
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
