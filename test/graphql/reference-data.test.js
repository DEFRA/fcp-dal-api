import { jest } from '@jest/globals'
import nock from 'nock'
import { config } from '../../app/config.js'
import { Unauthorized } from '../../app/errors/graphql.js'
import { makeTestQuery } from './makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const query = `
  query ReferenceData {
    referenceData {
      countriesCurrencies {
        code
        currency
      }
    }
  }
`

describe('referenceData', () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    jest.restoreAllMocks()
  })

  test('returns the country code to currency mapping from the upstream service', async () => {
    v1.get('/bank-change-service/v1/country-codes').reply(200, {
      countriesCurrency: {
        GB: 'GBP',
        IE: 'EUR',
        PT: 'EUR',
        US: 'USD'
      }
    })

    const result = await makeTestQuery(query)

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.referenceData.countriesCurrencies).toEqual([
      { code: 'GB', currency: 'GBP' },
      { code: 'IE', currency: 'EUR' },
      { code: 'PT', currency: 'EUR' },
      { code: 'US', currency: 'USD' }
    ])
  })

  test('does not call the upstream service unless countriesCurrencies is requested', async () => {
    const result = await makeTestQuery(`query ReferenceData { referenceData { __typename } }`)

    expect(result.errors).toBeUndefined()
    expect(result.data.referenceData).toEqual({ __typename: 'ReferenceData' })
  })

  test('unauthenticated', async () => {
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) => (path === 'auth.disabled' ? false : originalConfig.get(path)))

    const result = await makeTestQuery(query, null, false)

    expect(result.data.referenceData).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
