import { expect, jest } from '@jest/globals'
import { NotFound } from '../../../../app/errors/graphql.js'
import {
  businessAdditionalDetailsUpdateResolver,
  businessAllFieldsUpdateResolver,
  businessDetailsUpdateResolver,
  businessLockResolver,
  businessUnlockResolver,
  getRuralPaymentsBusinessDataSource
} from '../../../../app/graphql/resolvers/business/common.js'

describe('businessDetailsUpdateResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        getOrganisationById: jest.fn(),
        updateOrganisationDetails: jest.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: jest.fn(),
        upsertOrgIdBySbi: jest.fn()
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
    expect(dataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.upsertOrgIdBySbi).toHaveBeenCalledWith('123', 'orgId')

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

describe('businessAdditionalDetailsUpdateResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        getOrganisationById: jest.fn(),
        updateOrganisationAdditionalDetails: jest.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: jest.fn(),
        upsertOrgIdBySbi: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('businessAdditionalDetailsUpdateResolver returns true when updateOrganisationDetails returns a response', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue('orgId')
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      // Include this to ensure it gets overwritten by provided details
      dateStartedFarming: '01-01-2024'
    })
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockResolvedValue({
      some: 'response',
      email: 'businessemail@defra.com'
    })

    const input = { sbi: '123', dateStartedFarming: '01-01-2025' }

    const result = await businessAdditionalDetailsUpdateResolver(
      null,
      { input },
      { dataSources, logger }
    )

    expect(dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith('orgId')
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledWith('orgId', { dateStartedFarming: '2025-01-01T00:00:00.000Z' })

    expect(dataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.upsertOrgIdBySbi).toHaveBeenCalledWith('123', 'orgId')

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('businessAdditionalDetailsUpdateResolver, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      businessAdditionalDetailsUpdateResolver(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })
})

describe('businessAllFieldsUpdateResolver', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn().mockResolvedValue('orgId'),
        getOrganisationById: jest.fn().mockResolvedValue({
          name: 'org name',
          legalStatus: { id: 1 }
        }),
        updateOrganisationDetails: jest.fn(),
        updateOrganisationAdditionalDetails: jest.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: jest.fn(),
        upsertOrgIdBySbi: jest.fn()
      }
    }
  })

  it('sends business details and additional details in a single upstream call each', async () => {
    const input = {
      sbi: '123',
      name: 'Test',
      vat: '123456789',
      legalStatusCode: 2,
      dateStartedFarming: '2025-01-01'
    }

    const result = await businessAllFieldsUpdateResolver(null, { input }, { dataSources })

    const expectedPayload = {
      name: 'Test',
      taxRegistrationNumber: '123456789',
      legalStatus: { id: 2 },
      dateStartedFarming: '2025-01-01T00:00:00.000Z'
    }

    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledTimes(1)
    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledTimes(1)
    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledWith(
      'orgId',
      expectedPayload
    )
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledTimes(1)
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledWith('orgId', expectedPayload)

    expect(result).toEqual({
      success: true,
      businessDetailsUpdated: true,
      additionalBusinessDetailsUpdated: true,
      business: { sbi: '123' }
    })
  })

  it('skips the additional details call when no additional details fields are provided', async () => {
    const input = { sbi: '123', name: 'Test' }

    await businessAllFieldsUpdateResolver(null, { input }, { dataSources })

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledWith(
      'orgId',
      { name: 'Test', legalStatus: { id: 1 } }
    )
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).not.toHaveBeenCalled()
  })

  it('skips the business details call when no business details fields are provided', async () => {
    const input = { sbi: '123', typeCode: 3 }

    await businessAllFieldsUpdateResolver(null, { input }, { dataSources })

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).not.toHaveBeenCalled()
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledWith('orgId', {
      name: 'org name',
      legalStatus: { id: 1 },
      businessType: { id: 3 }
    })
  })

  it('makes no upstream update calls when only the sbi is provided', async () => {
    const input = { sbi: '123' }

    const result = await businessAllFieldsUpdateResolver(null, { input }, { dataSources })

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).not.toHaveBeenCalled()
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).not.toHaveBeenCalled()
    expect(result).toEqual({
      success: true,
      businessDetailsUpdated: null,
      additionalBusinessDetailsUpdated: null,
      business: { sbi: '123' }
    })
  })

  it('propagates a NotFound error when the organisation cannot be found', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockRejectedValue(notFoundError)

    const input = { sbi: '999', name: 'Missing' }

    await expect(businessAllFieldsUpdateResolver(null, { input }, { dataSources })).rejects.toThrow(
      notFoundError
    )
  })

  it('propagates the error when the additional details update fails', async () => {
    const upstreamError = new Error('Upstream update failed')
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockRejectedValue(
      upstreamError
    )

    const input = { sbi: '123', name: 'Test', typeCode: 3 }

    await expect(businessAllFieldsUpdateResolver(null, { input }, { dataSources })).rejects.toThrow(
      upstreamError
    )

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledTimes(1)
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledTimes(1)
  })

  it('propagates the error and skips the additional details update when the details update fails', async () => {
    const upstreamError = new Error('Upstream update failed')
    dataSources.ruralPaymentsBusiness.updateOrganisationDetails.mockRejectedValue(upstreamError)

    const input = { sbi: '123', name: 'Test', typeCode: 3 }

    await expect(businessAllFieldsUpdateResolver(null, { input }, { dataSources })).rejects.toThrow(
      upstreamError
    )

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledTimes(1)
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).not.toHaveBeenCalled()
  })
})

