import { describe, jest } from '@jest/globals'
import { transformBusinessDetailsToOrgDetailsCreate } from '../../../../app/transformers/rural-payments/business.js'

const mockBusinessCommonModule = {
  businessDetailsUpdateResolver: jest.fn(),
  businessAdditionalDetailsUpdateResolver: jest.fn(),
  retrieveOrgIdBySbi: jest.fn(),
  businessLockResolver: jest.fn(),
  businessUnlockResolver: jest.fn()
}
const mockCustomerCommonModule = {
  retrievePersonIdByCRN: jest.fn()
}
jest.unstable_mockModule(
  '../../../../app/graphql/resolvers/business/common.js',
  () => mockBusinessCommonModule
)
jest.unstable_mockModule(
  '../../../../app/graphql/resolvers/customer/common.js',
  () => mockCustomerCommonModule
)
const { Mutation, UpdateBusinessResponse } =
  await import('../../../../app/graphql/resolvers/business/mutation.js')

describe('Business Details Mutation resolvers', () => {
  const mockArgs = { input: { name: 'Test Business' } }
  const mockContext = { user: { id: 'user1' } }
  const mockInfo = {}

  it('updateBusinessName calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessName({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessPhone calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessPhone({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessEmail calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessEmail({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessAddress calls businessDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessAddress({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessVAT calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessVAT({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessDetailsUpdateResolver).toHaveBeenCalledWith(
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
    expect(mockBusinessCommonModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessType calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessType({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessDateStartedFarming calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessDateStartedFarming({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
      {},
      mockArgs,
      mockContext,
      mockInfo
    )
  })

  it('updateBusinessRegistrationNumbers calls businessAdditionalDetailsUpdateResolver', async () => {
    await Mutation.updateBusinessRegistrationNumbers({}, mockArgs, mockContext, mockInfo)
    expect(mockBusinessCommonModule.businessAdditionalDetailsUpdateResolver).toHaveBeenCalledWith(
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
    mockBusinessCommonModule.retrieveOrgIdBySbi.mockResolvedValue('123')
    dataSources.ruralPaymentsBusiness.getOrganisationById.mockResolvedValue({
      some: 'response'
    })

    const result = await UpdateBusinessResponse.business(
      { business: { sbi: '123' } },
      {},
      { dataSources }
    )

    expect(mockBusinessCommonModule.retrieveOrgIdBySbi).toHaveBeenCalledWith('123', dataSources)
    expect(result).toEqual({
      land: {
        sbi: '123'
      },
      organisationId: '123',
      sbi: '123',
      payments: {
        sbi: '123'
      }
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
      }
    }
  })

  it('createBusiness returns business details and success', async () => {
    mockCustomerCommonModule.retrievePersonIdByCRN.mockResolvedValue('personId')
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

    expect(mockCustomerCommonModule.retrievePersonIdByCRN).toHaveBeenCalledWith('123', dataSources)
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

describe('Business Mutation createBusinessCustomerBankDetails', () => {
  let dataSources

  const baseInput = {
    sbi: '110405990',
    crn: '1100209492',
    account: {
      ukBusiness: {
        accountHolderName: 'Acme Farms Ltd',
        accountNumber: '14345678',
        bankName: 'Acme Bank',
        sortCode: '123456',
        currency: 'GBP'
      }
    }
  }

  beforeEach(() => {
    mockCustomerCommonModule.retrievePersonIdByCRN.mockReset()
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationBySBI: jest.fn().mockResolvedValue({
          id: 5583781,
          businessReference: '10014489653'
        }),
        getBankChangeLockedStatus: jest.fn().mockResolvedValue({ locked: false }),
        getBankChangeAccountStatus: jest.fn().mockResolvedValue({
          editable: true,
          submitted: false,
          updatedRecently: false,
          new: false
        }),
        validateBankChange: jest.fn().mockResolvedValue({
          status: 'MATCH',
          message: 'All good',
          attemptsRemaining: 0,
          account: { bank: { name: 'Acme Bank', sortCode: '123456' } }
        }),
        submitBankChange: jest.fn().mockResolvedValue({})
      }
    }
    mockCustomerCommonModule.retrievePersonIdByCRN.mockResolvedValue(5020949)
  })

  it('checks locked and account status before validating', async () => {
    await Mutation.createBusinessCustomerBankDetails({}, { input: baseInput }, { dataSources })

    expect(dataSources.ruralPaymentsBusiness.getBankChangeLockedStatus).toHaveBeenCalledWith(
      '5583781',
      '5020949'
    )
    expect(dataSources.ruralPaymentsBusiness.getBankChangeAccountStatus).toHaveBeenCalledWith(
      '5583781'
    )
  })

  it('returns BankDetailsLocked when the locked-status endpoint reports locked', async () => {
    dataSources.ruralPaymentsBusiness.getBankChangeLockedStatus.mockResolvedValue({ locked: true })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(response).toEqual({
      __typename: 'BankDetailsLocked',
      message: 'Bank details are locked for changes'
    })
    expect(dataSources.ruralPaymentsBusiness.getBankChangeAccountStatus).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.validateBankChange).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.submitBankChange).not.toHaveBeenCalled()
  })

  it('returns BankDetailsNotEditable when the account-status endpoint reports not editable', async () => {
    dataSources.ruralPaymentsBusiness.getBankChangeAccountStatus.mockResolvedValue({
      editable: false,
      submitted: true,
      updatedRecently: true,
      new: false
    })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(response).toEqual({
      __typename: 'BankDetailsNotEditable',
      message: 'Bank details are not currently editable',
      submitted: true,
      updatedRecently: true,
      new: false
    })
    expect(dataSources.ruralPaymentsBusiness.validateBankChange).not.toHaveBeenCalled()
    expect(dataSources.ruralPaymentsBusiness.submitBankChange).not.toHaveBeenCalled()
  })

  it('validates then submits the bank change', async () => {
    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(dataSources.ruralPaymentsBusiness.getOrganisationBySBI).toHaveBeenCalledWith('110405990')
    expect(dataSources.ruralPaymentsBusiness.validateBankChange).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: '5583781',
        personId: '5020949',
        sbi: '110405990',
        frn: '10014489653',
        crn: '1100209492'
      })
    )
    expect(dataSources.ruralPaymentsBusiness.submitBankChange).toHaveBeenCalledWith(
      dataSources.ruralPaymentsBusiness.validateBankChange.mock.calls[0][0]
    )
    expect(response).toEqual({ __typename: 'BankDetailsSubmitted', success: true })
  })

  it('submits when validation returns PARTIAL_MATCH', async () => {
    dataSources.ruralPaymentsBusiness.validateBankChange.mockResolvedValue({
      status: 'PARTIAL_MATCH',
      message: 'Some details did not match',
      attemptsRemaining: 0,
      account: { bank: { name: 'Acme Bank' } }
    })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(dataSources.ruralPaymentsBusiness.submitBankChange).toHaveBeenCalled()
    expect(response).toEqual({ __typename: 'BankDetailsSubmitted', success: true })
  })

  it('throws NotFound when the organisation has no FRN', async () => {
    dataSources.ruralPaymentsBusiness.getOrganisationBySBI.mockResolvedValue({
      id: 5583781,
      businessReference: null
    })

    await expect(
      Mutation.createBusinessCustomerBankDetails({}, { input: baseInput }, { dataSources })
    ).rejects.toThrow('FRN not found for business')

    expect(dataSources.ruralPaymentsBusiness.submitBankChange).not.toHaveBeenCalled()
  })

  it('returns BankDetailsValidationFailed ', async () => {
    dataSources.ruralPaymentsBusiness.validateBankChange.mockResolvedValue({
      status: 'FAILED',
      message: "Details don't match",
      attemptsRemaining: 2,
      account: { bank: { sortCode: '123456' } }
    })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(response).toEqual({
      __typename: 'BankDetailsValidationFailed',
      message: "Details don't match",
      attemptsRemaining: 2
    })
    expect(dataSources.ruralPaymentsBusiness.submitBankChange).not.toHaveBeenCalled()
  })

  it('falls back to a default message', async () => {
    dataSources.ruralPaymentsBusiness.validateBankChange.mockResolvedValue({
      status: 'FAILED',
      attemptsRemaining: 1
    })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(response).toEqual({
      __typename: 'BankDetailsValidationFailed',
      message: 'Bank details failed validation',
      attemptsRemaining: 1
    })
  })

  it('returns BankDetailsLocked', async () => {
    dataSources.ruralPaymentsBusiness.validateBankChange.mockResolvedValue({
      status: 'FAILED',
      message: "Details don't match",
      attemptsRemaining: 0,
      account: { bank: { sortCode: '123456' } }
    })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(response).toEqual({
      __typename: 'BankDetailsLocked',
      message: "Details don't match"
    })
    expect(dataSources.ruralPaymentsBusiness.submitBankChange).not.toHaveBeenCalled()
  })

  it('returns BankDetailsLocked with default message when none provided', async () => {
    dataSources.ruralPaymentsBusiness.validateBankChange.mockResolvedValue({
      status: 'FAILED',
      attemptsRemaining: 0
    })

    const response = await Mutation.createBusinessCustomerBankDetails(
      {},
      { input: baseInput },
      { dataSources }
    )

    expect(response).toEqual({
      __typename: 'BankDetailsLocked',
      message: 'Bank details failed validation'
    })
    expect(dataSources.ruralPaymentsBusiness.submitBankChange).not.toHaveBeenCalled()
  })
})

describe('Business Mutation updateBusinessLockStatus', () => {
  const mockArgs = { input: { sbi: '123', reason: 'test' } }

  let dataSources
  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn().mockResolvedValue('123')
      }
    }
  })

  it('updateBusinessLock', async () => {
    await Mutation.updateBusinessLock({}, mockArgs, { dataSources })
    expect(mockBusinessCommonModule.businessLockResolver).toHaveBeenCalledWith({}, mockArgs, {
      dataSources
    })
  })
})

describe('Business Mutation updateBusinessUnlockStatus', () => {
  const mockArgs = { input: { sbi: '123', reason: 'test' } }

  let dataSources
  beforeEach(() => {
    dataSources = {
      ruralPaymentsBusiness: {
        getOrganisationIdBySBI: jest.fn().mockResolvedValue('123')
      }
    }
  })

  it('updateBusinessUnlock', async () => {
    await Mutation.updateBusinessUnlock({}, mockArgs, { dataSources })
    expect(mockBusinessCommonModule.businessUnlockResolver).toHaveBeenCalledWith({}, mockArgs, {
      dataSources
    })
  })
})
