import nock from 'nock'
import { config } from '../../../app/config.js'
import { db } from '../../../app/mongo.js'
import { mockOrganisationSearch, mockPersonSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'
import { waitFor } from '../../test-helpers/wait-for.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const input = {
  sbi: 'sbi',
  crn: 'crn',
  account: {
    ukBusiness: {
      accountHolderName: 'Acme Farms Ltd',
      accountNumber: '14345678',
      bankName: 'Acme Bank',
      accountSortCode: '123456',
      currency: 'GBP'
    }
  }
}

const query = `
  mutation CreateBusinessCustomerBankDetails($input: CreateBusinessCustomerBankDetailsInput!) {
    createBusinessCustomerBankDetails(input: $input) {
      success
    }
  }
`

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
  })

  test('submits the bank change to the upstream service', async () => {
    let submittedBody
    v1.post('/bank-change-service/v1/submit', (body) => {
      submittedBody = body
      return true
    }).reply(200, {})

    const result = await makeTestQuery(query, null, true, { input }, [], false)

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({
      data: {
        createBusinessCustomerBankDetails: {
          success: true
        }
      }
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
