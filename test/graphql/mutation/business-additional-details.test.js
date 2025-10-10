import jwt from 'jsonwebtoken'
import nock from 'nock'
import { config } from '../../../app/config.js'
import { transformBusinesDetailsToOrgAdditionalDetailsUpdate } from '../../../app/transformers/rural-payments/business.js'
import { mockOrganisationSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))
const v1_external = nock(config.get('kits.external.gatewayUrl'))

const orgAdditionalDetailsUpdatePayload = {
  id: 'organisationId',
  companiesHouseRegistrationNumber: '01234613020',
  charityCommissionRegistrationNumber: '1111',
  businessType: {
    id: 101443,
    type: 'Not Specified'
  },
  dateStartedFarming: '2025-01-01',
  legalStatus: {
    id: 102106,
    type: 'Limited Partnership (LP)'
  }
}

const setupNock = () => {
  nock.disableNetConnect()

  mockOrganisationSearch(v1)

  v1.get('/organisation/organisationId').reply(200, {
    _data: orgAdditionalDetailsUpdatePayload
  })
}

//  Nock is setup separately in each test to ensure the order and number of requests is as expected
describe('business', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(setupNock)

  test('update business legal status', async () => {
    const input = {
      sbi: 'sbi',
      legalStatusCode: 123
    }

    const transformedInput = transformBusinesDetailsToOrgAdditionalDetailsUpdate(input)

    const expectedPutPayload = {
      ...orgAdditionalDetailsUpdatePayload,
      ...transformedInput
    }

    v1.put('/organisation/organisationId/additional-business-details', expectedPutPayload).reply(
      204
    )

    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        legalStatus: { id: 123, type: 'text corresponding to 123' }
      }
    })

    mockOrganisationSearch(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessLegalStatusInput!) {
        updateBusinessLegalStatus(input: $input) {
          success
            business {
            info {
              legalStatus {
                code
                type
              }
            }
          }
        }
      }
    `
    const result = await makeTestQuery(query, true, {
      input
    })

    expect(result).toEqual({
      data: {
        updateBusinessLegalStatus: {
          success: true,
          business: {
            info: {
              legalStatus: {
                code: 123,
                type: 'text corresponding to 123'
              }
            }
          }
        }
      }
    })
  })

  test('update business type', async () => {
    const input = {
      sbi: 'sbi',
      typeCode: 123
    }

    const transformedInput = transformBusinesDetailsToOrgAdditionalDetailsUpdate(input)
    const expectedPutPayload = {
      ...orgAdditionalDetailsUpdatePayload,
      ...transformedInput
    }

    v1.put('/organisation/organisationId/additional-business-details', expectedPutPayload).reply(
      204
    )

    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        businessType: {
          id: 123,
          type: 'type corresponding to 123'
        }
      }
    })

    mockOrganisationSearch(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessTypeInput!) {
        updateBusinessType(input: $input) {
          success
            business {
            info {
              type {
                code
                type
              }
            }
          }
        }
      }
    `
    const result = await makeTestQuery(query, true, {
      input
    })

    expect(result).toEqual({
      data: {
        updateBusinessType: {
          success: true,
          business: {
            info: {
              type: {
                code: 123,
                type: 'type corresponding to 123'
              }
            }
          }
        }
      }
    })
  })

  test('update business registration numbers', async () => {
    const input = {
      sbi: 'sbi',
      registrationNumbers: {
        charityCommission: '0123',
        companiesHouse: '0456'
      }
    }

    const transformedInput = transformBusinesDetailsToOrgAdditionalDetailsUpdate(input)
    const { sbi: _, ...queryReturn } = input

    const expectedPutPayload = {
      ...orgAdditionalDetailsUpdatePayload,
      ...transformedInput
    }

    v1.put('/organisation/organisationId/additional-business-details', expectedPutPayload).reply(
      204
    )

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...transformedInput }
    })

    mockOrganisationSearch(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessRegistrationNumbersInput!) {
        updateBusinessRegistrationNumbers(input: $input) {
          success
            business {
            info {
              registrationNumbers {
                charityCommission
                companiesHouse
              }
            }
          }
        }
      }
    `
    const result = await makeTestQuery(query, true, {
      input
    })

    expect(result).toEqual({
      data: {
        updateBusinessRegistrationNumbers: {
          success: true,
          business: {
            info: queryReturn
          }
        }
      }
    })
  })

  test('update business date started farming', async () => {
    const input = {
      sbi: 'sbi',
      // Will get converted to ISO date
      dateStartedFarming: '01-01-2020'
    }

    const transformedInput = transformBusinesDetailsToOrgAdditionalDetailsUpdate(input)

    const expectedPutPayload = {
      ...orgAdditionalDetailsUpdatePayload,
      ...transformedInput
    }

    v1.put('/organisation/organisationId/additional-business-details', expectedPutPayload).reply(
      204
    )

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', ...transformedInput }
    })

    mockOrganisationSearch(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessDateStartedFarmingInput!) {
        updateBusinessDateStartedFarming(input: $input) {
          success
            business {
            info {
              dateStartedFarming
            }
          }
        }
      }
    `
    const result = await makeTestQuery(query, true, {
      input
    })

    expect(result).toEqual({
      data: {
        updateBusinessDateStartedFarming: {
          success: true,
          business: {
            info: {
              dateStartedFarming: new Date('2020-01-01T00:00:00.000Z')
            }
          }
        }
      }
    })
  })
})

describe('business - external', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    nock.disableNetConnect()

    v1_external.get('/organisation/organisationId').reply(200, {
      _data: orgAdditionalDetailsUpdatePayload
    })
  })

  test('update business legal status', async () => {
    const tokenValue = jwt.sign(
      {
        relationships: ['organisationId:sbi'],
        contactId: 'crn'
      },
      'test-secret'
    )
    const input = {
      sbi: 'sbi',
      legalStatusCode: 123
    }

    const transformedInput = transformBusinesDetailsToOrgAdditionalDetailsUpdate(input)

    const expectedPutPayload = {
      ...orgAdditionalDetailsUpdatePayload,
      ...transformedInput
    }

    v1_external
      .put('/organisation/organisationId/additional-business-details', expectedPutPayload)
      .reply(204)

    v1_external.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        legalStatus: { id: 123, type: 'text corresponding to 123' }
      }
    })

    mockOrganisationSearch(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessLegalStatusInput!) {
        updateBusinessLegalStatus(input: $input) {
          success
            business {
            info {
              legalStatus {
                code
                type
              }
            }
          }
        }
      }
    `
    const result = await makeTestQuery(
      query,
      true,
      {
        input
      },
      { 'x-forwarded-authorization': tokenValue, 'gateway-type': 'external' }
    )

    expect(result).toEqual({
      data: {
        updateBusinessLegalStatus: {
          success: true,
          business: {
            info: {
              legalStatus: {
                code: 123,
                type: 'text corresponding to 123'
              }
            }
          }
        }
      }
    })
  })
})
