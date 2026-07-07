import { jest } from '@jest/globals'
import nock from 'nock'
import { config } from '../../app/config.js'
import { Unauthorized } from '../../app/errors/graphql.js'
import { mockOrganisationSearch } from './helpers.js'
import { makeTestQuery } from './makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const query = `#graphql
  query BusinessBankAccounts {
    business(sbi: "sbi") {
      sbi
      bankAccounts {
        number
        currency
      }
    }
  }
`

const mockOrganisation = (businessReference = '10014489653') => {
  v1.get('/organisation/organisationId').reply(200, {
    _data: { id: 'organisationId', businessReference }
  })
}

const mockExistingAccounts = (accounts) => {
  v1.get('/bank-change-service/v1/existing-accounts/10014489653').reply(200, { accounts })
}

describe('business bankAccounts', () => {
  let configMockPath

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    configMockPath = {}
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) =>
        configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
      )
  })

  afterEach(() => {
    jest.restoreAllMocks()
    nock.cleanAll()
  })

  test('returns the existing bank accounts for the business', async () => {
    mockOrganisationSearch(v1)
    mockOrganisation()
    mockExistingAccounts([
      { number: '1234', currency: 'GBP' },
      { number: '5678', currency: 'EUR' }
    ])

    const result = await makeTestQuery(query)

    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({
      data: {
        business: {
          sbi: 'sbi',
          bankAccounts: [
            { number: '1234', currency: 'GBP' },
            { number: '5678', currency: 'EUR' }
          ]
        }
      }
    })
  })

  test('returns an empty list when the business has no existing accounts', async () => {
    mockOrganisationSearch(v1)
    mockOrganisation()
    mockExistingAccounts([])

    const result = await makeTestQuery(query)

    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({
      data: {
        business: {
          sbi: 'sbi',
          bankAccounts: []
        }
      }
    })
  })

  test('returns an empty list when the response has no accounts property', async () => {
    mockOrganisationSearch(v1)
    mockOrganisation()
    v1.get('/bank-change-service/v1/existing-accounts/10014489653').reply(200, {})

    const result = await makeTestQuery(query)

    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({
      data: {
        business: {
          sbi: 'sbi',
          bankAccounts: []
        }
      }
    })
  })

  test('returns NotFound when the organisation has no FRN', async () => {
    mockOrganisationSearch(v1)
    mockOrganisation(null)

    const result = await makeTestQuery(query)

    expect(result.data.business.bankAccounts).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBe('FRN not found for business')
    expect(result.errors[0].extensions.code).toBe('NOT FOUND')
    expect(result.errors[0].extensions.http.status).toBe(404)
  })

  test.each(['SINGLE_FRONT_DOOR', 'SFI_REFORM'])(
    'allows users in the %s group to read bank accounts',
    async (group) => {
      configMockPath['auth.disabled'] = false

      mockOrganisationSearch(v1)
      mockOrganisation()
      mockExistingAccounts([{ number: '1234', currency: 'GBP' }])

      const result = await makeTestQuery(query, null, false, {}, [
        config.get(`auth.groups.${group}`)
      ])

      expect(nock.isDone()).toBe(true)
      expect(result.errors).toBeUndefined()
      expect(result.data.business.bankAccounts).toEqual([{ number: '1234', currency: 'GBP' }])
    }
  )

  test('blocks users in the CONSOLIDATED_VIEW group from reading bank accounts', async () => {
    configMockPath['auth.disabled'] = false

    mockOrganisationSearch(v1)

    const result = await makeTestQuery(query, null, false, {}, [
      config.get('auth.groups.CONSOLIDATED_VIEW')
    ])

    expect(result.data.business.sbi).toBe('sbi')
    expect(result.data.business.bankAccounts).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
