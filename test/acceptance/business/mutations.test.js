import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

// NOTE: SBI 900000001 is reserved for mutation tests; other suites assert the
// original (faker generated) mock data for SBI 111111111, so it must not be
// mutated here!
const sbi = '900000001'

const allFieldsMutation = gql`
  mutation Mutation($allFieldsInput: UpdateBusinessAllFieldsInput!) {
    updateBusinessAllFields(input: $allFieldsInput) {
      success
      businessDetailsUpdated
      additionalBusinessDetailsUpdated
      business {
        sbi
        info {
          name
          vat
          email {
            address
            validated
          }
          correspondenceEmail {
            address
            validated
          }
          phone {
            mobile
            landline
          }
          correspondencePhone {
            mobile
            landline
          }
          address {
            pafOrganisationName
            line1
            line2
            line3
            line4
            line5
            buildingNumberRange
            buildingName
            flatName
            street
            city
            county
            postalCode
            country
            uprn
            dependentLocality
            doubleDependentLocality
            typeId
          }
          correspondenceAddress {
            line1
            city
            postalCode
            country
          }
          isCorrespondenceAsBusinessAddress
          legalStatus {
            code
            type
          }
          type {
            code
            type
          }
          registrationNumbers {
            companiesHouse
            charityCommission
          }
          dateStartedFarming
        }
      }
    }
  }
`

const address = {
  pafOrganisationName: 'acceptance-pafOrganisationName',
  line1: 'acceptance-line1',
  line2: 'acceptance-line2',
  line3: 'acceptance-line3',
  line4: 'acceptance-line4',
  line5: 'acceptance-line5',
  buildingNumberRange: 'acceptance-buildingNumberRange',
  buildingName: 'acceptance-buildingName',
  flatName: 'acceptance-flatName',
  street: 'acceptance-street',
  city: 'acceptance-city',
  county: 'acceptance-county',
  postalCode: 'SW1A 2AA',
  country: 'acceptance-country',
  uprn: '123456789012',
  dependentLocality: 'acceptance-dependentLocality',
  doubleDependentLocality: 'acceptance-doubleDependentLocality'
}
const correspondenceAddress = {
  line1: 'acceptance-corr-line1',
  city: 'acceptance-corr-city',
  postalCode: 'SW1A 2AB',
  country: 'acceptance-corr-country'
}
const allFieldsInput = {
  sbi,
  name: 'acceptance-business-name',
  email: { address: 'acceptance-business@example.com' },
  correspondenceEmail: { address: 'acceptance-business-corr@example.com' },
  phone: { landline: '01234 567892', mobile: '07700 900002' },
  correspondencePhone: { landline: '01234 567893', mobile: '07700 900003' },
  address: { withUprn: address },
  correspondenceAddress: { withoutUprn: correspondenceAddress },
  isCorrespondenceAsBusinessAddress: false,
  vat: 'GB123456789',
  legalStatusCode: 102,
  typeCode: 3,
  dateStartedFarming: '2020-01-31',
  registrationNumbers: {
    companiesHouse: '12345678',
    charityCommission: '87654321'
  }
}

describe('Business Mutations - as an internal user', () => {
  const client = new GraphQLClient(targetURL)

  it('should update ALL the business details in a single request', async () => {
    const response = await client.request(
      allFieldsMutation,
      { allFieldsInput },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.updateBusinessAllFields).toEqual({
      success: true,
      businessDetailsUpdated: true,
      additionalBusinessDetailsUpdated: true,
      business: {
        sbi,
        info: {
          name: 'acceptance-business-name',
          vat: 'GB123456789',
          email: { address: 'acceptance-business@example.com', validated: true },
          correspondenceEmail: {
            address: 'acceptance-business-corr@example.com',
            validated: true
          },
          phone: allFieldsInput.phone,
          correspondencePhone: allFieldsInput.correspondencePhone,
          address: { ...address, typeId: null },
          correspondenceAddress,
          isCorrespondenceAsBusinessAddress: false,
          legalStatus: { code: 102, type: 'Set from reference data' },
          type: { code: 3, type: 'Set from reference data' },
          registrationNumbers: {
            companiesHouse: '12345678',
            charityCommission: '87654321'
          },
          dateStartedFarming: '2020-01-31T00:00:00.000Z'
        }
      }
    })
  })

  it('should skip the additional business details update when only business details are provided', async () => {
    const response = await client.request(
      allFieldsMutation,
      { allFieldsInput: { sbi, name: 'acceptance-business-name-partial' } },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.updateBusinessAllFields.success).toBe(true)
    expect(response.updateBusinessAllFields.businessDetailsUpdated).toBe(true)
    expect(response.updateBusinessAllFields.additionalBusinessDetailsUpdated).toBeNull()
    expect(response.updateBusinessAllFields.business.info.name).toBe(
      'acceptance-business-name-partial'
    )
  })
})

