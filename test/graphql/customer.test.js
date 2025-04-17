import nock from 'nock'
import { Unauthorized } from '../../app/errors/graphql.js'
import { makeTestQuery } from './makeTestQuery.js'

beforeAll(() => {
  nock.disableNetConnect()

  const v1 = nock(process.env.RP_KITS_GATEWAY_INTERNAL_URL)

  v1.post('/person/search', {
    searchFieldType: 'CUSTOMER_REFERENCE',
    primarySearchPhrase: 'crn',
    offset: 0,
    limit: 1
  }).reply(200, {
    _data: [
      {
        id: 'personId'
      }
    ]
  })

  v1.get('/person/personId/summary').reply(200, {
    _data: {
      id: 'personId'
    }
  })

  v1.get('/external-auth/security-answers/crn').reply(200, {
    memorableDate: 'memorableDate',
    memorableEvent: 'memorableEvent',
    memorableLocation: 'memorableLocation',
    lastUpdatedOn: 'lastUpdatedOn'
  })

  v1.get('/organisation/person/personId/summary?search=&page-size=100').reply(200, {
    _data: [
      {
        id: 'organisationId',
        name: 'name',
        sbi: 'sbi'
      }
    ]
  })

  v1.get('/authorisation/organisation/organisationId').reply(200, {
    _data: [
      {
        id: 'personId',
        firstName: 'firstName',
        lastName: 'lastName',
        role: 'role',
        customerReference: 'crn',
        privileges: []
      }
    ]
  })

  v1.get('/notifications?personId=personId&organisationId=organisationId&page=1').reply(200, {
    notifications: [
      {
        id: 'id',
        createdAt: 1735732800000,
        title: 'title',
        body: 'body'
      }
    ],
    resultCount: 1,
    readCount: 1,
    unreadCount: 2
  })

  v1.get('/notifications?personId=personId&organisationId=organisationId&page=2').reply(200, {
    notifications: [],
    resultCount: 1,
    readCount: 1,
    unreadCount: 2
  })
})

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('Query.customer', () => {
  const query = `#graphql
    query CustomerTest {
      customer(crn: "crn") {
        crn
        personId
        authenticationQuestions {
          memorableDate
          memorableEvent
          memorableLocation
          updatedAt
          isFound
        }
        businesses {
          organisationId
          sbi
          name
          role
        }
        business(sbi: "sbi") {
          organisationId
          sbi
          name
          role
          messages {
            id
            subject
            date
            body
            read
            deleted
          }
          permissionGroups {
            id
            level
            functions
          }
        }
      }
    }
  `

  test('authenticated', async () => {
    const result = await makeTestQuery(query)

    expect(result).toEqual({
      data: {
        customer: {
          crn: 'crn',
          personId: 'personId',
          authenticationQuestions: {
            memorableDate: 'memorableDate',
            memorableEvent: 'memorableEvent',
            memorableLocation: 'memorableLocation',
            updatedAt: 'lastUpdatedOn',
            isFound: true
          },
          businesses: [
            { organisationId: 'organisationId', sbi: 'sbi', name: 'name', role: 'role' }
          ],
          business: {
            organisationId: 'organisationId',
            sbi: 'sbi',
            name: 'name',
            role: 'role',
            messages: [
              {
                id: 'id',
                subject: 'title',
                date: '2025-01-01T12:00:00.000Z',
                body: 'body',
                read: false,
                deleted: false
              }
            ],
            permissionGroups: [
              { id: 'BASIC_PAYMENT_SCHEME', level: 'NO_ACCESS', functions: [] },
              { id: 'BUSINESS_DETAILS', level: 'NO_ACCESS', functions: [] },
              { id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS', level: 'NO_ACCESS', functions: [] },
              { id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS', level: 'NO_ACCESS', functions: [] },
              { id: 'ENTITLEMENTS', level: 'NO_ACCESS', functions: [] },
              {
                id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
                level: 'NO_ACCESS',
                functions: []
              },
              { id: 'LAND_DETAILS', level: 'NO_ACCESS', functions: [] }
            ]
          }
        }
      }
    })
  })

  test('unauthenticated', async () => {
    const result = await makeTestQuery(
      `#graphql
        query Customer {
          customer(crn: "crn") {
            crn
          }
        }
      `,
      false
    )

    expect(result.data.customer).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
