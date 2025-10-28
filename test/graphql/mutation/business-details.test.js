import jwt from 'jsonwebtoken'
import nock from 'nock'
import { config } from '../../../app/config.js'
import { mockOrganisationSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))
const v1_external = nock(config.get('kits.external.gatewayUrl'))

const orgDetailsUpdatePayload = {
  id: 'organisationId',
  name: 'HADLEY FARMS LTD 2',
  address: {
    address1: 'line1',
    address2: 'line2',
    address3: 'line3',
    address4: 'line4',
    address5: 'line5',
    pafOrganisationName: 'pafOrganisationName',
    flatName: null,
    buildingNumberRange: 'buildingNumberRange',
    buildingName: 'COLSHAW HALL',
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
    address1: 'c line1',
    address2: 'c line2',
    address3: 'c line3',
    address4: 'c line4',
    address5: 'c line5',
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
  isCorrespondenceAsBusinessAddr: false,
  email: 'hadleyfarmsltdp@defra.com.test',
  landline: '01234613020',
  mobile: '01234042273',
  correspondenceEmail: 'hadleyfarmsltdp@defra.com.123',
  correspondenceLandline: '01225111222',
  correspondenceMobile: '07111222333',
  businessType: { id: 0 },
  taxRegistrationNumber: '123456789'
}

const setupNock = () => {
  nock.disableNetConnect()

  mockOrganisationSearch(v1)

  v1.get('/organisation/organisationId').reply(200, {
    _data: orgDetailsUpdatePayload
  })
}

//  Nock is setup separately in each test to ensure the order and number of requests is as expected
describe('business', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(setupNock)

  test('update business name', async () => {
    const input = {
      sbi: 'sbi',
      name: 'new name'
    }

    const putPayloadOverrides = {
      name: 'new name'
    }
    const { sbi: _, ...queryReturn } = input

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    mockOrganisationSearch(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessNameInput!) {
        updateBusinessName(input: $input) {
          success
            business {
            info {
              name
            }
          }
        }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessName: {
          success: true,
          business: {
            info: queryReturn
          }
        }
      }
    })
  })

  test('update business email', async () => {
    const input = {
      sbi: 'sbi',
      email: {
        address: 'newemail@test.com'
      }
    }
    const putPayloadOverrides = {
      email: 'newemail@test.com'
    }
    const { sbi: _, ...queryReturn } = input

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    const query = `
      mutation UpdateBusinessEmail($input: UpdateBusinessEmailInput!) {
        updateBusinessEmail(input: $input) {
          business {
            info {
              email {
                address
              }
            }
          }
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessEmail: {
          success: true,
          business: {
            info: queryReturn
          }
        }
      }
    })
  })

  test('update business address - withUprn', async () => {
    const input = {
      sbi: 'sbi',
      address: {
        withUprn: {
          buildingName: 'new buildingName',
          buildingNumberRange: 'new buildingNumberRange',
          city: 'new city',
          country: 'new country',
          county: 'new county',
          dependentLocality: 'new dependentLocality',
          doubleDependentLocality: 'new doubleDependentLocality',
          flatName: 'new flatName',
          line1: 'new line1',
          line2: 'new line2',
          line3: 'new line3',
          line4: 'new line4',
          line5: 'new line5',
          pafOrganisationName: 'new pafOrganisationName',
          postalCode: 'new postalCode',
          street: 'new street',
          uprn: 'new uprn'
        }
      },
      correspondenceAddress: {
        withUprn: {
          buildingName: 'new buildingName',
          buildingNumberRange: 'new buildingNumberRange',
          city: 'new city',
          country: 'new country',
          county: 'new county',
          dependentLocality: 'new dependentLocality',
          doubleDependentLocality: 'new doubleDependentLocality',
          flatName: 'new flatName',
          line1: 'new line1',
          line2: 'new line2',
          line3: 'new line3',
          line4: 'new line4',
          line5: 'new line5',
          pafOrganisationName: 'new pafOrganisationName',
          postalCode: 'new postalCode',
          street: 'new street',
          uprn: 'new uprn'
        }
      },
      isCorrespondenceAsBusinessAddress: true
    }

    const putPayloadOverrides = {
      address: {
        address1: 'new line1',
        address2: 'new line2',
        address3: 'new line3',
        address4: 'new line4',
        address5: 'new line5',
        pafOrganisationName: 'new pafOrganisationName',
        buildingNumberRange: 'new buildingNumberRange',
        buildingName: 'new buildingName',
        flatName: 'new flatName',
        street: 'new street',
        city: 'new city',
        county: 'new county',
        postalCode: 'new postalCode',
        country: 'new country',
        uprn: 'new uprn',
        dependentLocality: 'new dependentLocality',
        doubleDependentLocality: 'new doubleDependentLocality',
        addressTypeId: undefined
      },
      correspondenceAddress: {
        address1: 'new line1',
        address2: 'new line2',
        address3: 'new line3',
        address4: 'new line4',
        address5: 'new line5',
        pafOrganisationName: 'new pafOrganisationName',
        buildingNumberRange: 'new buildingNumberRange',
        buildingName: 'new buildingName',
        flatName: 'new flatName',
        street: 'new street',
        city: 'new city',
        county: 'new county',
        postalCode: 'new postalCode',
        country: 'new country',
        uprn: 'new uprn',
        dependentLocality: 'new dependentLocality',
        doubleDependentLocality: 'new doubleDependentLocality',
        addressTypeId: undefined
      },
      isCorrespondenceAsBusinessAddr: true
    }
    const { sbi: _, ...queryReturn } = {
      ...input,
      address: input.address.withUprn,
      correspondenceAddress: input.correspondenceAddress.withUprn
    }

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    const query = `
      mutation UpdateBusinessAddress($input: UpdateBusinessAddressInput!) {
        updateBusinessAddress(input: $input) {
          business {
            info {
              correspondenceAddress {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
                uprn
              }
              address {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
                uprn
              }
              isCorrespondenceAsBusinessAddress
            }
          }
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessAddress: {
          success: true,
          business: {
            info: {
              ...queryReturn
            }
          }
        }
      }
    })
  })

  test('update business address - withoutUprn', async () => {
    const input = {
      sbi: 'sbi',
      address: {
        withoutUprn: {
          buildingName: 'new buildingName',
          buildingNumberRange: 'new buildingNumberRange',
          city: 'new city',
          country: 'new country',
          county: 'new county',
          dependentLocality: 'new dependentLocality',
          doubleDependentLocality: 'new doubleDependentLocality',
          flatName: 'new flatName',
          line1: 'new line1',
          line2: 'new line2',
          line3: 'new line3',
          line4: 'new line4',
          line5: 'new line5',
          pafOrganisationName: 'new pafOrganisationName',
          postalCode: 'new postalCode',
          street: 'new street'
        }
      },
      correspondenceAddress: {
        withoutUprn: {
          buildingName: 'new buildingName',
          buildingNumberRange: 'new buildingNumberRange',
          city: 'new city',
          country: 'new country',
          county: 'new county',
          dependentLocality: 'new dependentLocality',
          doubleDependentLocality: 'new doubleDependentLocality',
          flatName: 'new flatName',
          line1: 'new line1',
          line2: 'new line2',
          line3: 'new line3',
          line4: 'new line4',
          line5: 'new line5',
          pafOrganisationName: 'new pafOrganisationName',
          postalCode: 'new postalCode',
          street: 'new street'
        }
      },
      isCorrespondenceAsBusinessAddress: true
    }

    const putPayloadOverrides = {
      address: {
        address1: 'new line1',
        address2: 'new line2',
        address3: 'new line3',
        address4: 'new line4',
        address5: 'new line5',
        pafOrganisationName: 'new pafOrganisationName',
        buildingNumberRange: 'new buildingNumberRange',
        buildingName: 'new buildingName',
        flatName: 'new flatName',
        street: 'new street',
        city: 'new city',
        county: 'new county',
        postalCode: 'new postalCode',
        country: 'new country',
        dependentLocality: 'new dependentLocality',
        doubleDependentLocality: 'new doubleDependentLocality',
        addressTypeId: undefined
      },
      correspondenceAddress: {
        address1: 'new line1',
        address2: 'new line2',
        address3: 'new line3',
        address4: 'new line4',
        address5: 'new line5',
        pafOrganisationName: 'new pafOrganisationName',
        buildingNumberRange: 'new buildingNumberRange',
        buildingName: 'new buildingName',
        flatName: 'new flatName',
        street: 'new street',
        city: 'new city',
        county: 'new county',
        postalCode: 'new postalCode',
        country: 'new country',
        dependentLocality: 'new dependentLocality',
        doubleDependentLocality: 'new doubleDependentLocality',
        addressTypeId: undefined
      },
      isCorrespondenceAsBusinessAddr: true
    }
    const { sbi: _, ...queryReturn } = {
      ...input,
      address: input.address.withoutUprn,
      correspondenceAddress: input.correspondenceAddress.withoutUprn
    }

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    const query = `
      mutation UpdateBusinessAddress($input: UpdateBusinessAddressInput!) {
        updateBusinessAddress(input: $input) {
          business {
            info {
              correspondenceAddress {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
              }
              address {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line2
                line3
                line4
                line5
                pafOrganisationName
                postalCode
                street
              }
              isCorrespondenceAsBusinessAddress
            }
          }
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessAddress: {
          success: true,
          business: {
            info: {
              ...queryReturn
            }
          }
        }
      }
    })
  })

  test('update business phone', async () => {
    const input = {
      sbi: 'sbi',
      phone: {
        landline: 'new phone',
        mobile: 'new mobile'
      },
      correspondencePhone: {
        landline: 'new correspondence phone',
        mobile: 'new correspondence mobile'
      }
    }
    const putPayloadOverrides = {
      landline: 'new phone',
      mobile: 'new mobile',
      correspondenceLandline: 'new correspondence phone',
      correspondenceMobile: 'new correspondence mobile'
    }
    const { sbi: _, ...queryReturn } = input

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    const query = `
      mutation UpdateBusinessPhone($input: UpdateBusinessPhoneInput!) {
        updateBusinessPhone(input: $input) {
          business {
            info {
              phone {
                landline
                mobile
              }
              correspondencePhone {
                landline
                mobile
              }
            }
          }
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessPhone: {
          success: true,
          business: {
            info: queryReturn
          }
        }
      }
    })
  })

  test('update business vat', async () => {
    const input = {
      sbi: 'sbi',
      vat: '123456789'
    }
    const putPayloadOverrides = {
      taxRegistrationNumber: '123456789'
    }
    const { sbi: _, ...queryReturn } = input

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    const query = `
      mutation UpdateBusinessVAT($input: UpdateBusinessVATInput!) {
        updateBusinessVAT(input: $input) {
          business {
            info {
              vat
            }
          }
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessVAT: {
          success: true,
          business: {
            info: queryReturn
          }
        }
      }
    })
  })
})

describe('business - external gateway', () => {
  const tokenValue = jwt.sign(
    {
      relationships: ['organisationId:sbi'],
      contactId: 'crn'
    },
    'test-secret'
  )
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    nock.disableNetConnect()

    v1_external.get('/organisation/organisationId').reply(200, {
      _data: orgDetailsUpdatePayload
    })
  })

  test('update business name', async () => {
    const input = {
      sbi: 'sbi',
      name: 'new name'
    }

    const putPayloadOverrides = {
      name: 'new name'
    }
    const { sbi: _, ...queryReturn } = input

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...putPayloadOverrides
    }

    v1_external.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    v1_external.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...putPayloadOverrides }
    })

    const query = `
      mutation Mutation($input: UpdateBusinessNameInput!) {
        updateBusinessName(input: $input) {
          success
            business {
            info {
              name
            }
          }
        }
      }
    `
    const result = await makeTestQuery(
      query,
      { 'x-forwarded-authorization': tokenValue, 'gateway-type': 'external' },
      true,
      { input }
    )

    expect(result).toEqual({
      data: {
        updateBusinessName: {
          success: true,
          business: {
            info: queryReturn
          }
        }
      }
    })
  })
})
