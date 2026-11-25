import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BadRequest, HttpError, NotFound } from '../../../../app/errors/graphql.js'
import {
  businessAdditionalDetailsUpdateResolver,
  businessAllFieldsUpdateResolver,
  businessDeactivateResolver,
  businessDetailsUpdateResolver,
  businessLockResolver,
  businessReactivateResolver,
  businessUnlockResolver,
  getRuralPaymentsBusinessDataSource,
  retrieveFrnBySbi,
  retrieveOrgIdBySbi,
  validatePhoneHasNumber
} from '../../../../app/graphql/resolvers/business/common.js'

describe('retrieveOrgIdBySbi', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn()
      }
    }
  })

  it('returns the cached orgId from mongo without calling upstream, when no defraIdContext is present', async () => {
    dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('cachedOrgId')

    const result = await retrieveOrgIdBySbi('123', { dataSources, defraIdContext: undefined })

    expect(result).toBe('cachedOrgId')
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
  })

  it('falls back to upstream and caches the result in mongo on a cache miss, when no defraIdContext is present', async () => {
    dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue(undefined)
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({
      id: 'upstreamOrgId'
    })

    const result = await retrieveOrgIdBySbi('123', { dataSources, defraIdContext: undefined })

    expect(result).toBe('upstreamOrgId')
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
      orgId: 'upstreamOrgId'
    })
  })

  it('reads the orgId from the Defra ID token, without touching mongo or upstream, when a defraIdContext is present', async () => {
    const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }

    const result = await retrieveOrgIdBySbi('123', { dataSources, defraIdContext })

    expect(result).toBe('orgIdFromToken')
    expect(defraIdContext.orgId).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
  })

  it('propagates the token error without falling back to mongo or upstream when the SBI is not in the Defra ID token', async () => {
    const tokenError = new BadRequest('Defra ID token is not valid for the provided SBI')
    const defraIdContext = {
      orgId: vi.fn(() => {
        throw tokenError
      })
    }

    await expect(retrieveOrgIdBySbi('123', { dataSources, defraIdContext })).rejects.toThrow(
      tokenError
    )
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.mongoBusiness.upsertMappingBySbi).not.toHaveBeenCalled()
  })

  it('does not cache anything when the upstream search fails', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(notFoundError)

    await expect(retrieveOrgIdBySbi('123', { dataSources })).rejects.toThrow(notFoundError)
    expect(dataSources.mongoBusiness.upsertMappingBySbi).not.toHaveBeenCalled()
  })
})

