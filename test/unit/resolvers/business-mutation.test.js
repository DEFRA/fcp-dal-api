import { jest } from '@jest/globals'
import { transformBusinessDetailsToOrgDetailsCreate } from '../../../app/transformers/rural-payments/business.js'

const mockSchemaModule = {
  businessDetailsUpdateResolver: jest.fn(),
  businessAdditionalDetailsUpdateResolver: jest.fn()
}
jest.unstable_mockModule(
  '../../../app/graphql/resolvers/business/common.js',
  () => mockSchemaModule
)
const { Mutation, UpdateBusinessResponse } = await import(
  '../../../app/graphql/resolvers/business/mutation.js'
)

describe('Business Details Mutation resolvers', () => {
  const mockArgs = { input: { name: 'Test Business' } }
  const mockContext = { user: { id: 'user1' } }
  const mockInfo = {}

  it('updateBusinessName calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessName({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessPhone calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessPhone({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessEmail calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessEmail({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessAddress calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessAddress({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessVAT calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessVAT({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })
})

describe('Business Additional Details Mutation resolvers', () => {
  const mockArgs = { input: { name: 'Test Business' } }
  const mockContext = { user: { id: 'user1' } }
  const mockInfo = {}

  it('updateBusinessLegalStatus calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessLegalStatus({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessType calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessType({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessDateStartedFarming calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessDateStartedFarming({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessRegistrationNumbers calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessRegistrationNumbers({}, mockArgs, mockContext, mockInfo)
    expect(mockSchemaModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })
})

describe('Business Mutation UpdateBusinessResponse', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        updateBusinessBySBI: jest.fn(),
        getOrganisationById: jest.fn(),
        getOrganisationIdBySBI: jest.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: jest.fn(),
        insertOrgIdBySbi: jest.fn()
      }
    }
  })

  it('updateBusinessName returns true when updateBusinessBySBI returns a response', async () => {
    dataSources.mongoBusiness.getOrgIdBySbi.mockResolvedValue('123')
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      some: 'response'
    })

    const result = await UpdateBusinessResponse.business(
      { business: { sbi: '123' } },
      {},
      { dataSources }
    )

    expect(dataSources.mongoBusiness.getOrgIdBySbi).toHaveBeenCalledWith('123')
    expect(result).toEqual({
      land: {
        sbi: '123'
      },
      organisationId: '123',
      sbi: '123'
    })
  })
})

