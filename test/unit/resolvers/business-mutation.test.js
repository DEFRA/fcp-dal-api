import { jest } from '@jest/globals'
import { Mutation } from '../../../app/graphql/resolvers/business/mutation.js'

describe('Mutation.updateBusinessDetails', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        updateBusinessDetailsBySBI: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('returns true when updateBusinessDetailsBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessDetailsBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', details: { name: 'Test' } }

    const result = await Mutation.updateBusinessDetails(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessDetailsBySBI).toHaveBeenCalledWith(
      '123',
      { name: 'Test' }
    )
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