describe('retrieveFrnBySbi', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      mongoBusiness: {
        getFrnBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn(),
        getOrgIdBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        getOrganisationById: vi.fn()
      }
    }
  })

  describe('without a defraIdContext (internal request)', () => {
    it('returns the cached frn without calling upstream', async () => {
      dataSources.mongoBusiness.getFrnBySbi.mockResolvedValue('cachedFrn')

      const result = await retrieveFrnBySbi('123', { dataSources, defraIdContext: undefined })

      expect(result).toBe('cachedFrn')
      expect(dataSources.mongoBusiness.getFrnBySbi).toHaveBeenCalledWith('123')
      expect(dataSources.ruralPaymentsBusiness.getOrganisationById).not.toHaveBeenCalled()
      expect(dataSources.mongoBusiness.upsertMappingBySbi).not.toHaveBeenCalled()
    })

    it('uses the cached orgId to fetch the organisation and caches the frn on a cache miss', async () => {
      dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('cachedOrgId')
      dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
        id: 'cachedOrgId',
        businessReference: 'upstreamFrn'
      })

      const result = await retrieveFrnBySbi('123', { dataSources, defraIdContext: undefined })

      expect(result).toBe('upstreamFrn')
      expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
      expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
        'cachedOrgId'
      )
      expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
        frn: 'upstreamFrn'
      })
    })

    it('looks up and caches the orgId upstream when neither the frn nor the orgId is cached', async () => {
      dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({
        id: 'upstreamOrgId'
      })
      dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
        id: 'upstreamOrgId',
        businessReference: 'upstreamFrn'
      })

      const result = await retrieveFrnBySbi('123', { dataSources, defraIdContext: undefined })

      expect(result).toBe('upstreamFrn')
      expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
      expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
        orgId: 'upstreamOrgId'
      })
      expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
        'upstreamOrgId'
      )
      expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
        frn: 'upstreamFrn'
      })
    })

    it('throws NotFound and caches nothing when the organisation has no frn', async () => {
      dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('cachedOrgId')
      dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({ id: 'cachedOrgId' })

      await expect(
        retrieveFrnBySbi('123', { dataSources, defraIdContext: undefined })
      ).rejects.toThrow(new NotFound('FRN not found for business'))
      expect(dataSources.mongoBusiness.upsertMappingBySbi).not.toHaveBeenCalled()
    })

    it('propagates upstream errors without caching', async () => {
      dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('cachedOrgId')
      dataSources.ruralPaymentsBusiness.getOrganisationById.mockRejectedValue(
        new Error('upstream failure')
      )

      await expect(
        retrieveFrnBySbi('123', { dataSources, defraIdContext: undefined })
      ).rejects.toThrow('upstream failure')
      expect(dataSources.mongoBusiness.upsertMappingBySbi).not.toHaveBeenCalled()
    })
  })

  describe('with a defraIdContext (external request)', () => {
    it('checks the sbi against the token before returning a cached frn', async () => {
      const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }
      dataSources.mongoBusiness.getFrnBySbi.mockResolvedValue('cachedFrn')

      const result = await retrieveFrnBySbi('123', { dataSources, defraIdContext })

      expect(result).toBe('cachedFrn')
      expect(defraIdContext.orgId).toHaveBeenCalledWith('123')
      expect(dataSources.ruralPaymentsBusiness.getOrganisationById).not.toHaveBeenCalled()
    })

    it('throws without reading the cache when the sbi is not in the token', async () => {
      const defraIdContext = {
        orgId: vi.fn(() => {
          throw new BadRequest('Defra ID token is not valid for the provided SBI')
        })
      }
      dataSources.mongoBusiness.getFrnBySbi.mockResolvedValue('someoneElsesFrn')

      await expect(retrieveFrnBySbi('123', { dataSources, defraIdContext })).rejects.toThrow(
        BadRequest
      )
      expect(dataSources.mongoBusiness.getFrnBySbi).not.toHaveBeenCalled()
      expect(dataSources.ruralPaymentsBusiness.getOrganisationById).not.toHaveBeenCalled()
    })

    it('uses the orgId from the token, not mongo or search, on a cache miss', async () => {
      const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }
      dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
        id: 'orgIdFromToken',
        businessReference: 'upstreamFrn'
      })

      const result = await retrieveFrnBySbi('123', { dataSources, defraIdContext })

      expect(result).toBe('upstreamFrn')
      expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
      expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
      expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
        'orgIdFromToken'
      )
      expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
        frn: 'upstreamFrn'
      })
    })
  })
})

