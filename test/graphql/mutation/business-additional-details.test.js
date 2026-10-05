import nock from 'nock'
import { config } from '../../../app/config.js'
import { transformBusinessDetailsToOrgAdditionalDetailsUpdate } from '../../../app/transformers/rural-payments/business.js'
import {
  mockBusinessTypeReferenceData,
  mockLegalStatusReferenceData,
  mockOrganisationSearch,
  signDefraIdToken
} from '../helpers.js'
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
      sbi: '123456789',
      legalStatusCode: 102111
    }

    const transformedInput = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)

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
        legalStatus: { id: 102111, type: 'Sole Proprietorship' }
      }
    })

    mockOrganisationSearch(v1)
    mockLegalStatusReferenceData(v1)

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
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessLegalStatus: {
          success: true,
          business: {
            info: {
              legalStatus: {
                code: 102111,
                type: 'Sole Proprietorship'
              }
            }
          }
        }
      }
    })
  })

  test('update business type', async () => {
    const input = {
      sbi: '123456789',
      typeCode: 3
    }

    const transformedInput = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)
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
          id: 3,
          type: 'Business type 3'
        }
      }
    })

    mockOrganisationSearch(v1)
    mockBusinessTypeReferenceData(v1)

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
    const result = await makeTestQuery(query, null, true, { input })

    expect(result).toEqual({
      data: {
        updateBusinessType: {
          success: true,
          business: {
            info: {
              type: {
                code: 3,
                type: 'Business type 3'
              }
            }
          }
        }
      }
    })
  })

  test('update business registration numbers', async () => {
    const input = {
      sbi: '123456789',
      registrationNumbers: {
        charityCommission: '0123',
        companiesHouse: '0456'
      }
    }

    const transformedInput = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)
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
    const result = await makeTestQuery(query, null, true, { input })

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

  test.each([
    ['companiesHouse', 8],
    ['charityCommission', 10]
  ])(
    'update business registration numbers - rejects %s longer than %i characters',
    async (field, maxLength) => {
      const query = `
        mutation Mutation($input: UpdateBusinessRegistrationNumbersInput!) {
          updateBusinessRegistrationNumbers(input: $input) {
            success
          }
        }
      `
      const result = await makeTestQuery(
        query,
        null,
        true,
        {
          input: {
            sbi: '123456789',
            registrationNumbers: { [field]: '1'.repeat(maxLength + 1) }
          }
        },
        [],
        false
      )

      expect(result.errors[0].message).toEqual(
        `variable 'input.registrationNumbers.${field}' must match pattern ^.{0,${maxLength}}$`
      )
      expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
      expect(result.data.updateBusinessRegistrationNumbers).toBeNull()
    }
  )

  test('update business date started farming', async () => {
    const input = {
      sbi: '123456789',
      // Will get converted to ISO date
      dateStartedFarming: '01-01-2020'
    }

    const transformedInput = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)

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
    const result = await makeTestQuery(query, null, true, { input })

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

  test('update business legal status - rejects unknown legal status code', async () => {
    mockLegalStatusReferenceData(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessLegalStatusInput!) {
        updateBusinessLegalStatus(input: $input) {
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, {
      input: { sbi: '123456789', legalStatusCode: 102 }
    })

    expect(result.errors[0].message).toEqual('Invalid legalStatusCode: 102')
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.updateBusinessLegalStatus).toBeNull()
  })

  test('update business type - rejects unknown type code', async () => {
    mockBusinessTypeReferenceData(v1)

    const query = `
      mutation Mutation($input: UpdateBusinessTypeInput!) {
        updateBusinessType(input: $input) {
          success
        }
      }
    `
    const result = await makeTestQuery(query, null, true, {
      input: { sbi: '123456789', typeCode: 123 }
    })

    expect(result.errors[0].message).toEqual('Invalid typeCode: 123')
    expect(result.errors[0].extensions.code).toEqual('BAD_USER_INPUT')
    expect(result.data.updateBusinessType).toBeNull()
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
    const tokenValue = signDefraIdToken({
      relationships: ['organisationId:123456789'],
      contactId: 'crn'
    })
    const input = {
      sbi: '123456789',
      legalStatusCode: 102111
    }

    const transformedInput = transformBusinessDetailsToOrgAdditionalDetailsUpdate(input)

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
        legalStatus: { id: 102111, type: 'Sole Proprietorship' }
      }
    })

    mockOrganisationSearch(v1)

    mockLegalStatusReferenceData(v1_external)

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
    const result = await makeTestQuery(query, { 'x-forwarded-authorization': tokenValue }, true, {
      input
    })

    expect(result).toEqual({
      data: {
        updateBusinessLegalStatus: {
          success: true,
          business: {
            info: {
              legalStatus: {
                code: 102111,
                type: 'Sole Proprietorship'
              }
            }
          }
        }
      }
    })
  })
})
