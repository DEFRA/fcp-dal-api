import { jest } from '@jest/globals'
import nock from 'nock'
import { config } from '../../app/config.js'
import { Unauthorized } from '../../app/errors/graphql.js'
import { makeTestQuery } from './makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const query = `#graphql
  query InternalUserPermittedFunctions($functions: [String!]!) {
    internalUser {
      permittedFunctions(functions: $functions) {
        name
        permitted
      }
    }
  }
`

// Note the pipe separating function names must be URL-encoded (%7C)
const authorisationPath =
  /^\/SitiAgriApi\/authorisation\/byFunction\?functions=[^|&]+(%7C[^|&]+)*&module=CUST_SS_PORTAL&timestamp=\d+$/

// The `functions` query parameter is present but empty when no (non-empty) function names are requested
const emptyFunctionsAuthorisationPath =
  /^\/SitiAgriApi\/authorisation\/byFunction\?functions=&module=CUST_SS_PORTAL&timestamp=\d+$/

describe('internalUser.permittedFunctions', () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    jest.restoreAllMocks()
  })

  test('returns whether the internal user is permitted each requested function', async () => {
    // the upstream identifies the internal user by the forwarded `email` header
    v1.get(authorisationPath)
      .matchHeader('email', 'test@defra.gov.uk')
      .reply(200, {
        data: {
          viewLand: true,
          caseManagement: false
        },
        success: true,
        errorString: null
      })

    const result = await makeTestQuery(query, null, true, {
      functions: ['viewLand', 'caseManagement']
    })

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.internalUser.permittedFunctions).toEqual([
      { name: 'viewLand', permitted: true },
      { name: 'caseManagement', permitted: false }
    ])
  })

  test('echoes back a custom function name, defaulting to not permitted when absent', async () => {
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
    expect(result.data.internalUser.permittedFunctions).toEqual([
      { name: 'viewLand', permitted: true },
      { name: 'someBrandNewFunction', permitted: false }
    ])
  })

  test('returns an empty list when an empty functions list is requested', async () => {
    // the upstream treats an empty functions parameter as a single empty-string function name
    v1.get(emptyFunctionsAuthorisationPath).reply(200, {
      data: { '': false },
      success: true,
      errorString: null
    })

    const result = await makeTestQuery(query, null, true, { functions: [] })

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.internalUser.permittedFunctions).toEqual([])
  })

  test('echoes an empty-string function name back as not permitted', async () => {
    v1.get(emptyFunctionsAuthorisationPath).reply(200, {
      data: { '': false },
      success: true,
      errorString: null
    })

    const result = await makeTestQuery(query, null, true, { functions: [''] })

    expect(nock.isDone()).toBe(true)
    expect(result.errors).toBeUndefined()
    expect(result.data.internalUser.permittedFunctions).toEqual([{ name: '', permitted: false }])
  })

  test('rejects a request that omits the functions argument', async () => {
    const result = await makeTestQuery(query, null, true, {})

    expect(result.data).toBeUndefined()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toEqual(
      'Variable "$functions" of required type "[String!]!" was not provided.'
    )
  })

  test('rejects a null functions list', async () => {
    const result = await makeTestQuery(query, null, true, { functions: null })

    expect(result.data).toBeUndefined()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toEqual(
      'Variable "$functions" of non-null type "[String!]!" must not be null.'
    )
  })

  const enableAuth = () => {
    const originalConfig = { ...config }
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) => (path === 'auth.disabled' ? false : originalConfig.get(path)))
  }

  test('unauthenticated - the internalUser query is blocked', async () => {
    enableAuth()

    const result = await makeTestQuery(query, null, false, {
      functions: ['viewLand']
    })

    expect(result.data.internalUser).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })

  test('authenticated but not in the SFD group - the internalUser query is blocked', async () => {
    const consolidatedViewGroup = config.get('auth.groups.CONSOLIDATED_VIEW')
    enableAuth()

    const result = await makeTestQuery(query, null, false, { functions: ['viewLand'] }, [
      consolidatedViewGroup
    ])

    expect(result.data.internalUser).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
