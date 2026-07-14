import { jest } from '@jest/globals'
import { gql } from 'graphql-request'
import nock from 'nock'
import { config } from '../../app/config.js'
import { makeTestQuery } from './makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const query = gql`
  query ReferenceData {
    referenceData {
      countriesCurrencies {
        code
        currency
      }
    }
  }
`
const refDataQuery = gql`
  query ReferenceData {
    referenceData {
      legalStatuses {
        code
        description
      }
    }
  }
`

describe('referenceData', () => {
  let configMockPath
  beforeAll(() => {
    nock.disableNetConnect()
  })
  afterAll(() => {
    nock.enableNetConnect()
  })
  beforeEach(() => {
    configMockPath = {
      'auth.disabled': true
    }
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
  })
  afterEach(() => {
    nock.cleanAll()
    jest.restoreAllMocks()
  })

  describe('countriesCurrencies', () => {
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
  })

  test('does not call the upstream service unless some reference data is requested', async () => {
    const result = await makeTestQuery(gql`
      query ReferenceData {
        referenceData {
          __typename
        }
      }
    `)

    expect(result.errors).toBeUndefined()
    expect(result.data.referenceData).toEqual({ __typename: 'ReferenceData' })
  })

  test('authentication is not necessary', async () => {
    configMockPath['auth.disabled'] = false
    v1.get('/reference/legalstatus').reply(200, {
      _data: [
        { id: 1, type: 'Limited Company' },
        { id: 2, type: 'Public Limited Company' }
      ]
    })

    const result = await makeTestQuery(refDataQuery, null, false)

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.referenceData.legalStatuses).toEqual([
      { code: 1, description: 'Limited Company' },
      { code: 2, description: 'Public Limited Company' }
    ])
  })
})
