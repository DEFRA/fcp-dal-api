import { jest } from '@jest/globals'
import nock from 'nock'
import { config } from '../../app/config.js'
import { Unauthorized } from '../../app/errors/graphql.js'
import { mockOrganisationSearch } from './helpers.js'
import { makeTestQuery } from './makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const query = `#graphql
  query PermittedFunctions($functions: [String!]!) {
    business(sbi: "sbi") {
      permittedFunctions(functions: $functions) {
        name
        permitted
      }
    }
  }
`

const authorisationPath =
  /^\/SitiAgriApi\/authorisation\/organisation\/organisationId\/byFunction\?functions=.+&module=CUST_SS_PORTAL&timestamp=\d+$/

describe('business.permittedFunctions', () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    jest.restoreAllMocks()
  })

  test('returns whether the external user is permitted each requested function', async () => {
    mockOrganisationSearch(v1)
    v1.get(authorisationPath).reply(200, {
      data: {
        viewLand: true,
        amendBusinessDetails: false
      },
      success: true,
      errorString: null
    })

    const result = await makeTestQuery(query, null, true, {
      functions: ['viewLand', 'amendBusinessDetails']
    })

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.business.permittedFunctions).toEqual([
      { name: 'viewLand', permitted: true },
      { name: 'amendBusinessDetails', permitted: false }
    ])
  })

  test('echoes back a custom function name, defaulting to not permitted when absent', async () => {
    mockOrganisationSearch(v1)
    v1.get(authorisationPath).reply(200, {
      data: {
        viewLand: true
      },
      success: true,
      errorString: null
    })

    const result = await makeTestQuery(query, null, true, {
      functions: ['viewLand', 'someBrandNewFunction']
    })

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.business.permittedFunctions).toEqual([
      { name: 'viewLand', permitted: true },
      { name: 'someBrandNewFunction', permitted: false }
    ])
  })

  const enableAuth = () => {
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) => (path === 'auth.disabled' ? false : originalConfig.get(path)))
  }

  test('unauthenticated - the business query itself is blocked', async () => {
    enableAuth()

    const result = await makeTestQuery(query, null, false, {
      functions: ['viewLand']
    })

    expect(result.data.business).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })

  test('authorised for business but not in the SFD group - permittedFunctions is blocked', async () => {
    const consolidatedViewGroup = config.get('auth.groups.CONSOLIDATED_VIEW')
    enableAuth()
    mockOrganisationSearch(v1)

    const result = await makeTestQuery(query, null, false, { functions: ['viewLand'] }, [
      consolidatedViewGroup
    ])

    expect(result.data.business.permittedFunctions).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
