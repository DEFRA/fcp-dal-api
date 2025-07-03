import { jest } from '@jest/globals'
import { NotFound } from '../../../app/errors/graphql.js'
import { Mutation } from '../../../app/graphql/resolvers/business/mutation.js'
import { DAL_RESOLVERS_BUSINESS_001 } from '../../../app/logger/codes.js'

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

  it('throws NotFound and logs a warning when updateBusinessDetailsBySBI returns null/undefined', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessDetailsBySBI.mockResolvedValue(null)
    const input = { sbi: '456', details: { name: 'Missing' } }

    await expect(
      Mutation.updateBusinessDetails(null, { input }, { dataSources, logger })
    ).rejects.toThrow(NotFound)

    expect(logger.warn).toHaveBeenCalledWith(
      '#graphql - business/query - Business not found for SBI',
      { sbi: '456', code: DAL_RESOLVERS_BUSINESS_001 }
    )
  })
})
