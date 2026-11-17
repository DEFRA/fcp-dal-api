import nock from 'nock'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { config } from '../../app/config.js'
import { mockDefraIdJwks, signDefraIdToken } from './helpers.js'
import { makeTestQuery } from './makeTestQuery.js'

describe('Query.customerDuplicate', () => {
  const customerDuplicateQuery = `#graphql
    query CustomerDuplicate($input: CustomerDuplicateInput!) {
      customerDuplicate(input: $input) {
        crn
      }
    }
  `
  const validInput = { first: 'First', last: 'Last' }
  let configMockPath

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    configMockPath = { 'auth.disabled': false }
    const originalConfig = { ...config }
    vi.spyOn(config, 'get').mockImplementation((path) =>
      configMockPath[path] === undefined ? originalConfig.get(path) : configMockPath[path]
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    nock.cleanAll()
  })

  test('blocks external users', async () => {
    // arrange
    mockDefraIdJwks()
    const kits = nock(config.get('kits.external.gatewayUrl')).post(/.*/).reply(200, {})

    // act
    const result = await makeTestQuery(
      customerDuplicateQuery,
      { 'x-forwarded-authorization': signDefraIdToken({ contactId: '9234567890' }) },
      false,
      { input: validInput },
      [config.get('auth.entities.SINGLE_FRONT_DOOR.entityId')]
    )

    // assert
    expect(result.data.customerDuplicate).toBeNull()
    expect(result.errors[0].message).toBe(
      'Authorization failed, this field is not available to this user type'
    )
    expect(kits.isDone()).toBe(false)
  })

  test.each([
    ['first', 0],
    ['first', 101],
    ['last', 0],
    ['last', 101]
  ])('refuses when %s is %i characters long', async (field, length) => {
    // arrange
    configMockPath['auth.disabled'] = true
    const kits = nock(config.get('kits.internal.gatewayUrl')).post(/.*/).reply(200, {})

    // act
    const result = await makeTestQuery(customerDuplicateQuery, { email: 'some-email' }, true, {
      input: { ...validInput, [field]: 'a'.repeat(length) }
    })

    // assert
    expect(result.errors[0].message).toBe(`variable 'input.${field}' must match pattern ^.{1,100}$`)
    expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    expect(result.data.customerDuplicate).toBeNull()
    expect(kits.isDone()).toBe(false)
  })
})
