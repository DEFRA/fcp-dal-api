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
const businessTypesQuery = gql`
  query ReferenceData {
    referenceData {
      businessTypes {
        code
        description
      }
    }
  }
`
const legalStatusesQuery = gql`
  query ReferenceData {
    referenceData {
      legalStatuses {
        code
        description
      }
    }
  }
`
const titlesQuery = gql`
  query ReferenceData {
    referenceData {
      titles
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

  describe('businessTypes', () => {
    test('returns the business types from the upstream service', async () => {
      v1.get('/reference/business-types').reply(200, {
        _data: [
          { id: 1, type: 'Farm Business' },
          { id: 2, type: 'Non-Farm Business' }
        ]
      })

      const result = await makeTestQuery(businessTypesQuery)

      expect(nock.isDone()).toBe(true)
      expect(result.errors).toBeUndefined()
      expect(result.data.referenceData.businessTypes).toEqual([
        { code: 1, description: 'Farm Business' },
        { code: 2, description: 'Non-Farm Business' }
      ])
    })
  })

  describe('legalStatuses', () => {
    test('returns the legal statuses from the upstream service', async () => {
      v1.get('/reference/legalstatus').reply(200, {
        _data: [
          { id: 1, type: 'Limited Company' },
          { id: 2, type: 'Public Limited Company' }
        ]
      })

      const result = await makeTestQuery(legalStatusesQuery)

      expect(nock.isDone()).toBe(true)
      expect(result.errors).toBeUndefined()
      expect(result.data.referenceData.legalStatuses).toEqual([
        { code: 1, description: 'Limited Company' },
        { code: 2, description: 'Public Limited Company' }
      ])
    })
  })

  describe('titles', () => {
    test('returns the titles from the upstream service', async () => {
      v1.get('/reference/titles').reply(200, {
        _data: ['Mr', 'Mrs']
      })

      const result = await makeTestQuery(titlesQuery)

      expect(nock.isDone()).toBe(true)
      expect(result.errors).toBeUndefined()
      expect(result.data.referenceData.titles).toEqual(['Mr', 'Mrs'])
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

    const result = await makeTestQuery(legalStatusesQuery, null, false)

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.referenceData.legalStatuses).toEqual([
      { code: 1, description: 'Limited Company' },
      { code: 2, description: 'Public Limited Company' }
    ])
  })
})
