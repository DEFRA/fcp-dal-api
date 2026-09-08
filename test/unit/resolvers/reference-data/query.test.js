import { jest } from '@jest/globals'
import { Query, ReferenceData } from '../../../../app/graphql/resolvers/reference-data/query.js'

describe('Reference Data Query Resolver', () => {
  it('referenceData returns an empty object', () => {
    expect(Query.referenceData()).toEqual({})
  })
})

describe('ReferenceData', () => {
  let mockDataSources

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsReferenceData: {
        getCountryCodes: jest.fn(),
        getReferenceData: jest.fn()
      }
    }
  })

  it('countriesCurrencies returns a code/currency pair for each entry', async () => {
    mockDataSources.ruralPaymentsReferenceData.getCountryCodes.mockResolvedValue({
      countriesCurrency: {
        GB: 'GBP',
        FR: 'EUR'
      }
    })

    const result = await ReferenceData.countriesCurrencies(null, null, {
      dataSources: mockDataSources
    })

    expect(result).toEqual([
      { code: 'GB', currency: 'GBP' },
      { code: 'FR', currency: 'EUR' }
    ])
  })

  it('legalStatuses returns a code/description pair for each entry', async () => {
    mockDataSources.ruralPaymentsReferenceData.getReferenceData.mockResolvedValue({
      _data: [
        { id: 1, type: 'Sole Trader' },
        { id: 2, type: 'Limited Company' }
      ]
    })

    const result = await ReferenceData.legalStatuses(null, null, { dataSources: mockDataSources })

    expect(mockDataSources.ruralPaymentsReferenceData.getReferenceData).toHaveBeenCalledWith(
      'legalstatus'
    )
    expect(result).toEqual([
      { code: 1, description: 'Sole Trader' },
      { code: 2, description: 'Limited Company' }
    ])
  })

  describe('legalStatuses audit trail', () => {
    const info = { path: { key: 'referenceData', typename: 'Query', prev: undefined } }

    beforeEach(() => {
      mockDataSources.ruralPaymentsReferenceData.getReferenceData.mockResolvedValue({ _data: [] })
    })

    it('records a reference-data entity for the business legal statuses', async () => {
      const auditTrail = { recordEntity: jest.fn() }

      await ReferenceData.legalStatuses(
        null,
        null,
        { dataSources: mockDataSources, auditTrail },
        info
      )

      expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
        entity: 'reference-data',
        action: 'read',
        entityid: 'business-legal-statuses'
      })
    })

    it('does not throw when no audit trail is supplied', async () => {
      await ReferenceData.legalStatuses(null, null, { dataSources: mockDataSources }, info)
    })
  })
})
