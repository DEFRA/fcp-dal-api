config.set('auth.disabled', false)
import nock from 'nock'
import { config } from '../../app/config.js'
import { businessDetailsUpdatePayload, orgDetailsUpdatePayload } from '../fixtures/organisation.js'
import { makeTestQuery } from './makeTestQuery.js'

const setupNock = () => {
  nock.disableNetConnect()

  const v1 = nock(config.get('kits.gatewayUrl'))

  v1.post('/organisation/search', {
    searchFieldType: 'SBI',
    primarySearchPhrase: 'sbi',
    offset: 0,
    limit: 1
  }).reply(200, {
    _data: [
      {
        id: 'organisationId'
      }
    ]
  })

  v1.put('/organisation/organisationId/business-details', orgDetailsUpdatePayload).reply(204)
}

describe('Mutation', () => {
  beforeAll(setupNock)

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test('update business details', async () => {
    const query = `
        mutation Mutation($input: UpdateBusinessDetailsInput!) {
          updateBusinessDetails(input: $input)
        }
    `
    const result = await makeTestQuery(query, true, {
      input: {
        sbi: 'sbi',
        details: businessDetailsUpdatePayload
      }
    })

    expect(result).toEqual({
      data: {
        updateBusinessDetails: true
      }
    })
  })
})
