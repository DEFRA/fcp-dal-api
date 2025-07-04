import { checkUndefinedInMapping, transformMapping } from '../../../app/utils/mapping.js'

const orgDetailsUpdateMapping = {
  name: (data) => data.name,
  address: {
    address1: (data) => data.address?.line1,
    address2: (data) => data.address?.line2,
    address3: (data) => data.address?.line3,
    address4: (data) => data.address?.line4,
    address5: (data) => data.address?.line5,
    pafOrganisationName: (data) => data.address?.pafOrganisationName,
    flatName: (data) => data.address?.flatName,
    buildingNumberRange: (data) => data.address?.buildingNumberRange,
    buildingName: (data) => data.address?.buildingName,
    street: (data) => data.address?.street,
    city: (data) => data.address?.city,
    county: (data) => data.address?.county,
    postalCode: (data) => data.address?.postalCode,
    country: (data) => data.address?.country,
    uprn: (data) => data.address?.uprn,
    dependentLocality: (data) => data.address?.dependentLocality,
    doubleDependentLocality: (data) => data.address?.doubleDependentLocality
  },
  correspondenceAddress: (data) => data.correspondenceAddress || null,
  isCorrespondenceAsBusinessAddr: (data) => data.isCorrespondenceAsBusinessAddress,
  email: (data) => data.email?.address,
  landline: (data) => data.phone?.landline,
  mobile: (data) => data.phone?.mobile,
  correspondenceEmail: (data) => data.correspondenceEmail?.address,
  correspondenceLandline: (data) => data.correspondencePhone?.landline,
  correspondenceMobile: (data) => data.correspondencePhone?.mobile,
  businessType: {
    id: () => 0
  }
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
  it('should correctly transform businessDetailsUpdatePayload based on orgDetailsUpdateMapping', () => {
    const result = transformMapping(orgDetailsUpdateMapping, businessDetailsUpdatePayload)

    expect(result.name).toBe('HADLEY FARMS LTD 2')
    expect(result.address.address1).toBe('line1')
    expect(result.address.address5).toBe('line5')
    expect(result.address.pafOrganisationName).toBe('pafOrganisationName')
    expect(result.address.flatName).toBeNull()
    expect(result.address.county).toBeNull()
    expect(result.correspondenceAddress).toEqual(businessDetailsUpdatePayload.correspondenceAddress)
    expect(result.email).toBe('hadleyfarmsltdp@defra.com.test')
    expect(result.landline).toBe('01234613020')
    expect(result.mobile).toBe('01234042273')
    expect(result.businessType.id).toBe(0)
  })
})

describe('checkUndefinedInMapping', () => {
  it('should return false when no mapped values are undefined (nulls are OK)', () => {
    const result = checkUndefinedInMapping(orgDetailsUpdateMapping, businessDetailsUpdatePayload)
    expect(result).toBe(false)
  })

  it('should return true if any mapped function returns undefined', () => {
    const mappingWithUndefined = {
      name: (data) => data.unknownField,
      nested: {
        valid: (data) => data.name,
        invalid: (data) => data.notFound
      }
    }

    const result = checkUndefinedInMapping(mappingWithUndefined, businessDetailsUpdatePayload)
    expect(result).toBe(true)
  })

  it('should return false if all mapped fields exist even if values are null', () => {
    const mappingWithNulls = {
      flatName: (data) => data.address?.flatName,
      county: (data) => data.address?.county
    }

    const result = checkUndefinedInMapping(mappingWithNulls, businessDetailsUpdatePayload)
    expect(result).toBe(false)
  })
})
