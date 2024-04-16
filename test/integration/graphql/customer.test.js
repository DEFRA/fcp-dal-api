import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { ruralPaymentsPortalCustomerTransformer } from '../../../app/transformers/rural-payments-portal/customer.js'
import { personById } from '../../../mocks/fixtures/person.js'
import { fakeContext } from '../../test-setup.js'

const personFixture = personById({ id: '123' })

describe('Query.customer', () => {
  it('should return customer data', async () => {
    const transformedPerson = ruralPaymentsPortalCustomerTransformer(personFixture._data)
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(id: "123") {
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
        customerId: '123'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: JSON.parse(JSON.stringify(transformedPerson))
      }
    })
  })
})

describe('Query.customer.businesses', () => {
  it('should return customer businesses', async () => {
    // const authOrganisation = sitiAgriAuthorisationOrganisation({ organisationId: '5841879' })
    // const personId = authOrganisation.personRoles[0].personId
    const result = await graphql({
      source: `#graphql
        query TestCustomerBusinesses($id: ID!) {
          customer(id: $id) {
            businesses {
              roles
              permissionGroups {
                id
                level
              }
            }
          }
        }
      `,
      variableValues: {
        id: '1553506'
      },
      schema,
      contextValue: fakeContext
    })

    expect(result).toEqual({
      data: {
        customer: {
          businesses: [
            {
              roles: [
                'Business Partner'
              ],
              permissionGroups: [
                {
                  id: 'BASIC_PAYMENT_SCHEME',
                  level: 'SUBMIT'
                },
                {
                  id: 'BUSINESS_DETAILS',
                  level: 'FULL_PERMISSION'
                },
                {
                  id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
                  level: 'SUBMIT'
                },
                {
                  id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
                  level: 'SUBMIT'
                },
                {
                  id: 'ENTITLEMENTS',
                  level: 'AMEND'
                },
                {
                  id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
                  level: 'SUBMIT'
                },
                {
                  id: 'LAND_DETAILS',
                  level: 'AMEND'
                }
              ]
            }
          ]
        }
      }
    })
  })
})

describe('Query.customer.businesses.messages', () => {
  it('should return customer businesses messages', async () => {
    const result = await graphql({
      source: `#graphql
        query Messages($customerId: ID!, $pagination: Pagination, $deleted: Boolean) {
          customer(id: $customerId) {
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
        customerId: '5007136',
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
                  read: false,
                  id: '11401',
                  date: 6010706997254
                },
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
        query Messages($customerId: ID!, $pagination: Pagination, $deleted: Boolean) {
          customer(id: $customerId) {
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
        customerId: '5007136',
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
})
