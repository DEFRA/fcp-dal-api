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
  vat: '123456789',
  legalStatusCode: 102111,
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
          vat: '123456789',
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
          legalStatus: { code: 102111, type: 'Set from reference data' },
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

describe('Business Mutations - reactivate a business', () => {
  // note: sbi 920000001 is reserved for this test; it starts out locked and deactivated in the mock
  const reactivateSbi = '920000001'

  const reactivateBusinessMutation = gql`
    mutation updateBusinessReactivate($input: UpdateBusinessReactivateInput!) {
      updateBusinessReactivate(input: $input) {
        success
      }
    }
  `
  const businessStatusQuery = gql`
    query BusinessStatus($sbi: ID!) {
      business(sbi: $sbi) {
        info {
          status {
            locked
            deactivated
          }
        }
      }
    }
  `

  it('should reactivate the business', async () => {
    // arrange
    const client = new GraphQLClient(targetURL)
    const before = await client.request(businessStatusQuery, { sbi: reactivateSbi }, headers)
    expect(before.business.info.status).toEqual({ locked: true, deactivated: true })

    // act
    const result = await client.request(
      reactivateBusinessMutation,
      { input: { sbi: reactivateSbi, reason: 'Business Structure Changes', note: 'Reopened' } },
      headers
    )

    // assert
    expect(result.updateBusinessReactivate).toEqual({ success: true })
    const after = await client.request(businessStatusQuery, { sbi: reactivateSbi }, headers)
    expect(after.business.info.status.deactivated).toBe(false)
  })
})

const updateBusinessNameMutation = gql`
  mutation UpdateBusinessName($input: UpdateBusinessNameInput!) {
    updateBusinessName(input: $input) {
      success
      business {
        sbi
        info {
          name
        }
      }
    }
  }
`

const updateBusinessEmailMutation = gql`
  mutation UpdateBusinessEmail($input: UpdateBusinessEmailInput!) {
    updateBusinessEmail(input: $input) {
      success
      business {
        sbi
        info {
          email {
            address
          }
          correspondenceEmail {
            address
          }
        }
      }
    }
  }
`

const updateBusinessPhoneMutation = gql`
  mutation UpdateBusinessPhone($input: UpdateBusinessPhoneInput!) {
    updateBusinessPhone(input: $input) {
      success
      business {
        sbi
        info {
          phone {
            mobile
            landline
          }
          correspondencePhone {
            mobile
            landline
          }
        }
      }
    }
  }
`

const updateBusinessAddressMutation = gql`
  mutation UpdateBusinessAddress($input: UpdateBusinessAddressInput!) {
    updateBusinessAddress(input: $input) {
      success
      business {
        sbi
        info {
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
          }
          correspondenceAddress {
            line1
            city
            postalCode
            country
          }
          isCorrespondenceAsBusinessAddress
        }
      }
    }
  }
`

const updateBusinessVATMutation = gql`
  mutation UpdateBusinessVAT($input: UpdateBusinessVATInput!) {
    updateBusinessVAT(input: $input) {
      success
      business {
        sbi
        info {
          vat
        }
      }
    }
  }
`

