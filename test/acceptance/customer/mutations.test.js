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
const inputs = {
  addressInput: {
    crn: '9000000000',
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
    crn: '9000000000',
    dateOfBirth: '2000-02-29' // must be a valid date string
  },
  doNotContactInput: {
    crn: '9000000000',
    doNotContact: true // must be boolean
  },
  emailInput: {
    crn: '9000000000',
    email: {
      address: 'acceptance-email-address'
    }
  },
  nameInput: {
    crn: '9000000000',
    ...nameInput
  },
  phoneInput: {
    crn: '9000000000',
    phone: {
      landline: 'acceptance-landline',
      mobile: 'acceptance-mobile'
    }
  }
}

describe('Customer Mutations', () => {
  it('should update the customer details', async () => {
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

  it('should update the customer details', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '9000000001',
        relationships: []
      },
      'test-secret'
    )
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      mutation,
      { ...inputs, crn: 9000000001 },
      {
        'x-forwarded-authorization': tokenValue,
        'gateway-type': 'external'
      }
    )

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
})