describe('validatePhoneHasNumber', () => {
  it.each([
    ['a mobile', { mobile: '07700 900000' }],
    ['a landline', { landline: '01234 567890' }],
    ['a landline and null mobile', { landline: '01234 567890', mobile: null }],
    ['both', { mobile: '07700 900000', landline: '01234 567890' }]
  ])('accepts a phone with %s', (_, phone) => {
    expect(() => validatePhoneHasNumber(phone)).not.toThrow()
  })

  it.each([
    ['undefined', undefined],
    ['empty', {}],
    ['null numbers', { mobile: null, landline: null }],
    ['blank numbers', { mobile: ' ', landline: '' }]
  ])('rejects a phone that is %s', (_, phone) => {
    let error
    try {
      validatePhoneHasNumber(phone)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(BadRequest)
    expect(error.message).toBe('phone must include at least one of mobile or landline')
    expect(error.extensions).toEqual({ code: 'BAD_USER_INPUT', http: { status: 400 } })
  })
})

describe('businessDetailsUpdateResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        getOrganisationById: vi.fn(),
        updateOrganisationDetails: vi.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      }
    }
    logger = {
      warn: vi.fn()
    }
  })

  it('businessDetailsUpdateResolver returns true when updateOrganisationDetails returns a response', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
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

    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith('orgId')
    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledWith(
      'orgId',
      { name: 'Test' }
    )
    expect(dataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
      orgId: 'orgId'
    })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('businessDetailsUpdateResolver, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      businessDetailsUpdateResolver(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })

  it('records the organisationId/sbi accounts and an updated business entity on the audit trail', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({ name: 'org name' })
    dataSources.ruralPaymentsBusiness.updateOrganisationDetails.mockResolvedValue({})

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'updateBusinessName', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123', name: 'Test' }

    await businessDetailsUpdateResolver(null, { input }, { dataSources, auditTrail }, info)

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'updated',
      entityid: '123'
    })
  })

  it('does not throw when no audit trail is supplied', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({ name: 'org name' })
    dataSources.ruralPaymentsBusiness.updateOrganisationDetails.mockResolvedValue({})

    await businessDetailsUpdateResolver(
      null,
      { input: { sbi: '123', name: 'Test' } },
      {
        dataSources
      }
    )
  })

  it('retrieves the organisationId from the Defra ID token when a defraIdContext is present', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({ name: 'org name' })
    dataSources.ruralPaymentsBusiness.updateOrganisationDetails.mockResolvedValue({})

    const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }
    const input = { sbi: '123', name: 'Test' }

    await businessDetailsUpdateResolver(null, { input }, { dataSources, defraIdContext })

    expect(defraIdContext.orgId).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
      'orgIdFromToken'
    )
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
  })
})

describe('businessAdditionalDetailsUpdateResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        getOrganisationById: vi.fn(),
        updateOrganisationAdditionalDetails: vi.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      }
    }
    logger = {
      warn: vi.fn()
    }
  })

  it('businessAdditionalDetailsUpdateResolver returns true when updateOrganisationDetails returns a response', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
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

    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith('orgId')
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledWith('orgId', { dateStartedFarming: '2025-01-01T00:00:00.000Z' })

    expect(dataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
      orgId: 'orgId'
    })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
  })

  it('businessAdditionalDetailsUpdateResolver, returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(notFoundError)
    const input = { sbi: '999', details: { name: 'Missing' } }

    await expect(
      businessAdditionalDetailsUpdateResolver(null, { input }, { dataSources, logger })
    ).rejects.toThrow(notFoundError)
  })

  it('records the organisationId/sbi accounts and an updated business entity on the audit trail', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      dateStartedFarming: '01-01-2024'
    })
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockResolvedValue({})

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = {
      path: { key: 'updateBusinessLegalStatus', typename: 'Mutation', prev: undefined }
    }
    const input = { sbi: '123', dateStartedFarming: '01-01-2025' }

    await businessAdditionalDetailsUpdateResolver(
      null,
      { input },
      { dataSources, auditTrail },
      info
    )

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'updated',
      entityid: '123'
    })
  })

  it('does not throw when no audit trail is supplied', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      dateStartedFarming: '01-01-2024'
    })
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockResolvedValue({})

    await businessAdditionalDetailsUpdateResolver(
      null,
      { input: { sbi: '123', dateStartedFarming: '01-01-2025' } },
      { dataSources }
    )
  })

  it('retrieves the organisationId from the Defra ID token when a defraIdContext is present', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      dateStartedFarming: '01-01-2024'
    })
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockResolvedValue({})

    const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }
    const input = { sbi: '123', dateStartedFarming: '01-01-2025' }

    await businessAdditionalDetailsUpdateResolver(null, { input }, { dataSources, defraIdContext })

    expect(defraIdContext.orgId).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
      'orgIdFromToken'
    )
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
  })
})

