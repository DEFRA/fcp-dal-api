import { expect } from '@jest/globals'
import { dalAddressToKitsAddress } from '../../../app/transformers/common.js'
import { transformMapping } from '../../../app/utils/mapping.js'

const orgDetailsUpdateMapping = {
  name: (data) => data.name,
  address: (data) => (data.address ? dalAddressToKitsAddress(data.address) : undefined),
  correspondenceAddress: (data) =>
    data.correspondenceAddress ? dalAddressToKitsAddress(data.correspondenceAddress) : undefined,
  isCorrespondenceAsBusinessAddr: (data) => data.isCorrespondenceAsBusinessAddress,
  email: (data) => data.email?.address,
  landline: (data) => data.phone?.landline,
  mobile: (data) => data.phone?.mobile,
  correspondenceEmail: (data) => data.correspondenceEmail?.address,
  correspondenceLandline: (data) => data.correspondencePhone?.landline,
  correspondenceMobile: (data) => data.correspondencePhone?.mobile
}

const businessDetailsUpdatePayload = {
  name: 'HADLEY FARMS LTD 2',
  address: {
    pafOrganisationName: 'pafOrganisationName',
    line1: 'line1',
    line2: 'line2',
    line3: 'line3',
    line4: 'line4',
    line5: 'line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
    flatName: null,
    street: 'street',
    city: 'BRAINTREE',
    county: null,
    postalCode: '12312312',
    country: 'United Kingdom',
    uprn: '123123123',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: null
  },
  correspondenceAddress: {
    pafOrganisationName: 'c pafOrganisationName',
    line1: 'c line1',
    line2: 'c line2',
    line3: 'c line3',
    line4: 'c line4',
    line5: 'c line5',
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'buildingName',
    flatName: 'flatName',
    street: 'street',
    city: 'city',
    county: 'county',
    postalCode: '1231231',
    country: 'USA',
    uprn: '10008042952',
    dependentLocality: 'HIGH HAWSKER',
    doubleDependentLocality: 'doubleDependentLocality'
  },
  phone: {
    mobile: '01234042273',
    landline: '01234613020'
  },
  email: {
    address: 'hadleyfarmsltdp@defra.com.test'
  },
  correspondenceEmail: {
    address: 'hadleyfarmsltdp@defra.com.123'
  },
  correspondencePhone: {
    mobile: '07111222333',
    landline: '01225111222'
  },
  isCorrespondenceAsBusinessAddress: false
}

describe('transformMapping', () => {
  test('should correctly transform businessDetailsUpdatePayload based on orgDetailsUpdateMapping', () => {
    const result = transformMapping(orgDetailsUpdateMapping, businessDetailsUpdatePayload)

    expect(result.name).toBe('HADLEY FARMS LTD 2')
    expect(result.address).toEqual(dalAddressToKitsAddress(businessDetailsUpdatePayload.address))
    expect(result.correspondenceAddress).toEqual(
      dalAddressToKitsAddress(businessDetailsUpdatePayload.correspondenceAddress)
    )
    expect(result.email).toBe('hadleyfarmsltdp@defra.com.test')
    expect(result.landline).toBe('01234613020')
    expect(result.mobile).toBe('01234042273')
  })

  test('should only return keys that are not undefined orgDetailsUpdateMapping', () => {
    const result = transformMapping(orgDetailsUpdateMapping, { name: 'keep this' })

    expect(result.name).toBe('keep this')
    expect(result.address).toBeUndefined()
    expect(result.correspondenceAddress).toBeUndefined()
    expect(result.email).toBeUndefined()
    expect(result.landline).toBeUndefined()
    expect(result.mobile).toBeUndefined()
  })

  test('should handle nested object mappings (object values in mapping)', () => {
    const nestedMapping = {
      group: {
        name: (data) => data.name,
        email: (data) => data.email?.address
      },
      phone: {
        mobile: (data) => data.phone?.mobile
      }
    }

    const nestedPayload = {
      name: 'Test Co.',
      email: { address: 'test@example.com' },
      phone: { mobile: '123456789' }
    }
    const result = transformMapping(nestedMapping, nestedPayload)

    expect(result).toEqual({
      group: {
        name: 'Test Co.',
        email: 'test@example.com'
      },
      phone: {
        mobile: '123456789'
      }
    })
  })

  test('should return undefined if incorrect mapping passed', () => {
    // this test is just so sonar qube doesn't complain
    const nestedMapping = ''

    const nestedPayload = {
      name: 'Test Co.',
      email: { address: 'test@example.com' },
      phone: { mobile: '123456789' }
    }
    const result = transformMapping(nestedMapping, nestedPayload)

    expect(result).toBeUndefined()
  })
})