describe('businessLockResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        lockOrganisation: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('returns correct response when lockOrganisation is successfully executed', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue('orgId')
    dataSources.ruralPaymentsBusiness.lockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test' }

    const result = await businessLockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.lockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test'
    })
  })

  it('returns correct response when lockOrganisation is successfully executed with note and reason', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue('orgId')
    dataSources.ruralPaymentsBusiness.lockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test', note: 'test' }

    const result = await businessLockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.lockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test',
      note: 'test'
    })
  })

  it('returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockRejectedValue(notFoundError)

    const input = { sbi: '123', reason: 'test' }

    await expect(businessLockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      notFoundError
    )
  })

  it('returns error when neither reason or note are provided', async () => {
    const input = { sbi: '123' }

    await expect(businessLockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      'Reason and/or note are required'
    )
  })
})

describe('getRuralPaymentsBusinessDataSource', () => {
  const standardDataSource = { getAgreementsBySBI: jest.fn() }
  const serviceAccountDataSource = { getAgreementsBySBI: jest.fn() }

  it('returns the standard data source when useServiceAccountForExternal is not provided', () => {
    const dataSources = {
      ruralPaymentsBusiness: standardDataSource,
      serviceAccount: { ruralPaymentsBusiness: serviceAccountDataSource }
    }

    expect(getRuralPaymentsBusinessDataSource({ dataSources })).toBe(standardDataSource)
  })

  it('returns the standard data source when useServiceAccountForExternal is false', () => {
    const dataSources = {
      ruralPaymentsBusiness: standardDataSource,
      serviceAccount: { ruralPaymentsBusiness: serviceAccountDataSource }
    }

    expect(
      getRuralPaymentsBusinessDataSource({
        dataSources,
        useServiceAccountForExternal: false
      })
    ).toBe(standardDataSource)
  })

  it('returns the service-account data source when useServiceAccountForExternal is true and a service-account data source is configured', () => {
    const dataSources = {
      ruralPaymentsBusiness: standardDataSource,
      serviceAccount: { ruralPaymentsBusiness: serviceAccountDataSource }
    }

    expect(
      getRuralPaymentsBusinessDataSource({
        dataSources,
        useServiceAccountForExternal: true
      })
    ).toBe(serviceAccountDataSource)
  })

  it('falls back to the standard data source when useServiceAccountForExternal is true but no service-account data source is configured (e.g. internal requests)', () => {
    const dataSources = {
      ruralPaymentsBusiness: standardDataSource,
      serviceAccount: { ruralPaymentsBusiness: null }
    }

    expect(
      getRuralPaymentsBusinessDataSource({
        dataSources,
        useServiceAccountForExternal: true
      })
    ).toBe(standardDataSource)
  })
})

describe('businessUnlockResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        unlockOrganisation: jest.fn()
      }
    }
    logger = {
      warn: jest.fn()
    }
  })

  it('returns correct response when unlockOrganisation is successfully executed', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue('orgId')
    dataSources.ruralPaymentsBusiness.unlockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test' }

    const result = await businessUnlockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.unlockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test'
    })
  })

  it('returns correct response when unlockOrganisation is successfully executed with note and reason', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue('orgId')
    dataSources.ruralPaymentsBusiness.unlockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test', note: 'test' }

    const result = await businessUnlockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.unlockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test',
      note: 'test'
    })
  })

  it('returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockRejectedValue(notFoundError)

    const input = { sbi: '123', reason: 'test' }

    await expect(businessUnlockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      notFoundError
    )
  })

  it('returns error when neither reason or note are provided', async () => {
    const input = { sbi: '123' }

    await expect(businessUnlockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      'Reason and/or note are required'
    )
  })
})