describe('businessAllFieldsUpdateResolver', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn().mockResolvedValue({ id: 'orgId' }),
        getOrganisationById: vi.fn().mockResolvedValue({
          name: 'org name',
          legalStatus: { id: 1 }
        }),
        updateOrganisationDetails: vi.fn(),
        updateOrganisationAdditionalDetails: vi.fn()
      },
      ruralPaymentsReferenceData: {
        getReferenceData: vi
          .fn()
          .mockResolvedValue({ _data: [{ id: 2, type: 'Partnership' }, { id: 3 }] })
      },
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      }
    }
  })

  it('sends business details and additional details in a single upstream call each', async () => {
    const input = {
      sbi: '123',
      name: 'Test',
      vat: '123456789', // sfd-id-check: allow
      legalStatusCode: 2,
      dateStartedFarming: '2025-01-01'
    }

    const result = await businessAllFieldsUpdateResolver(null, { input }, { dataSources })

    const expectedPayload = {
      name: 'Test',
      taxRegistrationNumber: '123456789', // sfd-id-check: allow
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
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(notFoundError)

    const input = { sbi: '999', name: 'Missing' }

    await expect(businessAllFieldsUpdateResolver(null, { input }, { dataSources })).rejects.toThrow(
      notFoundError
    )
  })

  it('propagates the error with update statuses in extensions when the additional details update fails', async () => {
    const upstreamError = new HttpError(500)
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockRejectedValue(
      upstreamError
    )

    const input = { sbi: '123', name: 'Test', typeCode: 3 }

    await expect(
      businessAllFieldsUpdateResolver(null, { input }, { dataSources })
    ).rejects.toMatchObject({
      message: 'Internal Server Error',
      extensions: expect.objectContaining({
        businessDetailsUpdated: true,
        additionalBusinessDetailsUpdated: false
      })
    })

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledTimes(1)
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).toHaveBeenCalledTimes(1)
  })

  it('propagates the error and skips the additional details update when the details update fails', async () => {
    const upstreamError = new HttpError(500)
    dataSources.ruralPaymentsBusiness.updateOrganisationDetails.mockRejectedValue(upstreamError)

    const input = { sbi: '123', name: 'Test', typeCode: 3 }

    await expect(
      businessAllFieldsUpdateResolver(null, { input }, { dataSources })
    ).rejects.toMatchObject({
      message: 'Internal Server Error',
      extensions: expect.objectContaining({
        businessDetailsUpdated: false,
        additionalBusinessDetailsUpdated: null
      })
    })

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).toHaveBeenCalledTimes(1)
    expect(
      dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails
    ).not.toHaveBeenCalled()
  })

  it('reports the business details update as not attempted when only the additional details update was requested and it fails', async () => {
    const upstreamError = new HttpError(500)
    dataSources.ruralPaymentsBusiness.updateOrganisationAdditionalDetails.mockRejectedValue(
      upstreamError
    )

    const input = { sbi: '123', typeCode: 3 }

    await expect(
      businessAllFieldsUpdateResolver(null, { input }, { dataSources })
    ).rejects.toMatchObject({
      extensions: expect.objectContaining({
        businessDetailsUpdated: null,
        additionalBusinessDetailsUpdated: false
      })
    })

    expect(dataSources.ruralPaymentsBusiness.updateOrganisationDetails).not.toHaveBeenCalled()
  })

  it('records the organisationId/sbi accounts and an updated business entity on the audit trail', async () => {
    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'updateBusinessAllFields', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123', name: 'Test' }

    await businessAllFieldsUpdateResolver(null, { input }, { dataSources, auditTrail }, info)

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'updated',
      entityid: '123'
    })
  })

  it('does not throw when no audit trail is supplied', async () => {
    const input = { sbi: '123', name: 'Test' }

    await businessAllFieldsUpdateResolver(null, { input }, { dataSources })
  })

  it('retrieves the organisationId from the Defra ID token when a defraIdContext is present', async () => {
    const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }
    const input = { sbi: '123', name: 'Test' }

    await businessAllFieldsUpdateResolver(null, { input }, { dataSources, defraIdContext })

    expect(defraIdContext.orgId).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
      'orgIdFromToken'
    )
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
  })
})

