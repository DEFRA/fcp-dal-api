import { jest } from '@jest/globals'
import { NotFound } from '../../../app/errors/graphql.js'
import { Mutation } from '../../../app/graphql/resolvers/business/mutation.js'

describe('Business Mutations', () => {
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

  it('updateBusinessName returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', name: 'Test' }

    const result = await Mutation.updateBusinessName(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessBySBI).toHaveBeenCalledWith('123', input)
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('updateBusinessAddress returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', name: 'Test' }

    const result = await Mutation.updateBusinessAddress(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessBySBI).toHaveBeenCalledWith('123', input)
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('updateBusinessPhone returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', name: 'Test' }

    const result = await Mutation.updateBusinessPhone(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessBySBI).toHaveBeenCalledWith('123', input)
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('updateBusinessEmail returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', name: 'Test' }

    const result = await Mutation.updateBusinessEmail(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessBySBI).toHaveBeenCalledWith('123', input)
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('updateBusinessName, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      Mutation.updateBusinessName(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })

  it('updateBusinessAddress, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      Mutation.updateBusinessAddress(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })

  it('updateBusinessPhone, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      Mutation.updateBusinessPhone(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })

  it('updateBusinessEmail, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      Mutation.updateBusinessEmail(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })
})
