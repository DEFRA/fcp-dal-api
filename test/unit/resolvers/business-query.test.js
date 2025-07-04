import { jest } from '@jest/globals'
import { NotFound } from '../../../app/errors/graphql.js'
import { Query } from '../../../app/graphql/resolvers/business/query.js'
import { DAL_RESOLVERS_BUSINESS_001 } from '../../../app/logger/codes.js'

describe('Business Query Resolver', () => {
  let mockDataSources
  let mockLogger

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsBusiness: {
        getOrganisationBySBI: jest.fn()
      }
    }
    mockLogger = {
      warn: jest.fn()
    }
  })

  it('should return transformed business data when found', async () => {
    const sbi = '123456789'
    const mockOrganisation = { id: 1, name: 'Test Farm' }

    mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(mockOrganisation)

    const result = await Query.business(
      null,
      { sbi },
      { dataSources: mockDataSources, logger: mockLogger }
    )

    expect(mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI).toHaveBeenCalledWith(sbi)
    expect(result).toEqual({
      sbi: 'undefined',
      land: { sbi: '123456789' },
      info: {
        name: 'Test Farm',
        reference: undefined,
        vat: undefined,
        traderNumber: undefined,
        vendorNumber: undefined,
        additionalBusinessActivities: [],
        additionalSbis: [],
        address: {
          line1: undefined,
          line2: undefined,
          line3: undefined,
          line4: undefined,
          line5: undefined,
          pafOrganisationName: undefined,
          buildingNumberRange: undefined,
          buildingName: undefined,
          flatName: undefined,
          street: undefined,
          city: undefined,
          county: undefined,
          postalCode: undefined,
          country: undefined,
          uprn: undefined,
          dependentLocality: undefined,
          doubleDependentLocality: undefined,
          typeId: undefined
        },
        correspondenceAddress: null,
        correspondencePhone: { mobile: undefined, landline: undefined, fax: undefined },
        phone: { mobile: undefined, landline: undefined, fax: undefined },
        dateStartedFarming: null,
        email: { address: undefined, validated: undefined },
        correspondenceEmail: { address: undefined, validated: false },
        hasAdditionalBusinessActivities: false,
        hasLandInNorthernIreland: false,
        hasLandInScotland: false,
        hasLandInWales: false,
        isAccountablePeopleDeclarationCompleted: false,
        isCorrespondenceAsBusinessAddress: false,
        isFinancialToBusinessAddress: false,
        landConfirmed: false,
        lastUpdated: null,
        legalStatus: { code: undefined, type: undefined },
        type: { code: undefined, type: undefined },
        registrationNumbers: { companiesHouse: undefined, charityCommission: undefined },
        status: {
          locked: false,
          deactivated: false,
          confirmed: false
        }
      },
      organisationId: '1'
    })
  })

  it('should throw NotFound error when business is not found', async () => {
    const sbi = '123456789'
    mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue(null)

    await expect(
      Query.business(null, { sbi }, { dataSources: mockDataSources, logger: mockLogger })
    ).rejects.toThrow(NotFound)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      '#graphql - business/query - Business not found for SBI',
      {
        sbi,
        code: DAL_RESOLVERS_BUSINESS_001
      }
    )
  })

  it('should handle errors from dataSource', async () => {
    const sbi = '123456789'
    const error = new Error('Database error')
    mockDataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockRejectedValue(error)

    await expect(
      Query.business(null, { sbi }, { dataSources: mockDataSources, logger: mockLogger })
    ).rejects.toThrow(error)
  })
})
