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
      postalCode: 'acceptance-postalCode',
      street: 'acceptance-street',
      uprn: 'acceptance-uprn'
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
      address: 'acceptance-email-address'
    }
  },
  nameInput: {
    crn,
    ...nameInput
  },
  phoneInput: {
    crn,
    phone: {
      landline: 'acceptance-landline',
      mobile: 'acceptance-mobile'
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
  title: 'acceptance-title-full',
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
      postalCode: 'acceptance-postalCode-full',
      street: 'acceptance-street-full',
      uprn: 'acceptance-uprn-full'
    },
    dateOfBirth: '2000-03-01', // must be a valid date string
    doNotContact: false, // must be boolean
    email: {
      address: 'acceptance-email-address-full'
    },
    ...nameFullInput,
    phone: {
      landline: 'acceptance-landline-full',
      mobile: 'acceptance-mobile-full'
    }
  }
})

describe('Customer Mutations - as an internal user', () => {
  it('should update the customer details', async () => {
    const inputs = generateInputsForCRN('9000000000')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(mutation, inputs, {
      email: 'some-email',
      'gateway-type': 'internal'
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
        personalIdentifiers: []
      }
    })
  })

  it('should update all the customer details', async () => {
    const inputs = generateFullInputForCRN('9000000000')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(fullMutation, inputs, {
      email: 'some-email',
      'gateway-type': 'internal'
    })

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
        personalIdentifiers: []
      }
    })
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
      'x-forwarded-authorization': tokenValue,
      'gateway-type': 'external'
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
          locked: true,
          confirmed: true,
          deactivated: false
        },
        address: { ...inputs.addressInput.address, typeId: null },
        doNotContact: true,
        personalIdentifiers: ['1271974984']
      }
    })
  })

  it('should update ALL the customer details', async () => {
    const inputs = generateFullInputForCRN('9000000001')
    const client = new GraphQLClient(targetURL)
    const response = await client.request(fullMutation, inputs, {
      'x-forwarded-authorization': tokenValue,
      'gateway-type': 'external'
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
          locked: true,
          confirmed: true,
          deactivated: false
        },
        address: { ...inputs.allFieldsInput.address, typeId: null },
        doNotContact: false,
        personalIdentifiers: ['1271974984']
      }
    })
  })
})