describe('businessLockResolver', () => {
  let dataSources
  let logger

  beforeEach(() => {
    dataSources = {
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        lockOrganisation: vi.fn()
      }
    }
    logger = {
      warn: vi.fn()
    }
  })

  it('returns correct response when lockOrganisation is successfully executed', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.lockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test' }

    const result = await businessLockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.lockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test'
    })
  })

  it('returns correct response when lockOrganisation is successfully executed with note and reason', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.lockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test', note: 'test' }

    const result = await businessLockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.lockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test',
      note: 'test'
    })
  })

  it('returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(notFoundError)

    const input = { sbi: '123', reason: 'test' }

    await expect(businessLockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      notFoundError
    )
  })

  it('returns error when neither reason or note are provided', async () => {
    dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('orgId')
    const input = { sbi: '123' }

    await expect(businessLockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      'Reason and/or note are required'
    )
  })

  it('records the sbi/organisationId accounts and a locked business entity on the audit trail', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.lockOrganisation.mockResolvedValue('true')

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'lockBusiness', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123', reason: 'test' }

    await businessLockResolver(null, { input }, { dataSources, auditTrail }, info)

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'locked',
      entityid: '123'
    })
  })

  it('records the audit trail even when input validation subsequently fails', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'lockBusiness', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123' }

    await expect(
      businessLockResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('Reason and/or note are required')

    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'locked',
      entityid: '123'
    })
    expect(dataSources.ruralPaymentsBusiness.lockOrganisation).not.toHaveBeenCalled()
  })

  it('still records the sbi account and a locked business entity when the organisation lookup itself fails', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(
      new Error('upstream failure')
    )

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'lockBusiness', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123', reason: 'test' }

    await expect(
      businessLockResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('upstream failure')

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).not.toHaveBeenCalledWith(
      info,
      'organisationId',
      expect.anything()
    )
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'locked',
      entityid: '123'
    })
  })

  it('does not throw when no audit trail is supplied', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.lockOrganisation.mockResolvedValue('true')

    await businessLockResolver(null, { input: { sbi: '123', reason: 'test' } }, { dataSources })
  })
})

describe('getRuralPaymentsBusinessDataSource', () => {
  const standardDataSource = { getAgreementsBySBI: vi.fn() }
  const serviceAccountDataSource = { getAgreementsBySBI: vi.fn() }

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
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        unlockOrganisation: vi.fn()
      }
    }
    logger = {
      warn: vi.fn()
    }
  })

  it('returns correct response when unlockOrganisation is successfully executed', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.unlockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test' }

    const result = await businessUnlockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.unlockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test'
    })
  })

  it('returns correct response when unlockOrganisation is successfully executed with note and reason', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.unlockOrganisation.mockResolvedValue('true')

    const input = { sbi: '123', reason: 'test', note: 'test' }

    const result = await businessUnlockResolver(null, { input }, { dataSources, logger })

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.unlockOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test',
      note: 'test'
    })
  })

  it('returns false and logs a warning when updateBusinessBySBI throws a NotFound error', async () => {
    const notFoundError = new NotFound('Rural payments organisation not found')
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(notFoundError)

    const input = { sbi: '123', reason: 'test' }

    await expect(businessUnlockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      notFoundError
    )
  })

  it('returns error when neither reason or note are provided', async () => {
    dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('orgId')
    const input = { sbi: '123' }

    await expect(businessUnlockResolver(null, { input }, { dataSources, logger })).rejects.toThrow(
      'Reason and/or note are required'
    )
  })

  it('records the sbi/organisationId accounts and an unlocked business entity on the audit trail', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.unlockOrganisation.mockResolvedValue('true')

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'unlockBusiness', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123', reason: 'test' }

    await businessUnlockResolver(null, { input }, { dataSources, auditTrail }, info)

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'unlocked',
      entityid: '123'
    })
  })

  it('records the audit trail even when input validation subsequently fails', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'unlockBusiness', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123' }

    await expect(
      businessUnlockResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('Reason and/or note are required')

    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'unlocked',
      entityid: '123'
    })
    expect(dataSources.ruralPaymentsBusiness.unlockOrganisation).not.toHaveBeenCalled()
  })

  it('still records the sbi account and an unlocked business entity when the organisation lookup itself fails', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(
      new Error('upstream failure')
    )

    const auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
    const info = { path: { key: 'unlockBusiness', typename: 'Mutation', prev: undefined } }
    const input = { sbi: '123', reason: 'test' }

    await expect(
      businessUnlockResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('upstream failure')

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).not.toHaveBeenCalledWith(
      info,
      'organisationId',
      expect.anything()
    )
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'unlocked',
      entityid: '123'
    })
  })

  it('does not throw when no audit trail is supplied', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.unlockOrganisation.mockResolvedValue('true')

    await businessUnlockResolver(null, { input: { sbi: '123', reason: 'test' } }, { dataSources })
  })
})

