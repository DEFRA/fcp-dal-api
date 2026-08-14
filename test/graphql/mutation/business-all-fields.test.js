import nock from 'nock'
import { config } from '../../../app/config.js'
import { mockOrganisationSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

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
  isCorrespondenceAsBusinessAddr: false,
  email: 'hadleyfarmsltdp@defra.com.test',
  landline: '01234613020',
  mobile: '01234042273',
  businessType: { id: 0 },
  legalStatus: { id: 101 },
  taxRegistrationNumber: '123456789'
}

const query = `
  mutation UpdateBusinessAllFields($input: UpdateBusinessAllFieldsInput!) {
    updateBusinessAllFields(input: $input) {
      success
      businessDetailsUpdated
      additionalBusinessDetailsUpdated
      business {
        info {
          name
        }
      }
    }
  }
`

const setupNock = () => {
  nock.disableNetConnect()

  mockOrganisationSearch(v1)

  v1.get('/organisation/organisationId').reply(200, {
    _data: orgDetailsUpdatePayload
  })
}

describe('updateBusinessAllFields', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(setupNock)

  test('updates business details and additional details with one upstream call each', async () => {
    const input = {
      sbi: '123456789',
      name: 'new name',
      email: { address: 'newemail@test.com' },
      phone: { landline: 'new phone', mobile: 'new mobile' },
      vat: '987654321',
      legalStatusCode: 102,
      typeCode: 3,
      dateStartedFarming: '2025-01-01',
      registrationNumbers: {
        companiesHouse: '12345678',
        charityCommission: '87654321'
      }
    }

    const detailsPutPayloadOverrides = {
      name: 'new name',
      email: 'newemail@test.com',
      landline: 'new phone',
      mobile: 'new mobile',
      taxRegistrationNumber: '987654321'
    }
    const additionalDetailsPutPayloadOverrides = {
      companiesHouseRegistrationNumber: '12345678',
      charityCommissionRegistrationNumber: '87654321',
      businessType: { id: 3 },
      legalStatus: { id: 102 },
      dateStartedFarming: '2025-01-01T00:00:00.000Z'
    }

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      ...detailsPutPayloadOverrides,
      ...additionalDetailsPutPayloadOverrides
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    v1.put('/organisation/organisationId/additional-business-details', expectedPutPayload).reply(
      204
    )

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', name: 'new name' }
    })

    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessAllFields: {
          success: true,
          businessDetailsUpdated: true,
          additionalBusinessDetailsUpdated: true,
          business: {
            info: {
              name: 'new name'
            }
          }
        }
      }
    })
  })

  test('only calls the business details endpoint when no additional details fields are provided', async () => {
    const input = {
      sbi: '123456789',
      name: 'new name'
    }

    v1.put('/organisation/organisationId/business-details', {
      ...orgDetailsUpdatePayload,
      name: 'new name'
    }).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', name: 'new name' }
    })

    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessAllFields: {
          success: true,
          businessDetailsUpdated: true,
          additionalBusinessDetailsUpdated: null,
          business: {
            info: {
              name: 'new name'
            }
          }
        }
      }
    })
  })

  test('returns a GraphQL error when the additional business details update fails', async () => {
    const input = {
      sbi: '123456789',
      name: 'new name',
      typeCode: 3
    }

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      name: 'new name',
      businessType: { id: 3 }
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(204)

    v1.put('/organisation/organisationId/additional-business-details', expectedPutPayload).reply(
      500,
      { message: 'Internal Server Error' }
    )

    const result = await makeTestQuery(query, null, true, { input })

    // All mocks consumed proves the business details update was applied before the failure
    expect(v1.isDone()).toBe(true)
    expect(result.data).toEqual({ updateBusinessAllFields: null })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].extensions).toEqual(
      expect.objectContaining({
        code: 'INTERNAL SERVER ERROR',
        http: { status: 500 },
        businessDetailsUpdated: true,
        additionalBusinessDetailsUpdated: false
      })
    )
  })

  test('reports neither update applied when the business details update fails first', async () => {
    const input = {
      sbi: '123456789',
      name: 'new name',
      typeCode: 3
    }

    const expectedPutPayload = {
      ...orgDetailsUpdatePayload,
      name: 'new name',
      businessType: { id: 3 }
    }

    v1.put('/organisation/organisationId/business-details', expectedPutPayload).reply(500, {
      message: 'Internal Server Error'
    })

    const result = await makeTestQuery(query, null, true, { input })

    expect(result.data).toEqual({ updateBusinessAllFields: null })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].extensions).toEqual(
      expect.objectContaining({
        code: 'INTERNAL SERVER ERROR',
        http: { status: 500 },
        businessDetailsUpdated: false,
        additionalBusinessDetailsUpdated: null
      })
    )
  })

  test('only calls the additional business details endpoint when no business details fields are provided', async () => {
    const input = {
      sbi: '123456789',
      typeCode: 3
    }

    v1.put('/organisation/organisationId/additional-business-details', {
      ...orgDetailsUpdatePayload,
      businessType: { id: 3 }
    }).reply(204)

    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', name: orgDetailsUpdatePayload.name }
    })

    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessAllFields: {
          success: true,
          businessDetailsUpdated: null,
          additionalBusinessDetailsUpdated: true,
          business: {
            info: {
              name: orgDetailsUpdatePayload.name
            }
          }
        }
      }
    })
  })
})