describe('Business Mutation createBusiness', () => {
  let dataSources

  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        createOrganisationByPersonId: jest.fn()
      },
      ruralPaymentsCustomer: {
        getPersonIdByCRN: jest.fn()
      },
      mongoBusiness: {
        getOrgIdBySbi: jest.fn(),
        insertOrgIdBySbi: jest.fn()
      }
    }
  })

  it('createBusiness returns business details and success', async () => {
    const mockArgs = {
      input: {
        crn: '123',
        name: 'Acme Farms Ltd',
        vat: 'GB123456789',
        traderNumber: 'TR12345',
        vendorNumber: 'VN67890',
        address: {
          withoutUprn: {
            line1: '1 Farm Lane',
            line2: 'Rural Area',
            city: 'Farmville',
            postalCode: 'FV1 2AB',
            country: 'UK'
          }
        },
        correspondenceAddress: {
          withoutUprn: {
            line1: 'PO Box 123',
            city: 'Farmville',
            postalCode: 'FV1 2AB',
            country: 'UK'
          }
        },
        isCorrespondenceAsBusinessAddress: false,
        email: {
          address: 'info@acmefarms.co.uk'
        },
        correspondenceEmail: {
          address: 'correspondence@acmefarms.co.uk'
        },
        phone: {
          landline: '+441234567890',
          mobile: '+441234567891'
        },
        correspondencePhone: {
          landline: '+441234567892'
        },
        legalStatusCode: 1,
        typeCode: 2,
        registrationNumbers: {
          companiesHouse: '12345678',
          charityCommission: '87654321'
        },
        landConfirmed: true,
        hasAdditionalBusinessActivities: false,
        dateStartedFarming: new Date('2021-05-27T12:46:17.305Z')
      }
    }
    const mockInfo = {}
    const { crn: _, ...businessDetails } = mockArgs.input
    const orgDetailsInput = transformBusinessDetailsToOrgDetailsCreate(businessDetails)
    // Some additional values are returned beyoned the input
    const orgDetails = {
      ...orgDetailsInput,
      sbi: 'sbi',
      id: 'orgId'
    }

    dataSources.ruralPaymentsCustomer.getPersonIdByCRN.mockResolvedValue('personId')
    dataSources.ruralPaymentsBusiness.createOrganisationByPersonId.mockResolvedValue(orgDetails)

    const response = await Mutation.createBusiness({}, mockArgs, { dataSources }, mockInfo)

    expect(dataSources.ruralPaymentsCustomer.getPersonIdByCRN).toHaveBeenCalledWith('123')
    expect(dataSources.ruralPaymentsBusiness.createOrganisationByPersonId).toHaveBeenCalledWith(
      'personId',
      orgDetailsInput
    )
    expect(response).toEqual({
      // Response is nearly identical to the input just with undefined in unprovided values and typeCode and legalStatusCode are mapped to return objects
      success: true,
      business: {
        info: {
          name: 'Acme Farms Ltd',
          reference: undefined,
          vat: 'GB123456789',
          traderNumber: 'TR12345',
          vendorNumber: 'VN67890',
          address: {
            line1: '1 Farm Lane',
            line2: 'Rural Area',
            line3: undefined,
            line4: undefined,
            line5: undefined,
            pafOrganisationName: undefined,
            buildingNumberRange: undefined,
            buildingName: undefined,
            flatName: undefined,
            street: undefined,
            city: 'Farmville',
            county: undefined,
            postalCode: 'FV1 2AB',
            country: 'UK',
            uprn: undefined,
            dependentLocality: undefined,
            doubleDependentLocality: undefined,
            typeId: undefined
          },
          correspondenceAddress: {
            line1: 'PO Box 123',
            line2: undefined,
            line3: undefined,
            line4: undefined,
            line5: undefined,
            pafOrganisationName: undefined,
            buildingNumberRange: undefined,
            buildingName: undefined,
            flatName: undefined,
            street: undefined,
            city: 'Farmville',
            county: undefined,
            postalCode: 'FV1 2AB',
            country: 'UK',
            uprn: undefined,
            dependentLocality: undefined,
            doubleDependentLocality: undefined,
            typeId: undefined
          },
          phone: {
            mobile: '+441234567891',
            landline: '+441234567890',
            fax: undefined
          },
          correspondencePhone: {
            mobile: undefined,
            landline: '+441234567892',
            fax: undefined
          },
          email: {
            address: 'info@acmefarms.co.uk',
            validated: undefined
          },
          correspondenceEmail: {
            address: 'correspondence@acmefarms.co.uk',
            validated: false
          },
          legalStatus: {
            code: 1,
            type: undefined
          },
          type: {
            code: 2,
            type: undefined
          },
          registrationNumbers: {
            companiesHouse: '12345678',
            charityCommission: '87654321'
          },
          additionalSbis: [],
          isAccountablePeopleDeclarationCompleted: false,
          dateStartedFarming: new Date('2021-05-27T12:46:17.305Z'),
          lastUpdated: null,
          landConfirmed: true,
          isFinancialToBusinessAddress: false,
          isCorrespondenceAsBusinessAddress: false,
          hasLandInNorthernIreland: false,
          hasLandInScotland: false,
          hasLandInWales: false,
          hasAdditionalBusinessActivities: false,
          additionalBusinessActivities: [],
          status: {
            locked: false,
            deactivated: false,
            confirmed: false
          }
        },
        organisationId: 'orgId',
        sbi: 'sbi'
      }
    })
  })
})
