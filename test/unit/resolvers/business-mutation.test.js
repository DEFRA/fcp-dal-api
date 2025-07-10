import { jest } from '@jest/globals'
import { NotFound } from '../../../app/errors/graphql.js'
import { businessDetailsUpdateResolver } from '../../../app/graphql/resolvers/business/common.js'
import {
  Mutation,
  UpdateBusinessResponse
} from '../../../app/graphql/resolvers/business/mutation.js'

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

  it('businessDetailsUpdateResolver returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', name: 'Test' }

    const result = await businessDetailsUpdateResolver(null, { input }, { dataSources, logger })

    expect(dataSources.ruralPaymentsBusiness.updateBusinessBySBI).toHaveBeenCalledWith('123', input)
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
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

  it('businessDetailsUpdateResolver, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.updateBusinessBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      businessDetailsUpdateResolver(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
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

describe('Business Mutation UpdateBusinessResponse', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        updateBusinessBySBI: jest.fn(),
        getOrganisationBySBI: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('updateBusinessName returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue({
      some: 'response'
    })
    const input = { sbi: '123', name: 'Test' }

    const result = await UpdateBusinessResponse.business(
      { business: { sbi: '123' } },
      {},
      { dataSources, logger }
    )

    expect(dataSources.ruralPaymentsBusiness.getOrganisationBySBI).toHaveBeenCalledWith('123')
    expect(result).toEqual({
      info: {
        additionalBusinessActivities: [],
        additionalSbis: [],
        address: {
          buildingName: undefined,
          buildingNumberRange: undefined,
          city: undefined,
          country: undefined,
          county: undefined,
          dependentLocality: undefined,
          doubleDependentLocality: undefined,
          flatName: undefined,
          line1: undefined,
          line2: undefined,
          line3: undefined,
          line4: undefined,
          line5: undefined,
          pafOrganisationName: undefined,
          postalCode: undefined,
          street: undefined,
          typeId: undefined,
          uprn: undefined
        },
        correspondenceAddress: null,
        correspondenceEmail: {
          address: undefined,
          validated: false
        },
        correspondencePhone: {
          fax: undefined,
          landline: undefined,
          mobile: undefined
        },
        dateStartedFarming: null,
        email: {
          address: undefined,
          validated: undefined
        },
        hasAdditionalBusinessActivities: false,
        hasLandInNorthernIreland: false,
        hasLandInScotland: false,
        hasLandInWales: false,
        isAccountablePeopleDeclarationCompleted: false,
        isCorrespondenceAsBusinessAddress: false,
        isFinancialToBusinessAddress: false,
        landConfirmed: false,
        lastUpdated: null,
        legalStatus: {
          code: undefined,
          type: undefined
        },
        name: undefined,
        phone: {
          fax: undefined,
          landline: undefined,
          mobile: undefined
        },
        reference: undefined,
        registrationNumbers: {
          charityCommission: undefined,
          companiesHouse: undefined
        },
        status: {
          confirmed: false,
          deactivated: false,
          locked: false
        },
        traderNumber: undefined,
        type: {
          code: undefined,
          type: undefined
        },
        vat: undefined,
        vendorNumber: undefined
      },
      land: {
        sbi: '123'
      },
      organisationId: 'undefined',
      sbi: 'undefined'
    })
  })
})
