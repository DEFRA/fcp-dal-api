import { jest } from '@jest/globals'
import { Query } from '../../../app/graphql/resolvers/business/query.js'

describe('Business Query Resolver', () => {
  let mockDataSources
  let mockLogger
  let mockKitsExternal

  beforeEach(() => {
    mockDataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn(),
        getOrganisationById: jest.fn()
      }
    }
    mockLogger = {
      warn: jest.fn()
    }
    mockKitsExternal = {
      gatewayType: 'external',
      token: 'defra-id-token',
      extractOrgIdFromDefraIdToken: jest.fn()
    }
  })

  it('internal gateway should return transformed business data when found', async () => {
    const sbi = '123456789'
    const mockOrganisation = { id: 1, name: 'Test Farm' }

    mockDataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue(
      mockOrganisation.id
    )
    mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)

    const result = await Query.business(
      null,
      { sbi },
      { dataSources: mockDataSources, logger: mockLogger, kits: { gatewayType: 'internal' } }
    )

    expect(mockDataSources.ruralPaymentsBusiness.getOrganisationIdBySBI).toHaveBeenCalledWith(sbi)
    expect(mockDataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
      mockOrganisation.id
    )
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

  it('external gatewayshould return transformed business data when found', async () => {
    const sbi = '123456789'
    const mockOrganisation = { id: 1, name: 'Test Farm' }

    mockDataSources.ruralPaymentsBusiness.getOrganisationIdBySBI.mockResolvedValue(
      mockOrganisation.id
    )
    mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue(mockOrganisation)
    mockKitsExternal.extractOrgIdFromDefraIdToken.mockReturnValue(mockOrganisation.id)

    const result = await Query.business(
      null,
      { sbi },
      {
        dataSources: mockDataSources,
        logger: mockLogger,
        kits: mockKitsExternal
      }
    )

    expect(mockKitsExternal.extractOrgIdFromDefraIdToken).toHaveBeenCalledWith(sbi)
    expect(mockDataSources.ruralPaymentsBusiness.getOrganisationById).toHaveBeenCalledWith(
      mockOrganisation.id
    )
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
  it('should handle errors from dataSource for internal gateway', async () => {
    const sbi = '123456789'
    const error = new Error('Database error')
    mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue('orgId')
    mockDataSources.ruralPaymentsBusiness.getOrganisationById.mockRejectedValue(error)

    await expect(
      Query.business(
        null,
        { sbi },
        { dataSources: mockDataSources, logger: mockLogger, kits: { gatewayType: 'internal' } }
      )
    ).rejects.toThrow(error)
  })
})