const validateMutation = gql`
  mutation ValidateBusinessCustomerBankDetails($input: ValidateBusinessCustomerBankDetailsInput!) {
    validateBusinessCustomerBankDetails(input: $input) {
      __typename
      ... on BankDetailsMatched {
        message
      }
      ... on BankDetailsPartialMatch {
        message
      }
      ... on BankDetailsValidationFailed {
        message
        attemptsRemaining
      }
      ... on BankDetailsLocked {
        message
      }
      ... on BankDetailsNotEditable {
        message
        submitted
        updatedRecently
        new
      }
    }
  }
`

const submitMutation = gql`
  mutation CreateBusinessCustomerBankDetails($input: CreateBusinessCustomerBankDetailsInput!) {
    createBusinessCustomerBankDetails(input: $input) {
      __typename
      ... on BankDetailsSubmitted {
        success
      }
      ... on BankDetailsValidationFailed {
        message
        attemptsRemaining
      }
      ... on BankDetailsLocked {
        message
      }
      ... on BankDetailsNotEditable {
        message
        submitted
        updatedRecently
        new
      }
    }
  }
`

const accountForNumber = (accountNumber, sortCode, bankName) => ({
  ukBusiness: {
    accountHolderName: 'Acceptance Farms Ltd',
    accountNumber,
    bankName,
    sortCode,
    currency: 'GBP'
  }
})

const matchAccount = accountForNumber('11111100', '111111', 'Match Bank')
const partialMatchAccount = accountForNumber('22222200', '222222', 'Partial Match Bank')
const noMatchAccount = accountForNumber('33333300', '333333', 'No Match Bank')

const client = new GraphQLClient(targetURL)
const headers = { email: 'some-email' }

describe('validateBusinessCustomerBankDetails', () => {
  it('returns BankDetailsMatched when the details fully match', async () => {
    const response = await client.request(
      validateMutation,
      { input: { sbi: '111111111', crn: '1111111100', account: matchAccount } },
      headers
    )

    expect(response.validateBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsMatched',
      message: 'All good'
    })
  })

  it('returns BankDetailsPartialMatch when the details partially match', async () => {
    const response = await client.request(
      validateMutation,
      { input: { sbi: '111111111', crn: '1111111100', account: partialMatchAccount } },
      headers
    )

    expect(response.validateBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsPartialMatch',
      message: 'Some details did not match — please confirm'
    })
  })

  it('returns BankDetailsValidationFailed when the details do not match', async () => {
    const response = await client.request(
      validateMutation,
      { input: { sbi: '111111111', crn: '1111111100', account: noMatchAccount } },
      headers
    )

    expect(response.validateBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsValidationFailed',
      message: "Details don't match",
      attemptsRemaining: 2
    })
  })

  it('returns BankDetailsLocked when the person is locked for bank changes', async () => {
    // person 11111119 (CRN 1111111900) is locked for org 111111111 in the mock
    const response = await client.request(
      validateMutation,
      { input: { sbi: '111111111', crn: '1111111900', account: matchAccount } },
      headers
    )

    expect(response.validateBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsLocked',
      message: 'Bank details are locked for changes'
    })
  })

  it('returns BankDetailsNotEditable when the bank details cannot currently be changed', async () => {
    // org 222222222 has bankAccountStatus submitted+updatedRecently in the mock
    const response = await client.request(
      validateMutation,
      { input: { sbi: '222222222', crn: '2222222000', account: matchAccount } },
      headers
    )

    expect(response.validateBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsNotEditable',
      message: 'Bank details are not currently editable',
      submitted: true,
      updatedRecently: true,
      new: false
    })
  })
})

describe('createBusinessCustomerBankDetails', () => {
  it('submits the bank change when the details fully match', async () => {
    const response = await client.request(
      submitMutation,
      { input: { sbi: '111111111', crn: '1111111100', account: matchAccount } },
      headers
    )

    expect(response.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsSubmitted',
      success: true
    })
  })

  it('submits the bank change when the details partially match', async () => {
    const response = await client.request(
      submitMutation,
      { input: { sbi: '111111111', crn: '1111111100', account: partialMatchAccount } },
      headers
    )

    expect(response.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsSubmitted',
      success: true
    })
  })
})
