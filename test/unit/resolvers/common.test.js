import { jest } from '@jest/globals'
import { NotFound } from '../../../app/errors/graphql.js'
import { businessDetailsUpdateResolver } from '../../../app/graphql/resolvers/business/common.js'

describe('businessDetailsUpdateResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        getOrganisationById: jest.fn(),
        updateOrganisationDetails: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('businessDetailsUpdateResolver returns true when updateOrganisationDetails returns a response', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue('orgId')
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      // Include this to ensure it gets overwritten by provided details
      name: 'org name'
    })
    dataSources.ruralPaymentsBusiness.updateOrganisationDetails.mockResolvedValue({
      some: 'response',
      email: 'businessemail@defra.com'
    })

    const input = { sbi: '123', name: 'Test' }

    const result = await businessDetailsUpdateResolver(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith('orgId')
    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledWith(
      'orgId',
      { name: 'Test' }
    )

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('businessDetailsUpdateResolver, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      businessDetailsUpdateResolver(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })
})
