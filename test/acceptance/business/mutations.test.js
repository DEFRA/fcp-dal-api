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
