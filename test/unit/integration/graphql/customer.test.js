import { DefaultAzureCredential } from '@azure/identity'
import { graphql, GraphQLError } from 'graphql'

import { EntraIdApi } from '../../../../app/data-sources/entra-id/EntraIdApi.js'
import { NotFound } from '../../../../app/errors/graphql.js'
import { schema } from '../../../../app/graphql/server.js'
import { transformAuthenticateQuestionsAnswers } from '../../../../app/transformers/authenticate/question-answers.js'
import { ruralPaymentsPortalCustomerTransformer } from '../../../../app/transformers/rural-payments/customer.js'
import { personById } from '../../../../mocks/fixtures/person.js'
import mockServer from '../../../../mocks/server.js'
import { fakeContext } from '../../../test-setup.js'

const personFixture = personById({ id: '5007136' })

beforeAll(mockServer.start)
afterAll(mockServer.stop)

describe('Query.customer', () => {
  afterEach(async () => {
    await mockServer.server.mock.restoreRouteVariants()
  })

  it('should return customer data', async () => {
    const customerInfo = ruralPaymentsPortalCustomerTransformer(
      personFixture._data
    )
    const result = await graphql({
      source: `#graphql
        query Customer($crn: ID!) {
          customer(crn: $crn) {
            crn
            personId
            info {
              name {
                title
                otherTitle
                first
                middle
                last
              }
              dateOfBirth
              phone {
                mobile
                landline
                fax
              }
              email {
                address
                validated
                doNotContact
              }
              status {
                locked
                confirmed
                deactivated
              }
              address {
                pafOrganisationName
                buildingNumberRange
                buildingName
                flatName
                street
                city
                county
                postalCode
                country
                uprn
                dependentLocality
                doubleDependentLocality
                typeId
              }
            }
          }
        }
      `,
      variableValues: {
        crn: '0866159801'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          crn: personFixture._data.customerReferenceNumber,
          personId: personFixture._data.id.toString(),
          info: customerInfo
        }
      }
    })
  })

  it('should handle person not found error', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-person-get-by-id:not-found'
    )

    const result = await graphql({
      source: `#graphql
        query Customer($crn: ID!) {
          customer(crn: $crn) {
            info { dateOfBirth }
          }
        }
      `,
      variableValues: {
        crn: '0866159801'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: { customer: { info: null } },
      errors: [new GraphQLError('Rural payments customer not found')]
    })
  })

  it('should handle error', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-person-get-by-id:error'
    )

    const result = await graphql({
      source: `#graphql
        query Customer($crn: ID!) {
          customer(crn: $crn) {
            info { dateOfBirth }
          }
        }
      `,
      variableValues: {
        crn: '0866159801'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: { customer: { info: null } },
      errors: [new GraphQLError('Internal Server Error')]
    })
  })

  describe('Handle 500 errors', () => {
    it('should retry request if 500 error', async () => {
      await mockServer.server.mock.useRouteVariant(
        'rural-payments-person-get-by-crn:error'
      )

      const result = await graphql({
        source: `#graphql
          query TestCustomerBusiness($crn: ID!) {
            customer(crn: $crn) {
              personId
            }
          }
        `,
        variableValues: {
          crn: '9477368292'
        },
        schema,
        contextValue: fakeContext
      })

      expect(result).toEqual({
        data: {
          customer: {
            personId: '5302028'
          }
        }
      })
    })

    it('should throw an error after 3 retries', async () => {
      await mockServer.server.mock.useRouteVariant(
        'rural-payments-person-get-by-crn:error-indefinite'
      )

      const result = await graphql({
        source: `#graphql
          query TestCustomerBusiness($crn: ID!) {
            customer(crn: $crn) {
              personId
            }
          }
        `,
        variableValues: {
          crn: '9477368292'
        },
        schema,
        contextValue: fakeContext
      })

      expect(result).toEqual({
        data: {
          customer: null
        },
        errors: [new GraphQLError('Internal Server Error')]
      })
    })
  })
})

