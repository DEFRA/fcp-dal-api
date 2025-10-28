import nock from 'nock'
import { config } from '../../../app/config.js'
import { mockOrganisationSearch } from '../helpers.js'
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
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(setupNock)

  test('lock a business', async () => {
    const input = {
      sbi: 'sbi',
      reason: 'test'
    }

    v1.post('/organisation/organisationId/lock').reply(200)
    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: 'sbi',
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
            sbi: 'sbi',
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
      sbi: 'sbi',
      reason: 'test'
    }

    v1.post('/organisation/organisationId/unlock').reply(200)
    v1.get('/organisation/organisationId').reply(200, {
      _data: {
        id: 'organisationId',
        sbi: 'sbi',
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
            sbi: 'sbi',
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
})