describe('Business Mutations - individual field updates', () => {
  it('updateBusinessName updates the business name', async () => {
    const response = await client.request(
      updateBusinessNameMutation,
      { input: { sbi, name: 'acceptance-updated-name' } },
      headers
    )

    expect(response.updateBusinessName).toEqual({
      success: true,
      business: { sbi, info: { name: 'acceptance-updated-name' } }
    })
  })

  it('updateBusinessEmail updates the business and correspondence emails', async () => {
    const email = { address: 'acceptance-updated@example.com' }
    const correspondenceEmail = { address: 'acceptance-updated-corr@example.com' }
    const response = await client.request(
      updateBusinessEmailMutation,
      { input: { sbi, email, correspondenceEmail } },
      headers
    )

    expect(response.updateBusinessEmail).toEqual({
      success: true,
      business: { sbi, info: { email, correspondenceEmail } }
    })
  })

  it('updateBusinessPhone updates the business and correspondence phones', async () => {
    const phone = { landline: '01234 567896', mobile: '07700 900006' }
    const correspondencePhone = { landline: '01234 567897', mobile: '07700 900007' }
    const response = await client.request(
      updateBusinessPhoneMutation,
      { input: { sbi, phone, correspondencePhone } },
      headers
    )

    expect(response.updateBusinessPhone).toEqual({
      success: true,
      business: { sbi, info: { phone, correspondencePhone } }
    })
  })

  it('updateBusinessAddress updates the business and correspondence addresses', async () => {
    const updatedAddress = { ...address, line1: 'acceptance-updated-line1', uprn: '100023336956' }
    const updatedCorrespondenceAddress = {
      ...correspondenceAddress,
      line1: 'acceptance-updated-corr-line1'
    }
    const response = await client.request(
      updateBusinessAddressMutation,
      {
        input: {
          sbi,
          address: { withUprn: updatedAddress },
          correspondenceAddress: { withoutUprn: updatedCorrespondenceAddress },
          isCorrespondenceAsBusinessAddress: false
        }
      },
      headers
    )

    expect(response.updateBusinessAddress).toEqual({
      success: true,
      business: {
        sbi,
        info: {
          address: updatedAddress,
          correspondenceAddress: updatedCorrespondenceAddress,
          isCorrespondenceAsBusinessAddress: false
        }
      }
    })
  })

  it('updateBusinessVAT updates the business VAT number', async () => {
    const response = await client.request(
      updateBusinessVATMutation,
      { input: { sbi, vat: '555555555' } },
      headers
    )

    expect(response.updateBusinessVAT).toEqual({
      success: true,
      business: { sbi, info: { vat: '555555555' } }
    })
  })
})

const createBusinessMutation = gql`
  mutation CreateBusiness($input: CreateBusinessInput!) {
    createBusiness(input: $input) {
      success
      business {
        sbi
        organisationId
        info {
          name
          vat
          email {
            address
          }
          phone {
            mobile
            landline
          }
          address {
            line1
            city
            postalCode
            country
            uprn
          }
          correspondenceAddress {
            line1
            city
            postalCode
            country
          }
          legalStatus {
            code
          }
          type {
            code
          }
        }
      }
    }
  }
`

// NOTE: creating a business links it to the person, so use the CRN reserved for
// mutation tests; other suites assert the original businesses for CRN 1111111100!
const createBusinessInput = {
  crn: '9000000000',
  name: 'acceptance-created-business',
  vat: '987654321',
  email: { address: 'acceptance-created-business@example.com' },
  correspondenceEmail: { address: 'acceptance-created-business-corr@example.com' },
  phone: { landline: '01234 567894', mobile: '07700 900004' },
  correspondencePhone: { landline: '01234 567895', mobile: '07700 900005' },
  address: { withUprn: address },
  correspondenceAddress: { withoutUprn: correspondenceAddress },
  isCorrespondenceAsBusinessAddress: false,
  legalStatusCode: 102111,
  typeCode: 3,
  registrationNumbers: {
    companiesHouse: '87654321',
    charityCommission: '12345678'
  },
  landConfirmed: true,
  dateStartedFarming: '2021-05-27'
}

describe('createBusiness', () => {
  it('creates a business for the given person', async () => {
    const response = await client.request(
      createBusinessMutation,
      { input: createBusinessInput },
      headers
    )

    expect(response.createBusiness.success).toBe(true)
    expect(response.createBusiness.business.sbi).toEqual(expect.any(String))
    expect(response.createBusiness.business.organisationId).toEqual(expect.any(String))
    expect(response.createBusiness.business.info).toEqual({
      name: 'acceptance-created-business',
      vat: '987654321',
      email: { address: 'acceptance-created-business@example.com' },
      phone: createBusinessInput.phone,
      address: {
        line1: address.line1,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        uprn: address.uprn
      },
      correspondenceAddress,
      legalStatus: { code: 102111 },
      type: { code: 3 }
    })
  })

  it('rejects a business name longer than 160 characters', async () => {
    await expect(
      client.request(
        createBusinessMutation,
        { input: { ...createBusinessInput, name: 'a'.repeat(161) } },
        headers
      )
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message: "variable 'input.name' must match pattern ^.{0,160}$",
            extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' })
          })
        ]
      }
    })
  })
})
