import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { transformAuthenticateQuestionsAnswers } from '../../../app/transformers/authenticate/question-answers.js'
import { ruralPaymentsPortalCustomerTransformer } from '../../../app/transformers/rural-payments-portal/customer.js'
import { personById } from '../../../mocks/fixtures/person.js'
import { fakeContext } from '../../test-setup.js'

const personFixture = personById({ id: '5007136' })

describe('Query.customer', () => {
  it.skip('should return customer data', async () => {
    const customerInfo = ruralPaymentsPortalCustomerTransformer(personFixture._data)
    const result = await graphql({
      source: `#graphql
        query Customer($crn: ID!) {
          customer(crn: $crn) {
            crn
            customerId
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
          customerId: personFixture._data.id.toString(),
          info: customerInfo
        }
      }
    }
    )
  })

  it('should return customer authenticate questions', async () => {
    const authenticateQuestionsResponse = {
      CRN: '123',
      Date: 'some date',
      Event: 'some event',
      Location: 'some location',
      Updated: 'some date'
    }
    fakeContext.dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN.mockResolvedValue(authenticateQuestionsResponse)
    const transformedAuthenticateQuestions = transformAuthenticateQuestionsAnswers(authenticateQuestionsResponse)
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "123") {
            authenticationQuestions {
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
        customerId: '123'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          authenticationQuestions: JSON.parse(JSON.stringify(transformedAuthenticateQuestions))
        }
      }
    })
  })

  it('should return isFound false if record not found', async () => {
    const authenticateQuestionsResponse = null
    fakeContext.dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN.mockResolvedValue(authenticateQuestionsResponse)
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "123") {
            authenticationQuestions {
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
        customerId: '123'
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
    fakeContext.dataSources.authenticateDatabase.getAuthenticateQuestionsAnswersByCRN.mockResolvedValue(authenticateQuestionsResponse)
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "123") {
            authenticationQuestions {
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
        customerId: '123'
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

describe.skip('Query.customer.businesses', () => {
  it('should return customer businesses', async () => {
    const result = await graphql({
      source: `#graphql
        query TestCustomerBusinesses($crn: ID!) {
          customer(crn: $crn) {
            businesses {
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
        crn: '0866159801' // personId: 5007136
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          businesses: [
            {
              roles: ['Business Partner'],
              permissionGroups: [
                {
                  id: 'BASIC_PAYMENT_SCHEME',
                  level: null
                },
                {
                  id: 'BUSINESS_DETAILS',
                  level: 'FULL_PERMISSION'
                },
                {
                  id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
                  level: null
                },
                {
                  id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
                  level: null
                },
                {
                  id: 'ENTITLEMENTS',
                  level: null
                },
                {
                  id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
                  level: null
                },
                {
                  id: 'LAND_DETAILS',
                  level: null
                }
              ]
            }
          ]
        }
      }
    })
  })
})

describe.skip('Query.customer.businesses.messages', () => {
  it('should return customer businesses messages', async () => {
    const result = await graphql({
      source: `#graphql
        query Messages($crn: ID!, $pagination: Pagination, $deleted: Boolean) {
          customer(crn: $crn) {
            businesses {
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
          businesses: [
            {
              messages: [
                {
                  title: 'Permission changed for David Paul',
                  read: true,
                  id: '7551987',
                  date: 8327630499790
                },
                {
                  title: 'Permission changed for David Paul',
                  read: false,
                  id: '9315941',
                  date: 8862388585856
                }
              ]
            }
          ]
        }
      }
    })
  })

  it('should return deleted customer businesses messages', async () => {
    const result = await graphql({
      source: `#graphql
        query Messages($crn: ID!, $pagination: Pagination, $deleted: Boolean) {
          customer(crn: $crn) {
            businesses {
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
          businesses: [
            {
              messages: [
                {
                  title: 'Permission changed for David Paul',
                  read: false,
                  id: '11401',
                  date: 6010706997254
                }
              ]
            }
          ]
        }
      }
    })
  })
})