describe('businessReactivateResolver', () => {
  let dataSources
  let auditTrail
  const info = { path: { key: 'reactivateBusiness', typename: 'Mutation', prev: undefined } }

  beforeEach(() => {
    dataSources = {
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        reactivateOrganisation: vi.fn()
      }
    }
    auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
  })

  it('reactivates the organisation with the reason and note', async () => {
    // arrange
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    const input = { sbi: '123', reason: 'test reason', note: 'test note' }

    // act
    const result = await businessReactivateResolver(null, { input }, { dataSources }, info)

    // assert
    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.reactivateOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test reason',
      note: 'test note'
    })
  })

  it('throws when neither reason nor note is provided', async () => {
    // arrange
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    const input = { sbi: '123' }

    // act / assert
    await expect(
      businessReactivateResolver(null, { input }, { dataSources }, info)
    ).rejects.toThrow('Reason and/or note are required')
    expect(dataSources.ruralPaymentsBusiness.reactivateOrganisation).not.toHaveBeenCalled()
  })

  it('records the sbi/organisationId accounts and a reactivated business entity on the audit trail', async () => {
    // arrange
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    const input = { sbi: '123', reason: 'test' }

    // act
    await businessReactivateResolver(null, { input }, { dataSources, auditTrail }, info)

    // assert
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'reactivated',
      entityid: '123'
    })
  })

  it('records the audit trail when the reactivate request fails', async () => {
    // arrange
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.reactivateOrganisation.mockRejectedValue(
      new Error('Business is not deactivated')
    )
    const input = { sbi: '123', reason: 'test' }

    // act / assert
    await expect(
      businessReactivateResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('Business is not deactivated')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'reactivated',
      entityid: '123'
    })
  })

  it('records the sbi account when the organisation lookup fails', async () => {
    // arrange
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(
      new Error('upstream failure')
    )
    const input = { sbi: '123', reason: 'test' }

    // act / assert
    await expect(
      businessReactivateResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('upstream failure')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).not.toHaveBeenCalledWith(
      info,
      'organisationId',
      expect.anything()
    )
    expect(dataSources.ruralPaymentsBusiness.reactivateOrganisation).not.toHaveBeenCalled()
  })
})
describe('businessDeactivateResolver', () => {
  let dataSources
  let auditTrail
  const info = { path: { key: 'deactivateBusiness', typename: 'Mutation', prev: undefined } }

  beforeEach(() => {
    dataSources = {
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        deactivateOrganisation: vi.fn()
      }
    }
    auditTrail = { recordAccount: vi.fn(), recordEntity: vi.fn() }
  })

  it('deactivates the organisation with the reason and note', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    const input = { sbi: '123', reason: 'test reason', note: 'test note' }

    const result = await businessDeactivateResolver(null, { input }, { dataSources }, info)

    expect(result).toEqual({ success: true, business: { sbi: '123' } })
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.deactivateOrganisation).toHaveBeenCalledWith('orgId', {
      reason: 'test reason',
      note: 'test note'
    })
  })

  it('throws when neither reason nor note is provided', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    const input = { sbi: '123' }

    await expect(
      businessDeactivateResolver(null, { input }, { dataSources }, info)
    ).rejects.toThrow('Reason and/or note are required')
    expect(dataSources.ruralPaymentsBusiness.deactivateOrganisation).not.toHaveBeenCalled()
  })

  it('audits sbi and organisationId when request is successful', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    const input = { sbi: '123', reason: 'test' }

    await businessDeactivateResolver(null, { input }, { dataSources, auditTrail }, info)

    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'deactivate',
      entityid: '123'
    })
  })

  it('audits the organisationId when the request fails', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({ id: 'orgId' })
    dataSources.ruralPaymentsBusiness.deactivateOrganisation.mockRejectedValue(
      new Error('Business is not deactivated')
    )
    const input = { sbi: '123', reason: 'test' }

    await expect(
      businessDeactivateResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('Business is not deactivated')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'organisationId', 'orgId')
    expect(auditTrail.recordEntity).toHaveBeenCalledWith(info, {
      entity: 'business',
      action: 'deactivate',
      entityid: '123'
    })
  })

  it('audits sbi when the organisation lookup fails', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockRejectedValue(
      new Error('upstream failure')
    )
    const input = { sbi: '123', reason: 'test' }

    await expect(
      businessDeactivateResolver(null, { input }, { dataSources, auditTrail }, info)
    ).rejects.toThrow('upstream failure')
    expect(auditTrail.recordAccount).toHaveBeenCalledWith(info, 'sbi', '123')
    expect(auditTrail.recordAccount).not.toHaveBeenCalledWith(
      info,
      'organisationId',
      expect.anything()
    )
    expect(dataSources.ruralPaymentsBusiness.deactivateOrganisation).not.toHaveBeenCalled()
  })
})

