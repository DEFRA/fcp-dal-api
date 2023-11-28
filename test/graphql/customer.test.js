import { deepEqual } from 'assert'

import { graphql } from 'graphql'
import { faker } from '@faker-js/faker/locale/en_GB'

import { schemaWithMocks, schema } from '../../app/graphql/server.js'
import { context } from '../../app/graphql/context.js'

import mockServer from '../../mocks/server.js'

import { ruralPaymentsPortalCustomerTransformer } from '../../app/transformers/rural-payments-portal/customer.js'
import { person as personFixture } from '../../mocks/fixtures/person.js'

describe('Query.customer', () => {
  before(mockServer.start)
  after(mockServer.stop)

  it('should return customer data', async () => {
    await mockServer.selectBase('base')
    const transformedPerson = ruralPaymentsPortalCustomerTransformer(personFixture)

    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(id: "5090008") {
            id
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
        customerId: '5090008'
      },
      schema,
      contextValue: await context()
    })

    deepEqual(result, {
      data: {
        customer: JSON.parse(JSON.stringify(transformedPerson))
      }
    })
  })
})

describe('Mutation.updateCustomerAuthenticationQuestions', () => {
  beforeEach(() => {
    faker.seed(7209369705577748)
  })

  it('should return CustomerAuthenticationQuestions mock', async () => {
    const result = await graphql({
      source: `#graphql
        mutation TestUpdateCustomerAuthenticationQuestions($input: UpdateCustomerAuthenticationQuestionsInput!) {
          updateCustomerAuthenticationQuestions(input: $input) {
            memorableDate
            memorableEvent
            memorablePlace
          }
        }
      `,
      variableValues: {
        input: {
          id: 'crn',
          memorableDate: '',
          memorableEvent: '',
          memorablePlace: ''
        }
      },
      schema: schemaWithMocks
    })

    deepEqual(result, {
      data: {
        updateCustomerAuthenticationQuestions: {
          memorableDate:
            'Ascit conculco tracto voluptates absum consequuntur nemo pecto.',
          memorableEvent: 'Ustulo beatae provident totidem cito.',
          memorablePlace: 'Desparatus abduco aduro est.'
        }
      }
    })
  })
})
