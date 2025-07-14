config.set('auth.disabled', false)
import nock from 'nock'
import { config } from '../../../app/config.js'
import { transformBusinesDetailsToOrgAdditionalDetailsUpdate } from '../../../app/transformers/rural-payments/business.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.gatewayUrl'))

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

  v1.post('/organisation/search', {
    searchFieldType: 'SBI',
    primarySearchPhrase: 'sbi',
    offset: 0,
    limit: 1
  }).reply(200, {
    _data: [
      {
        id: 'organisationId'
      }
    ]
  })

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
      legalStatus: {
        code: 123,
        type: 'legal status type'
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

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

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
            info: queryReturn
          }
        }
      }
    })
  })

  test('update business type', async () => {
    const input = {
      sbi: 'sbi',
      type: {
        code: 123,
        type: 'business type'
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

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

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
            info: queryReturn
          }
        }
      }
    })
  })

  test('update business registration numbers', async () => {
    const input = {
      sbi: 'sbi',
      registrationNumbers: {
        charityCommission: 123,
        companiesHouse: 456
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

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

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
      dateStartedFarming: '2021-05-27T12:46:17.305Z'
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

    v1.post('/organisation/search', {
      searchFieldType: 'SBI',
      primarySearchPhrase: 'sbi',
      offset: 0,
      limit: 1
    }).reply(200, {
      _data: [
        {
          id: 'organisationId'
        }
      ]
    })

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
              dateStartedFarming: new Date('2021-05-27T12:46:17.305Z')
            }
          }
        }
      }
    })
  })
})