describe.each([
  { name: 'businessLockResolver', resolver: businessLockResolver, upstream: 'lockOrganisation' },
  {
    name: 'businessUnlockResolver',
    resolver: businessUnlockResolver,
    upstream: 'unlockOrganisation'
  },
  {
    name: 'businessReactivateResolver',
    resolver: businessReactivateResolver,
    upstream: 'reactivateOrganisation'
  },
  {
    name: 'businessDeactivateResolver',
    resolver: businessDeactivateResolver,
    upstream: 'deactivateOrganisation'
  }
])('$name organisation id lookup', ({ resolver, upstream }) => {
  let dataSources
  const input = { sbi: '123', reason: 'test' }

  beforeEach(() => {
    dataSources = {
      mongoBusiness: {
        getOrgIdBySbi: vi.fn(),
        upsertMappingBySbi: vi.fn()
      },
      ruralPaymentsBusiness: {
        organisationSearchBySbi: vi.fn(),
        [upstream]: vi.fn().mockResolvedValue(true)
      }
    }
  })

  it('uses the cached orgId without searching upstream', async () => {
    dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('cachedOrgId')

    await resolver(null, { input }, { dataSources })

    expect(dataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness[upstream]).toHaveBeenCalledWith('cachedOrgId', {
      reason: 'test'
    })
  })

  it('searches upstream and caches the orgId on a cache miss', async () => {
    dataSources.ruralPaymentsBusiness.organisationSearchBySbi.mockResolvedValue({
      id: 'upstreamOrgId'
    })

    await resolver(null, { input }, { dataSources })

    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.upsertMappingBySbi).toHaveBeenCalledWith('123', {
      orgId: 'upstreamOrgId'
    })
    expect(dataSources.ruralPaymentsBusiness[upstream]).toHaveBeenCalledWith('upstreamOrgId', {
      reason: 'test'
    })
  })

  it('uses the orgId from the Defra ID token without touching mongo, when a defraIdContext is present', async () => {
    const defraIdContext = { orgId: vi.fn().mockReturnValue('orgIdFromToken') }

    await resolver(null, { input }, { dataSources, defraIdContext })

    expect(defraIdContext.orgId).toHaveBeenCalledWith('123')
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness[upstream]).toHaveBeenCalledWith('orgIdFromToken', {
      reason: 'test'
    })
  })

  it("does not call upstream when the SBI is not in the caller's Defra ID token", async () => {
    const defraIdContext = {
      orgId: vi.fn(() => {
        throw new BadRequest('Defra ID token is not valid for the provided SBI')
      })
    }

    await expect(resolver(null, { input }, { dataSources, defraIdContext })).rejects.toThrow(
      'Defra ID token is not valid for the provided SBI'
    )
    expect(dataSources.mongoBusiness.getOrgIdBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.organisationSearchBySbi).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness[upstream]).not.toHaveBeenCalled()
  })
})