describe('Handle other errors', () => {
  afterEach(async () => {
    await mockServer.server.mock.restoreRouteVariants()
  })

  it('should handle 403 error', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-person-get-by-crn:error-permission'
    )

    const result = await graphql({
      source: `#graphql
        query TestCustomerBusiness($crn: ID!) {
          customer(crn: $crn) {
            personId
          }
        }
      `,
      variableValues: {
        crn: '9103020285' // personId: 5007136
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: null
      },
      errors: [new GraphQLError('Forbidden')]
    })
  })
})

describe('Query.customer.authenticationQuestions', () => {
  beforeEach(() => {
    jest
      .spyOn(DefaultAzureCredential.prototype, 'getToken')
      .mockImplementation(() => ({ token: 'mockToken' }))
    jest
      .spyOn(EntraIdApi.prototype, 'get')
      .mockImplementation(() => ({ employeeId: 'x123456' }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return customer authenticate questions', async () => {
    const authenticateQuestionsResponse = {
      CRN: '123',
      Date: 'some date',
      Event: 'some event',
      Location: 'some location',
      Updated: 'some date'
    }
    fakeContext.dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN.mockResolvedValue(
      authenticateQuestionsResponse
    )
    const transformedAuthenticateQuestions =
      transformAuthenticateQuestionsAnswers(authenticateQuestionsResponse)
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "0866159801") {
            authenticationQuestions(entraIdUserObjectId: "3ac411c8-858a-4be4-9395-6e86a86923f7") {
              memorableDate
              memorableEvent
              memorablePlace
              updatedAt
              isFound
            }
          }
        }
      `,
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          authenticationQuestions: JSON.parse(
            JSON.stringify(transformedAuthenticateQuestions)
          )
        }
      }
    })
  })

  it('should return isFound false if record not found', async () => {
    const authenticateQuestionsResponse = null
    fakeContext.dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN.mockResolvedValue(
      authenticateQuestionsResponse
    )
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "0866159801") {
            authenticationQuestions(entraIdUserObjectId: "3ac411c8-858a-4be4-9395-6e86a86923f7") {
              memorableDate
              memorableEvent
              memorablePlace
              updatedAt
              isFound
            }
          }
        }
      `,
      variableValues: {
        personId: '123'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          authenticationQuestions: {
            memorableDate: null,
            memorableEvent: null,
            memorablePlace: null,
            updatedAt: null,
            isFound: false
          }
        }
      }
    })
  })

  it('should return null for fields that are empty', async () => {
    const authenticateQuestionsResponse = {
      CRN: '123',
      Date: '',
      Event: '',
      Location: 'some location',
      Updated: 'some date'
    }
    fakeContext.dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN.mockResolvedValue(
      authenticateQuestionsResponse
    )
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "0866159801") {
            authenticationQuestions(entraIdUserObjectId: "3ac411c8-858a-4be4-9395-6e86a86923f7") {
              memorableDate
              memorableEvent
              memorablePlace
              updatedAt
              isFound
            }
          }
        }
      `,
      variableValues: {
        personId: '123'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          authenticationQuestions: {
            memorableDate: null,
            memorableEvent: null,
            memorablePlace: 'some location',
            updatedAt: 'some date',
            isFound: true
          }
        }
      }
    })
  })
})

describe('Query.customer.businesses', () => {
  afterEach(async () => {
    await mockServer.server.mock.restoreRouteVariants()
  })

  it('should return customer businesses', async () => {
    const result = await graphql({
      source: `#graphql
        query TestCustomerBusiness($crn: ID!) {
          customer(crn: $crn) {
            businesses {
              sbi
              organisationId
              name
            }
          }
        }
      `,
      variableValues: {
        crn: '9477368292'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          businesses: [
            {
              name: "Cliff Spence Teritorial Army's Abbey Farm, Hop-Worthering on the Naze a.k.a. the Donkey Sanctuary",
              sbi: '890000004',
              organisationId: '5625145'
            }
          ]
        }
      }
    })
  })

  it('should handle error', async () => {
    await mockServer.server.mock.useRouteVariant(
      'rural-payments-get-person-organisations-summary-by-person-id:error'
    )

    const result = await graphql({
      source: `#graphql
        query Customer($crn: ID!) {
          customer(crn: $crn) {
            businesses {
              sbi
            }
          }
        }
      `,
      variableValues: {
        crn: '0866159801'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: { customer: { businesses: null } },
      errors: [new GraphQLError('Internal Server Error')]
    })
  })
})

describe('Query.customer.business', () => {
  it('should return customer business permissions', async () => {
    const result = await graphql({
      source: `#graphql
        query Permissions($crn: ID!, $sbi: ID!) {
          customer(crn: $crn) {
            business(sbi: $sbi) {
              role
              permissionGroups {
                id
                level
              }
            }
          }
        }
      `,
      variableValues: {
        crn: '0866159801',
        sbi: '890000004'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          business: {
            role: 'Employee',
            permissionGroups: [{
              id: 'BASIC_PAYMENT_SCHEME',
              level: 'NO_ACCESS'
            }, {
              id: 'BUSINESS_DETAILS',
              level: 'AMEND'
            }, {
              id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
              level: 'SUBMIT'
            }, {
              id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
              level: 'SUBMIT'
            }, {
              id: 'ENTITLEMENTS',
              level: 'NO_ACCESS'
            }, {
              id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
              level: 'NO_ACCESS'
            }, {
              id: 'LAND_DETAILS',
              level: 'VIEW'
            }]
          }
        }
      }
    })
  })

  it('should return customer business messages', async () => {
    const result = await graphql({
      source: `#graphql
        query Messages($crn: ID!, $sbi: ID!, $pagination: Pagination, $deleted: Boolean) {
          customer(crn: $crn) {
            business(sbi: $sbi) {
              messages(pagination: $pagination, showOnlyDeleted: $deleted) {
                title
                read
                id
                date
              }

            }
          }
        }
      `,
      variableValues: {
        crn: '0866159801',
        sbi: '890000004',
        pagination: {
          page: 1,
          perPage: 3
        },
        deleted: false
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          business: {
            messages: [
              {
                title: 'Permission changed for David Paul',
                read: false,
                id: '11401',
                date: 6010706997254
              },
              {
                title: 'Permission changed for David Paul',
                read: true,
                id: '7551987',
                date: 8327630499790
              }
            ]
          }
        }
      }
    })
  })

  it('should return deleted customer businesses messages', async () => {
    const result = await graphql({
      source: `#graphql
        query Messages($crn: ID!, $sbi: ID!, $pagination: Pagination, $deleted: Boolean) {
          customer(crn: $crn) {
            business(sbi: $sbi) {
              messages(pagination: $pagination, showOnlyDeleted: $deleted) {
                title
                read
                id
                date
              }
            }
          }
        }
      `,
      variableValues: {
        crn: '0866159801',
        sbi: '890000004',
        pagination: {
          page: 1,
          perPage: 3
        },
        deleted: true
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          business: {
            messages: [
              {
                title: 'Permission changed for David Paul',
                read: false,
                id: '9315941',
                date: 8862388585856
              }
            ]
          }
        }
      }
    })
  })

  it('should handle error when no businesses', async () => {
    const result = await graphql({
      source: `#graphql
        query Messages($crn: ID!) {
          customer(crn: $crn) {
            businesses {
              name
            }
          }
        }
      `,
      variableValues: {
        crn: '123',
        pagination: {
          page: 1,
          perPage: 3
        },
        deleted: true
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          businesses: null
        }
      },
      errors: [
        new NotFound('Rural payments customer not found')
      ]
    })
  })
})
