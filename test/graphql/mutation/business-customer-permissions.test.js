import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import nock from 'nock'
import { config } from '../../../app/config.js'
import { db } from '../../../app/mongo.js'
import { waitFor } from '../../test-helpers/wait-for.js'
import { mockOrganisationSearch, mockPersonSearch } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const addCustomerToBusinessMutation = `
  mutation AddCustomerToBusiness($input: CustomerPermissionsAndRelationshipToBusinessInput!) {
    addCustomerToBusiness(input: $input) {
      success
      errorString
    }
  }
`

const updateCustomerPermissionsMutation = `
  mutation UpdateCustomerPermissionsAndRelationshipToBusiness(
    $input: CustomerPermissionsAndRelationshipToBusinessInput!
  ) {
    updateCustomerPermissionsAndRelationshipToBusiness(input: $input) {
      success
      errorString
    }
  }
`

const mutations = [
  {
    name: 'addCustomerToBusiness',
    query: addCustomerToBusinessMutation,
    mockUpstream: (body) =>
      v1.post('/SitiAgriApi/authorisation/organisation/organisationId/authorisation', body)
  },
  {
    name: 'updateCustomerPermissionsAndRelationshipToBusiness',
    query: updateCustomerPermissionsMutation,
    mockUpstream: (body) =>
      v1.put(
        '/SitiAgriApi/authorisation/organisation/organisationId/authorisation/person/personId',
        body
      )
  }
]

const baseInput = {
  sbi: '123456789',
  crn: '1234567890',
  role: 'Agent',
  permissions: [{ id: 'BUSINESS_DETAILS', level: 'FULL_PERMISSION' }]
}

const expectedUpstreamBody = (privilegeNames) => ({
  personRoles: [{ role: 'Agent', personId: 'personId' }],
  personPrivileges: [{ privilegeNames, personId: 'personId' }]
})

// the CRN -> personId cache write is fire-and-forget, so wait for it to land before
// dropping the database, otherwise the next test gets a cache hit and skips person search
const waitForPersonIdToBeCachedInMongo = async () => {
  await waitFor(async () => {
    const cached = await db.collection('customers').findOne({ _id: '1234567890' })
    expect(cached?.personId).toBe('personId')
  })
}

describe.each(mutations)('$name', ({ name, query, mockUpstream }) => {
  beforeEach(() => {
    nock.disableNetConnect()
  })

  afterEach(async () => {
    nock.cleanAll()
    nock.enableNetConnect()
    await db.dropDatabase()
  })

  const mockLookups = () => {
    // converting sbi to organisationId and crn to personId
    mockOrganisationSearch(v1)
    mockPersonSearch(v1)
  }

  test('sends the role and privilege names upstream', async () => {
    mockLookups()
    mockUpstream(expectedUpstreamBody(['Full permission - business'])).reply(200, {
      success: true,
      errorString: null
    })

    const result = await makeTestQuery(query, null, true, { input: baseInput }, [], false)

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({ data: { [name]: { success: true, errorString: null } } })
  })

  test('accepts an empty permissions list and sends no privilege names', async () => {
    mockLookups()
    mockUpstream(expectedUpstreamBody([])).reply(200, { success: true, errorString: null })

    const result = await makeTestQuery(
      query,
      null,
      true,
      {
        input: { ...baseInput, permissions: [] }
      },
      [],
      false
    )

    await waitForPersonIdToBeCachedInMongo()

    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({ data: { [name]: { success: true, errorString: null } } })
  })

  test.each([
    [
      'role is missing',
      { role: undefined },
      /Field "role" of required type "String!" was not provided/
    ],
    [
      'permissions is missing',
      { permissions: undefined },
      /Field "permissions" of required type "\[CustomerPermissionsInput!\]!" was not provided/
    ],
    ['permissions is null', { permissions: null }, /Expected non-nullable type/],
    ['permissions contains null', { permissions: [null] }, /Expected non-nullable type/]
  ])('rejects the request when %s', async (_, override, expectedMessage) => {
    const result = await makeTestQuery(query, null, true, {
      input: { ...baseInput, ...override }
    })

    expect(result.data).toBeUndefined()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toMatch(expectedMessage)
  })
})
