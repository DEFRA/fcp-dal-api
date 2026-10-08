import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const mutation = gql`
  mutation Mutation(
    $addressInput: UpdateCustomerAddressInput!
    $dateOfBirthInput: UpdateCustomerDateOfBirthInput!
    $doNotContactInput: UpdateCustomerDoNotContactInput!
    $emailInput: UpdateCustomerEmailInput!
    $nameInput: UpdateCustomerNameInput!
    $phoneInput: UpdateCustomerPhoneInput!
  ) {
    updateCustomerAddress(input: $addressInput) {
      success
    }
    updateCustomerDateOfBirth(input: $dateOfBirthInput) {
      success
    }
    updateCustomerDoNotContact(input: $doNotContactInput) {
      success
    }
    updateCustomerEmail(input: $emailInput) {
      success
    }
    updateCustomerName(input: $nameInput) {
      success
    }
    updateCustomerPhone(input: $phoneInput) {
      success
      customer {
        # crn // TODO: work out why CRN always seems to come back as null!!
        personId
        info {
          name {
            title
            otherTitle
            first
            middle
            last
          }
          dateOfBirth
          phone {
            mobile
            landline
          }
          email {
            address
            validated
          }
          status {
            locked
            confirmed
            deactivated
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
          doNotContact
          personalIdentifiers
        }
      }
    }
  }
`
const nameInput = {
  title: 'acceptance-title',
  otherTitle: 'acceptance-otherTitle',
  first: 'acceptance-first',
  middle: 'acceptance-middle',
  last: 'acceptance-last'
}
const generateInputsForCRN = (crn) => ({
  addressInput: {
    crn,
    address: {
      buildingName: 'acceptance-buildingName',
      buildingNumberRange: 'acceptance-buildingNumberRange',
      city: 'acceptance-city',
      country: 'acceptance-country',
      county: 'acceptance-county',
      dependentLocality: 'acceptance-dependentLocality',
      doubleDependentLocality: 'acceptance-doubleDependentLocality',
      flatName: 'acceptance-flatName',
      line1: 'acceptance-line1',
      line2: 'acceptance-line2',
      line3: 'acceptance-line3',
      line4: 'acceptance-line4',
      line5: 'acceptance-line5',
      pafOrganisationName: 'acceptance-pafOrganisationName',
      postalCode: 'SW1A 2AA',
      street: 'acceptance-street',
      uprn: '123456789012'
    }
  },
  dateOfBirthInput: {
    crn,
    dateOfBirth: '2000-02-29' // must be a valid date string
  },
  doNotContactInput: {
    crn,
    doNotContact: true // must be boolean
  },
  emailInput: {
    crn,
    email: {
      address: 'acceptance@example.com'
    }
  },
  nameInput: {
    crn,
    ...nameInput
  },
  phoneInput: {
    crn,
    phone: {
      landline: '01234 567890',
      mobile: '07700 900000'
    }
  }
})

const fullMutation = gql`
  mutation Mutation($allFieldsInput: UpdateCustomerAllFieldsInput!) {
    updateCustomerAllFields(input: $allFieldsInput) {
      success
      customer {
        # crn // TODO: work out why CRN always seems to come back as null!!
        personId
        info {
          name {
            title
            otherTitle
            first
            middle
            last
          }
          dateOfBirth
          phone {
            mobile
            landline
          }
          email {
            address
            validated
          }
          status {
            locked
            confirmed
            deactivated
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
          doNotContact
          personalIdentifiers
        }
      }
    }
  }
`
const nameFullInput = {
  title: 'acceptance-title-xxx',
  otherTitle: 'acceptance-otherTitle-full',
  first: 'acceptance-first-full',
  middle: 'acceptance-middle-full',
  last: 'acceptance-last-full'
}
const generateFullInputForCRN = (crn) => ({
  allFieldsInput: {
    crn,
    address: {
      buildingName: 'acceptance-buildingName-full',
      buildingNumberRange: 'acceptance-buildingNumberRange-full',
      city: 'acceptance-city-full',
      country: 'acceptance-country-full',
      county: 'acceptance-county-full',
      dependentLocality: 'acceptance-dependentLocality-full',
      doubleDependentLocality: 'acceptance-doubleDependentLocality-full',
      flatName: 'acceptance-flatName-full',
      line1: 'acceptance-line1-full',
      line2: 'acceptance-line2-full',
      line3: 'acceptance-line3-full',
      line4: 'acceptance-line4-full',
      line5: 'acceptance-line5-full',
      pafOrganisationName: 'acceptance-pafOrganisationName-full',
      postalCode: 'SW1A 2AB',
      street: 'acceptance-street-full',
      uprn: '210987654321'
    },
    dateOfBirth: '2000-03-01', // must be a valid date string
    doNotContact: false, // must be boolean
    email: {
      address: 'acceptance-full@example.com'
    },
    ...nameFullInput,
    phone: {
      landline: '01234 567891',
      mobile: '07700 900001'
    }
  }
})

