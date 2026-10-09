import { jest } from '@jest/globals'
import nock from 'nock'
import { config } from '../../../app/config.js'
import { mockDefraIdJwks, mockOrganisationSearch, signDefraIdToken } from '../helpers.js'
import { makeTestQuery } from '../makeTestQuery.js'

const v1 = nock(config.get('kits.internal.gatewayUrl'))

const setupNock = () => {
  nock.disableNetConnect()

  // converting sbi to organisationId before lock/unlock
  mockOrganisationSearch(v1)

  // organisation details after lock/unlock
  mockOrganisationSearch(v1)
}

//  Nock is setup separately in each test to ensure the order and number of requests is as expected
describe('business lock and unlock', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(setupNock)

  test('lock a business', async () => {
    const input = {
      sbi: '123456789',
      reason: 'test'
    }

    v1.post('/organisation/organisationId/lock').reply(200)
    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: '123456789',
        locked: true
      }
    })

    const query = `
      mutation LockBusiness ($input: UpdateBusinessLockUnlockInput!) {
          updateBusinessLock(input: $input) {
              success
              business {
                  sbi
                  info {
                      status {
                          locked
                      }
                  }
              }
          }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(nock.isDone()).toBe(true)

    expect(result).toEqual({
      data: {
        updateBusinessLock: {
          success: true,
          business: {
            sbi: '123456789',
            info: {
              status: {
                locked: true
              }
            }
          }
        }
      }
    })
  })

  test('unlock a business', async () => {
    const input = {
      sbi: '123456789',
      reason: 'test'
    }

    v1.post('/organisation/organisationId/unlock').reply(200)
    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: '123456789',
        locked: false
      }
    })

    const query = `
      mutation UnlockBusiness ($input: UpdateBusinessLockUnlockInput!) {
          updateBusinessUnlock(input: $input) {
              success
              business {
                  sbi
                  info {
                      status {
                          locked
                      }
                  }
              }
          }
      }
    `
    const result = await makeTestQuery(query, null, true, { input })

    expect(nock.isDone()).toBe(true)

    expect(result).toEqual({
      data: {
        updateBusinessUnlock: {
          success: true,
          business: {
            sbi: '123456789',
            info: {
              status: {
                locked: false
              }
            }
          }
        }
      }
    })
  })

  test('reactivate a business', async () => {
    // arrange
    const input = {
      sbi: '123456789',
      reason: 'test'
    }

    v1.post('/organisation/organisationId/reactivate', {
      partyNoteType: 'ReactivateOrganisation',
      reason: 'test'
    }).reply(204)
    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: '123456789',
        locked: true,
        deactivated: false
      }
    })

    const query = `
      mutation ReactivateBusiness ($input: UpdateBusinessReactivateInput!) {
          updateBusinessReactivate(input: $input) {
              success
              business {
                  sbi
                  info {
                      status {
                          deactivated
                      }
                  }
              }
          }
      }
    `

    // act
    const result = await makeTestQuery(query, null, true, { input })

    // assert
    expect(nock.isDone()).toBe(true)
    expect(result).toEqual({
      data: {
        updateBusinessReactivate: {
          success: true,
          business: {
            sbi: '123456789',
            info: {
              status: {
                deactivated: false
              }
            }
          }
        }
      }
    })
  })

  test('reactivate a business is refused for external users', async () => {
    // arrange
    const originalGet = config.get.bind(config)
    jest
      .spyOn(config, 'get')
      .mockImplementation((path) => (path === 'auth.disabled' ? false : originalGet(path)))
    nock.cleanAll()
    mockDefraIdJwks()
    const kits = nock(config.get('kits.external.gatewayUrl'))
      .post(/\/organisation\/.*\/reactivate/)
      .reply(204)
    const query = `
      mutation ReactivateBusiness ($input: UpdateBusinessReactivateInput!) {
          updateBusinessReactivate(input: $input) {
              success
          }
      }
    `

    // act
    const result = await makeTestQuery(
      query,
      { 'x-forwarded-authorization': signDefraIdToken({ contactId: '1234567890' }) },
      false,
      { input: { sbi: '123456789', reason: 'test' } },
      [config.get('auth.groups.SINGLE_FRONT_DOOR')]
    )

    // assert
    expect(result.data.updateBusinessReactivate).toBeNull()
    expect(result.errors[0].message).toBe(
      'Authorization failed, this field is not available to this user type'
    )
    expect(kits.isDone()).toBe(false)
  })
})
