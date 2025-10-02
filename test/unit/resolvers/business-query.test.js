import { jest } from '@jest/globals'
import { Query } from '../../../app/graphql/resolvers/business/query.js'

describe('Business Query Resolver', () => {
  let mockDataSources
  let mockLogger

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        getOrganisationById: jest.fn(),
        extractOrgIdFromDefraIdToken: jest.fn()
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
      }
    })
  })
})
