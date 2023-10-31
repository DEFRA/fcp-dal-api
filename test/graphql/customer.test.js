import { deepEqual } from 'assert'

import { graphql } from 'graphql'
import { faker } from '@faker-js/faker/locale/en_GB'

import { schemaWithMocks } from '../../app/graphql/server.js'

describe('Query.customer', () => {
  beforeEach(() => {
    faker.seed(7209369705577748)
  })

  it('should return customer mock', async () => {
    const result = await graphql({
      source: `#graphql
        query TestCustomer($referenceNumber: ID!) {
          customer(referenceNumber: $referenceNumber) {
            referenceNumber
            info {
              status {
                locked
                deactivated
                confirmed
              }
              phone {
                mobile
                landline
                fax
              }
              name {
                first
                last
                middle
                otherTitle
                title
              }
              email {
                address
                doNotContact
                validated
              }
              dateOfBirth
              address {
                buildingName
                buildingNumberRange
                city
                country
                county
                dependentLocality
                doubleDependentLocality
                flatName
                line1
                line3
                line2
                line4
                line5
                pafOrganisationName
                postalCode
                street
                typeId
                uprn
              }
            }
            authenticationQuestions {
              memorableDate
              memorableEvent
              memorablePlace
            }
          }
        }
      `,
      variableValues: {
        referenceNumber: 'crn'
      },
      schema: schemaWithMocks
    })

    deepEqual(result, {
      data: {
        customer: {
          referenceNumber: 'N5CTZ0CKL9',
          info: {
            status: { locked: true, deactivated: false, confirmed: false },
            phone: {
              mobile: '019631 79025',
              landline: '0114 562 7834',
              fax: '0932 226 4907'
            },
            name: {
              first: 'Yvette',
              last: 'Gutkowski-Upton',
              middle: 'Quinn',
              otherTitle: 'Mr.',
              title: 'Miss'
            },
            email: {
              address: 'Ben_Feeney25@yahoo.com',
              doNotContact: false,
              validated: true
            },
            dateOfBirth: '1',
            address: {
              buildingName: 'Apt. 778',
              buildingNumberRange: 'Suite 815',
              city: 'Legros-upon-Kihn',
              country: 'Iceland',
              county: 'Wales',
              dependentLocality: null,
              doubleDependentLocality: null,
              flatName: 'Suite 411',
              line1: '66 Nelson Street',
              line3: null,
              line2: null,
              line4: null,
              line5: null,
              pafOrganisationName: null,
              postalCode: 'XW18 6OC',
              street: 'Church View',
              typeId: null,
              uprn: null
            }
          },
          authenticationQuestions: {
            memorableDate: 'Atrox basium carmen cras soleo architecto.',
            memorableEvent:
              'Timidus aegrotatio odio stabilis amita apud autem.',
            memorablePlace: 'Decimus creber perferendis quia verbera tollo.'
          }
        }
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
          referenceNumber: 'crn',
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
