import nock from 'nock'
import { config } from '../../../app/config.js'
import { db } from '../../../app/mongo.js'
import { waitFor } from '../../test-helpers/wait-for.js'
import { mockOrganisationSearch, mockPersonSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const input = {
  sbi: 'sbi',
  crn: 'crn',
  account: {
    ukBusiness: {
      accountHolderName: 'Acme Farms Ltd',
      accountNumber: '14345678',
      bankName: 'Acme Bank',
      sortCode: '123456',
      currency: 'GBP'
    }
  }
}

const query = `
  mutation CreateBusinessCustomerBankDetails($input: CreateBusinessCustomerBankDetailsInput!) {
    createBusinessCustomerBankDetails(input: $input) {
      __typename
      ... on BankDetailsSubmitted {
        success
      }
      ... on BankDetailsValidationFailed {
        message
        attemptsRemaining
      }
      ... on BankDetailsLocked {
        message
      }
      ... on BankDetailsNotEditable {
        message
        submitted
        updatedRecently
        new
      }
    }
  }
`

const matchValidationResponse = {
  status: 'MATCH',
  message: 'All good',
  attemptsRemaining: 0,
  account: {
    bank: { name: 'Acme Bank', sortCode: '123456' }
  }
}

const waitForPersonIdToBeCachedInMongo = async () => {
  await waitFor(async () => {
    const cached = await db.collection('customers').findOne({ _id: 'crn' })
    expect(cached?.personId).toBe('personId')
  })
}

describe('createBusinessCustomerBankDetails', () => {
  afterEach(async () => {
    nock.cleanAll()
    nock.enableNetConnect()
    await db.dropDatabase()
  })

  beforeEach(() => {
    nock.disableNetConnect()
    mockOrganisationSearch(v1)
    mockPersonSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', businessReference: '10014489653' }
    })

    v1.get('/bank-change-service/v1/locked-status/organisationId/personId').reply(200, {
      locked: false
    })
    v1.get('/bank-change-service/v1/account-status/organisationId').reply(200, {
      editable: true,
      submitted: false,
      updatedRecently: false,
      new: false
    })
  })

  test('submits the bank change to the upstream service', async () => {
    v1.post('/bank-change-service/v1/validate').reply(200, matchValidationResponse)

    let submittedBody
    v1.post('/bank-change-service/v1/submit', (body) => {
      submittedBody = body
      return true
    }).reply(200, {})

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result.data.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsSubmitted',
      success: true
    })

    expect(submittedBody).toEqual({
      organisationId: 'organisationId',
      personId: 'personId',
      sbi: 'sbi',
      frn: '10014489653',
      crn: 'crn',
      submissionDateTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
      account: {
        accountType: 'UK_BUSINESS',
        name: 'Acme Farms Ltd',
        number: '14345678',
        bank: {
          name: 'Acme Bank',
          sortCode: '123456'
        }
      },
      country: { currency: 'GBP' }
    })
  })

  test('submits when validation returns PARTIAL_MATCH', async () => {
    v1.post('/bank-change-service/v1/validate').reply(200, {
      status: 'PARTIAL_MATCH',
      message: 'Some details did not match — please confirm',
      attemptsRemaining: 0,
      account: { bank: { name: 'Acme Bank', sortCode: '123456' } }
    })
    v1.post('/bank-change-service/v1/submit').reply(200, {})

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result.data.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsSubmitted',
      success: true
    })
  })

  test('returns BankDetailsValidationFailed', async () => {
    v1.post('/bank-change-service/v1/validate').reply(200, {
      status: 'FAILED',
      message: "Details don't match",
      attemptsRemaining: 2,
      account: { bank: { sortCode: '123456' } }
    })

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsValidationFailed',
      message: "Details don't match",
      attemptsRemaining: 2
    })
  })

  test('returns BankDetailsLocked', async () => {
    v1.post('/bank-change-service/v1/validate').reply(200, {
      status: 'FAILED',
      message: "Details don't match",
      attemptsRemaining: 0,
      account: { bank: { sortCode: '123456' } }
    })

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsLocked',
      message: "Details don't match"
    })
  })

  test('returns BankDetailsLocked when the locked-status endpoint reports locked', async () => {
    nock.cleanAll()
    mockOrganisationSearch(v1)
    mockPersonSearch(v1)
    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', businessReference: '10014489653' }
    })
    v1.get('/bank-change-service/v1/locked-status/organisationId/personId').reply(200, {
      locked: true
    })

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    expect(result.errors).toBeUndefined()
    expect(result.data.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsLocked',
      message: 'Bank details are locked for changes'
    })
  })

  test('returns BankDetailsNotEditable when the account-status endpoint reports not editable', async () => {
    nock.cleanAll()
    mockOrganisationSearch(v1)
    mockPersonSearch(v1)
    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', businessReference: '10014489653' }
    })
    v1.get('/bank-change-service/v1/locked-status/organisationId/personId').reply(200, {
      locked: false
    })
    v1.get('/bank-change-service/v1/account-status/organisationId').reply(200, {
      editable: false,
      submitted: true,
      updatedRecently: true,
      new: false
    })

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    expect(result.errors).toBeUndefined()
    expect(result.data.createBusinessCustomerBankDetails).toEqual({
      __typename: 'BankDetailsNotEditable',
      message: 'Bank details are not currently editable',
      submitted: true,
      updatedRecently: true,
      new: false
    })
  })

  test('returns an error when the locked-status endpoint fails', async () => {
    nock.cleanAll()
    mockOrganisationSearch(v1)
    mockPersonSearch(v1)
    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', businessReference: '10014489653' }
    })
    v1.get('/bank-change-service/v1/locked-status/organisationId/personId').reply(500, {
      message: 'Internal Server Error'
    })

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    expect(result.data).toEqual({ createBusinessCustomerBankDetails: null })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].extensions.code).toBe('INTERNAL SERVER ERROR')
    expect(result.errors[0].extensions.http.status).toBe(500)
  })

  test('returns an error when the account-status endpoint fails', async () => {
    nock.cleanAll()
    mockOrganisationSearch(v1)
    mockPersonSearch(v1)
    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', businessReference: '10014489653' }
    })
    v1.get('/bank-change-service/v1/locked-status/organisationId/personId').reply(200, {
      locked: false
    })
    v1.get('/bank-change-service/v1/account-status/organisationId').reply(500, {
      message: 'Internal Server Error'
    })

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    expect(result.data).toEqual({ createBusinessCustomerBankDetails: null })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].extensions.code).toBe('INTERNAL SERVER ERROR')
    expect(result.errors[0].extensions.http.status).toBe(500)
  })

  test('returns NotFound when organisation has no FRN', async () => {
    nock.cleanAll()
    mockOrganisationSearch(v1)

    v1.get('/organisation/organisationId').reply(200, {
      _data: { id: 'organisationId', businessReference: null }
    })

    const result = await makeTestQuery(query, null, true, { input })

    expect(result.data).toEqual({ createBusinessCustomerBankDetails: null })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBe('FRN not found for business')
    expect(result.errors[0].extensions.code).toBe('NOT FOUND')
    expect(result.errors[0].extensions.http.status).toBe(404)
  })
})