const headers = { email: 'some-email' }

describe('Customer Mutations - as an internal user', () => {
  it('should update the customer details', async () => {
    const inputs = generateInputsForCRN('9000000000')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(mutation, inputs, headers)

    expect(response).not.toHaveProperty('errors')
    expect(response.updateCustomerAddress.success).toBe(true)
    expect(response.updateCustomerDateOfBirth.success).toBe(true)
    expect(response.updateCustomerDoNotContact.success).toBe(true)
    expect(response.updateCustomerEmail.success).toBe(true)
    expect(response.updateCustomerName.success).toBe(true)
    expect(response.updateCustomerPhone.success).toBe(true)
    expect(response.updateCustomerPhone.customer).toEqual({
      // crn: '9000000000', // TODO: work out why CRN always seems to come back as null!!
      personId: '9000000',
      info: {
        name: nameInput,
        dateOfBirth: '2000-02-29',
        phone: inputs.phoneInput.phone,
        email: { ...inputs.emailInput.email, validated: false },
        status: {
          locked: true,
          confirmed: false,
          deactivated: true
        },
        address: { ...inputs.addressInput.address, typeId: null },
        doNotContact: true,
        personalIdentifiers: ['1819421250', '9527746847', '3904800546']
      }
    })
  })

  it('should update all the customer details', async () => {
    const inputs = generateFullInputForCRN('9000000000')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(fullMutation, inputs, headers)

    expect(response).not.toHaveProperty('errors')
    expect(response.updateCustomerAllFields.success).toBe(true)
    expect(response.updateCustomerAllFields.customer).toEqual({
      // crn: '9000000000', // TODO: work out why CRN always seems to come back as null!!
      personId: '9000000',
      info: {
        name: nameFullInput,
        dateOfBirth: '2000-03-01',
        phone: inputs.allFieldsInput.phone,
        email: { ...inputs.allFieldsInput.email, validated: false },
        status: {
          locked: true,
          confirmed: false,
          deactivated: true
        },
        address: { ...inputs.allFieldsInput.address, typeId: null },
        doNotContact: false,
        personalIdentifiers: ['1819421250', '9527746847', '3904800546']
      }
    })
  })
})

describe('Customer Mutations - duplicate email handling', () => {
  const crn = '9000000000'
  const duplicateEmail = 'skeleton@the-closet.net' // known duplicate, see validateCustomerEmail acceptance tests

  const setEmailMutation = gql`
    mutation SetEmail($input: UpdateCustomerEmailInput!) {
      updateCustomerEmail(input: $input) {
        success
      }
    }
  `

  const setAllFieldsEmailMutation = gql`
    mutation SetAllFieldsEmail($input: UpdateCustomerAllFieldsInput!) {
      updateCustomerAllFields(input: $input) {
        success
      }
    }
  `

  const customerEmailQuery = gql`
    query CustomerEmail($crn: ID!) {
      customer(crn: $crn) {
        info {
          email {
            address
          }
        }
      }
    }
  `

  it('should reject updateCustomerEmail when the email address is a known duplicate, leaving the customer unchanged', async () => {
    const client = new GraphQLClient(targetURL)

    const setup = await client.request(
      setEmailMutation,
      { input: { crn, email: { address: 'not-a-duplicate@example.com' } } },
      headers
    )
    expect(setup.updateCustomerEmail).toEqual({ success: true })

    await expect(
      client.request(
        setEmailMutation,
        { input: { crn, email: { address: duplicateEmail } } },
        headers
      )
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message: 'Email address is already in use by another customer',
            extensions: expect.objectContaining({ code: 'EMAIL_ALREADY_REGISTERED' })
          })
        ]
      }
    })

    const check = await client.request(customerEmailQuery, { crn }, headers)
    expect(check.customer.info.email.address).toBe('not-a-duplicate@example.com')
  })

  it('should reject updateCustomerAllFields when the email address is a known duplicate, leaving the customer unchanged', async () => {
    const client = new GraphQLClient(targetURL)

    const setup = await client.request(
      setAllFieldsEmailMutation,
      { input: { crn, email: { address: 'still-not-a-duplicate@example.com' } } },
      headers
    )
    expect(setup.updateCustomerAllFields).toEqual({ success: true })

    await expect(
      client.request(
        setAllFieldsEmailMutation,
        { input: { crn, email: { address: duplicateEmail } } },
        headers
      )
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message: 'Email address is already in use by another customer',
            extensions: expect.objectContaining({ code: 'EMAIL_ALREADY_REGISTERED' })
          })
        ]
      }
    })

    const check = await client.request(customerEmailQuery, { crn }, headers)
    expect(check.customer.info.email.address).toBe('still-not-a-duplicate@example.com')
  })
})

