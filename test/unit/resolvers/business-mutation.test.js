import { jest } from '@jest/globals'
import { Mutation } from '../../../app/graphql/resolvers/business/mutation.js'

describe('Mutation.updateBusiness', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        updateBusinessBySBI: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', details: { name: 'Test' } }

    const result = await Mutation.updateBusiness(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessBySBI).toHaveBeenCalledWith('123', {
      name: 'Test'
    })
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
