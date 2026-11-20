import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Business } from '../../../../app/graphql/resolvers/business/business.js'

describe('Business payments resolver', () => {
  let mockDataSources
  let mockContext

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsBusiness: {
        getOrganisationById: vi.fn()
      },
      mongoBusiness: {
        getFrnBySbi: vi.fn(),
        upsertFrnBySbi: vi.fn(),
        // orgId already cached, so a cache miss on the frn only needs the organisation fetch
        getOrgIdBySbi: vi.fn().mockResolvedValue(12345),
        upsertOrgIdBySbi: vi.fn()
      },
      hitachiPayments: {
        getSupplierPayments: vi.fn()
      }
    }
    mockContext = {
      dataSources: mockDataSources,
      auth: { email: 'test@defra.gov.uk' },
      request: {
        traceId: 'test-trace-id',
        info: { remoteAddress: '127.0.0.1' }
      }
    }
  })

  describe('payments', () => {
    test('should lookup FRN from Rural Payments and call Hitachi with real FRN', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '823456789',
        businessReference: '6561479446', // sfd-id-check: allow
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      const result = await Business.payments(
        { sbi: '823456789' },
        { userIP: '192.168.1.1' },
        mockContext
      )

      expect(mockDataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(12345)
      expect(mockDataSources.mongoBusiness.upsertFrnBySbi).toHaveBeenCalledWith(
        '823456789',
        '6561479446' // sfd-id-check: allow
      )
      expect(mockDataSources.hitachiPayments.getSupplierPayments).toHaveBeenCalledWith({
        frn: '6561479446', // sfd-id-check: allow
        fromDate: undefined,
        toDate: undefined,
        userIP: '192.168.1.1',
        resourceId: '823456789'
      })
      expect(result).toBeDefined()
    })

    test('should pass date filters to Hitachi datasource', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '823456789',
        businessReference: '6561479446', // sfd-id-check: allow
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      // the Date scalar parses the arguments, so they reach the resolver as Dates
      await Business.payments(
        { sbi: '823456789' },
        {
          fromDate: new Date('2023-01-01'),
          toDate: new Date('2023-12-31'),
          userIP: '192.168.1.1'
        },
        mockContext
      )

      expect(mockDataSources.hitachiPayments.getSupplierPayments).toHaveBeenCalledWith({
        frn: '6561479446', // sfd-id-check: allow
        fromDate: new Date('2023-01-01'),
        toDate: new Date('2023-12-31'),
        userIP: '192.168.1.1',
        resourceId: '823456789'
      })
    })

    test('should throw NotFound when FRN is not available', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '823456789',
        businessReference: null, // No FRN available
        name: 'Test Farm'
      }

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)

      await expect(
        Business.payments({ sbi: '823456789' }, { userIP: '192.168.1.1' }, mockContext)
      ).rejects.toThrow('FRN not found for business')
    })

    test('records the resolved FRN as an account and a payment-list entity on the audit trail', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '823456789',
        businessReference: '6561479446', // sfd-id-check: allow
        name: 'Test Farm'
      }
      const auditTrail = {
        recordAccount: vi.fn(),
        recordEntity: vi.fn()
      }
      const info = { path: { key: 'business', typename: 'Query', prev: undefined } }

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      await Business.payments(
        { sbi: '823456789' },
        { userIP: '192.168.1.1' },
        { ...mockContext, auditTrail },
        info
      )

      expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'frn', '6561479446') // sfd-id-check: allow
      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'payment-list',
        action: 'read',
        entityid: '6561479446' // sfd-id-check: allow
      })
    })

    test('still records the payment-list entity on the audit trail when the FRN cannot be found', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '823456789',
        businessReference: null,
        name: 'Test Farm'
      }
      const auditTrail = {
        recordAccount: vi.fn(),
        recordEntity: vi.fn()
      }
      const info = { path: { key: 'business', typename: 'Query', prev: undefined } }

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)

      await expect(
        Business.payments(
          { sbi: '823456789' },
          { userIP: '192.168.1.1' },
          { ...mockContext, auditTrail },
          info
        )
      ).rejects.toThrow('FRN not found for business')

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'payment-list',
        action: 'read',
        entityid: undefined
      })
    })

    test('still records an attempted payment-list entity when the organisation lookup itself fails', async () => {
      const auditTrail = {
        recordAccount: vi.fn(),
        recordEntity: vi.fn()
      }
      const info = { path: { key: 'business', typename: 'Query', prev: undefined } }

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockRejectedValue(
        new Error('upstream failure')
      )

      await expect(
        Business.payments(
          { sbi: '823456789' },
          { userIP: '192.168.1.1' },
          { ...mockContext, auditTrail },
          info
        )
      ).rejects.toThrow('upstream failure')

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'payment-list',
        action: 'read',
        entityid: undefined
      })
    })

    test('should throw NotFound when Hitachi returns Result: false', async () => {
      const mockOrganisation = {
        id: 12345,
        sbi: '823456789',
        businessReference: '6561479446', // sfd-id-check: allow
        name: 'Test Farm'
      }

      const { NotFound } = await import('../../../../app/errors/graphql.js')
      const notFoundError = new NotFound(
        'Hitachi payments: *** FRN does not exist, No data retrieved for this request'
      )

      mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)
      mockDataSources.hitachiPayments.getSupplierPayments.mockRejectedValue(notFoundError)

      await expect(
        Business.payments({ sbi: '823456789' }, { userIP: '192.168.1.1' }, mockContext)
      ).rejects.toThrow(
        'Hitachi payments: *** FRN does not exist, No data retrieved for this request'
      )
    })

    test('uses a cached FRN without calling Rural Payments', async () => {
      mockDataSources.mongoBusiness.getFrnBySbi.mockResolvedValue('6561479446') // sfd-id-check: allow
      mockDataSources.hitachiPayments.getSupplierPayments.mockResolvedValue({})

      await Business.payments({ sbi: '823456789' }, { userIP: '192.168.1.1' }, mockContext)

      expect(mockDataSources.ruralPaymentsBusiness.getOrganisationById).not.toHaveBeenCalled()
      expect(mockDataSources.mongoBusiness.upsertFrnBySbi).not.toHaveBeenCalled()
      expect(mockDataSources.hitachiPayments.getSupplierPayments).toHaveBeenCalledWith(
        expect.objectContaining({ frn: '6561479446' }) // sfd-id-check: allow
      )
    })

    test('refuses an external user whose token does not include the SBI, even if the FRN is cached', async () => {
      const { BadRequest } = await import('../../../../app/errors/graphql.js')
      const defraIdContext = {
        orgId: vi.fn(() => {
          throw new BadRequest('Defra ID token is not valid for the provided SBI')
        })
      }
      mockDataSources.mongoBusiness.getFrnBySbi.mockResolvedValue('6561479446') // sfd-id-check: allow

      await expect(
        Business.payments(
          { sbi: '823456789' },
          { userIP: '192.168.1.1' },
          { ...mockContext, defraIdContext }
        )
      ).rejects.toThrow(BadRequest)

      expect(mockDataSources.mongoBusiness.getFrnBySbi).not.toHaveBeenCalled()
      expect(mockDataSources.hitachiPayments.getSupplierPayments).not.toHaveBeenCalled()
    })
  })
})
