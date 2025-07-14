import { jest } from '@jest/globals'

const mockSchemaModule = {
  businessDetailsUpdateResolver: jest.fn()
}
jest.unstable_mockModule(
  '../../../app/graphql/resolvers/business/common.js',
  () => mockSchemaModule
)
const { Mutation, UpdateBusinessResponse } = await import(
  '../../../app/graphql/resolvers/business/mutation.js'
)

describe('Business Mutation resolvers', () => {
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