describe('Customer Mutations - as an external user', () => {
  const tokenValue = jwt.sign(
    {
      contactId: '9000000001',
      relationships: []
    },
    'test-secret'
  )

  it('should update the customer details', async () => {
    const inputs = generateInputsForCRN('9000000001')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(mutation, inputs, {
      'x-forwarded-authorization': tokenValue
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.updateCustomerAddress.success).toBe(true)
    expect(response.updateCustomerDateOfBirth.success).toBe(true)
    expect(response.updateCustomerDoNotContact.success).toBe(true)
    expect(response.updateCustomerEmail.success).toBe(true)
    expect(response.updateCustomerName.success).toBe(true)
    expect(response.updateCustomerPhone.success).toBe(true)
    expect(response.updateCustomerPhone.customer).toEqual({
      // crn: '9000000000', // TODO: work out why CRN always seems to come back as null!!
      personId: '9000001',
      info: {
        name: nameInput,
        dateOfBirth: '2000-02-29',
        phone: inputs.phoneInput.phone,
        email: { ...inputs.emailInput.email, validated: false },
        status: {
          locked: false,
          confirmed: false,
          deactivated: false
        },
        address: { ...inputs.addressInput.address, typeId: null },
        doNotContact: true,
        personalIdentifiers: ['8500901592', '1596460156']
      }
    })
  })

  it('should update ALL the customer details', async () => {
    const inputs = generateFullInputForCRN('9000000001')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(fullMutation, inputs, {
      'x-forwarded-authorization': tokenValue
    })

    expect(response).not.toHaveProperty('errors')
    expect(response.updateCustomerAllFields.success).toBe(true)
    expect(response.updateCustomerAllFields.customer).toEqual({
      // crn: '9000000000', // TODO: work out why CRN always seems to come back as null!!
      personId: '9000001',
      info: {
        name: nameFullInput,
        dateOfBirth: '2000-03-01',
        phone: inputs.allFieldsInput.phone,
        email: { ...inputs.allFieldsInput.email, validated: false },
        status: {
          locked: false,
          confirmed: false,
          deactivated: false
        },
        address: { ...inputs.allFieldsInput.address, typeId: null },
        doNotContact: false,
        personalIdentifiers: ['8500901592', '1596460156']
      }
    })
  })
})

describe('Customer Mutations - lock a customer', () => {
  const lockCustomerMutation = gql`
    mutation updateLockCustomer($input: UpdateLockCustomerInput!) {
      updateLockCustomer(input: $input) {
        success
      }
    }
  `

  const customerLockStatusQuery = gql`
    query CustomerLockStatus($crn: ID!) {
      customer(crn: $crn) {
        info {
          status {
            locked
          }
        }
      }
    }
  `
  it('should lock the customer', async () => {
    const client = new GraphQLClient(targetURL)

    const setup = await client.request(
      lockCustomerMutation,
      { input: { crn: '1111111800', reason: 'Customer requested lock' } },
      headers
    )
    expect(setup.updateLockCustomer).toEqual({ success: true })

    const check = await client.request(customerLockStatusQuery, { crn: '1111111800' }, headers)
    expect(check.customer.info.status.locked).toBe(true)
  })
})

describe('Customer Mutations - deactivate a customer', () => {
  // note: crn 1111111901 is reserved for this test; it starts out not deactivated in the mock
  const crn = '1111111901'

  const deactivateCustomerMutation = gql`
    mutation updateDeactivateCustomer($input: UpdateDeactivateCustomerInput!) {
      updateDeactivateCustomer(input: $input) {
        success
      }
    }
  `

  const customerDeactivatedStatusQuery = gql`
    query CustomerDeactivatedStatus($crn: ID!) {
      customer(crn: $crn) {
        info {
          status {
            deactivated
          }
        }
      }
    }
  `

  it('should deactivate the customer', async () => {
    // arrange
    const client = new GraphQLClient(targetURL)
    const before = await client.request(customerDeactivatedStatusQuery, { crn }, headers)
    expect(before.customer.info.status.deactivated).toBe(false)

    // act
    const result = await client.request(
      deactivateCustomerMutation,
      { input: { crn, reason: 'Customer deceased', note: 'Confirmed by next of kin' } },
      headers
    )

    // assert
    expect(result.updateDeactivateCustomer).toEqual({ success: true })
    const after = await client.request(customerDeactivatedStatusQuery, { crn }, headers)
    expect(after.customer.info.status.deactivated).toBe(true)
  })
})
