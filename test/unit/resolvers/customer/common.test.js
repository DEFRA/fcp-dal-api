import { jest } from '@jest/globals'
import { retrievePersonIdByCRN } from '../../../../app/graphql/resolvers/customer/common.js'

describe('retrievePersonIdByCRN', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      ruralPaymentsCustomer: {
        getPersonIdByCRN: jest.fn(),
        logger: { warn: jest.fn() }
      },
      mongoCustomer: {
        findPersonIdByCRN: jest.fn(),
        insertPersonIdByCRN: jest.fn()
      }
    }
  })

  it('returns personId from Mongo when found', async () => {
    dataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue('mongoPersonId')

    const crn = '1234567890'
    const result = await retrievePersonIdByCRN(crn, dataSources)

    expect(dataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(result).toBe('mongoPersonId')
  })

  it('falls back to return personId from upstream request when not found in Mongo', async () => {
    const crn = '1234567890'
    const personId = 'rpPersonId'
    dataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(undefined)
    dataSources.mongoCustomer.insertPersonIdByCRN.mockResolvedValue(undefined)
    dataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue(personId)

    const result = await retrievePersonIdByCRN(crn, dataSources)

    expect(dataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(dataSources.mongoCustomer.insertPersonIdByCRN).toHaveBeenCalledWith(crn, personId)
    expect(dataSources.ruralPaymentsCustomer.getPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(result).toBe('rpPersonId')
  })

  it('handles MongoDB fetch error by logging and falling back to upstream request', async () => {
    const crn = '1234567890'
    const personId = 'rpPersonId'
    const mongoError = new Error('MongoDB error')
    dataSources.mongoCustomer.findPersonIdByCRN.mockRejectedValue(mongoError)
    dataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue(personId)

    const result = await retrievePersonIdByCRN(crn, dataSources)

    expect(dataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(dataSources.ruralPaymentsCustomer.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Error retrieving personId from MongoDB for CRN: 1234567890'),
      expect.objectContaining({
        crn: crn,
        error: mongoError
      })
    )
    expect(dataSources.ruralPaymentsCustomer.getPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(result).toBe(personId)
  })

  it('logs and returns personId if there is a problem inserting into Mongo', async () => {
    const crn = '1234567890'
    const personId = 'rpPersonId'
    const mongoError = new Error('MongoDB error')
    dataSources.mongoCustomer.findPersonIdByCRN.mockResolvedValue(undefined)
    dataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue(personId)
    dataSources.mongoCustomer.insertPersonIdByCRN.mockRejectedValue(mongoError)

    const result = await retrievePersonIdByCRN(crn, dataSources)

    expect(dataSources.mongoCustomer.findPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(dataSources.mongoCustomer.insertPersonIdByCRN).toHaveBeenCalledWith(crn, personId)
    expect(dataSources.ruralPaymentsCustomer.getPersonIdByCRN).toHaveBeenCalledWith(crn)
    expect(result).toBe(personId)
  })
})
