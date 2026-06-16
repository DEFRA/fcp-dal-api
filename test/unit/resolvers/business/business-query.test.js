import { jest } from '@jest/globals'
import { Query } from '../../../../app/graphql/resolvers/business/query.js'

describe('Business Query Resolver', () => {
  let mockDataSources
  let mockLogger

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        getOrganisationById: jest.fn(),
        extractOrgIdFromDefraIdToken: jest.fn(),
        organisationSearch: jest.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: jest.fn(),
        insertOrgIdBySbi: jest.fn()
      }
    }
  })

  it('internal gateway should return orgId when found', async () => {
    const sbi = '123456789'
    const mockOrganisation = { id: 1, name: 'Test Farm' }

    mockDataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue(mockOrganisation.id)

    const result = await Query.business(
      null,
      { sbi },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(mockDataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith(sbi)
    expect(result).toEqual({
      sbi: '123456789',
      organisationId: 1,
      land: {
        sbi: '123456789'
      },
      payments: {
        sbi: '123456789'
      }
    })
  })

  it('businessSearch should return transformed results and page info', async () => {
    const page = { number: 1, size: 20, totalPages: 1, numberOfElements: 1, totalElements: 1 }
    mockDataSources.ruralPaymentsBusiness.organisationSearch.mockResolvedValue({
      data: [
        {
          id: 123,
          name: 'Test Farm',
          sbi: 123456789,
          additionalSbiIds: [],
          confirmed: true,
          lastUpdatedOn: 1614108764000,
          landConfirmed: true,
          deactivated: false,
          locked: false,
          address: { address1: 'line 1', postalCode: 'AB12 3CD' },
          correspondenceAddress: null,
          isFinancialToBusinessAddr: null,
          isCorrespondenceAsBusinessAddr: false
        }
      ],
      page
    })

    const result = await Query.businessSearch(
      null,
      {
        searchString: 'Test Farm',
        searchType: 'BUSINESS_NAME',
        pagination: { page: 1, perPage: 20 }
      },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(mockDataSources.ruralPaymentsBusiness.organisationSearch).toHaveBeenCalledWith(
      'BUSINESS_NAME',
      'Test Farm',
      { page: 1, perPage: 20 }
    )
    expect(result.pageInfo).toEqual(page)
    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toMatchObject({
      organisationId: '123',
      sbi: '123456789',
      name: 'Test Farm',
      additionalSbis: [],
      correspondenceAddress: null,
      isFinancialToBusinessAddress: false,
      isCorrespondenceAsBusinessAddress: false,
      landConfirmed: true,
      lastUpdated: new Date(1614108764000),
      status: { locked: false, deactivated: false, confirmed: true }
    })
    expect(result.results[0].address).toMatchObject({
      line1: 'line 1',
      postalCode: 'AB12 3CD'
    })
  })
})
