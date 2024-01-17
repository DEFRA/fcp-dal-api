import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { fakeContext } from '../../test-setup.js'
import { ruralPaymentsPortalCustomerTransformer } from '../../../app/transformers/rural-payments-portal/customer.js'
import { person as personFixture } from '../../../mocks/fixtures/person.js'

describe('Query.customer', () => {
  it('should return customer data', async () => {
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
    const result = await graphql({
      source: `#graphql
        query TestCustomerBusinesses($id: ID!) {
          customer(id: $id) {
            businesses {
              roles
              privileges
            }
          }
        }
      `,
      variableValues: {
        id: '5841879'
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
              privileges: [
                'Full permission - business',
                'SUBMIT - CS APP - SA',
                'SUBMIT - CS AGREE - SA',
                'Amend - land',
                'Amend - entitlement',
                'Submit - bps',
                'SUBMIT - BPS - SA',
                'AMEND - ENTITLEMENT - SA',
                'AMEND - LAND - SA',
                'Submit - cs app',
                'Submit - cs agree',
                'ELM_APPLICATION_SUBMIT'
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
        customerId: '123',
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
                  title: 'Crapula capillus tenetur contigo vindico arbitro corporis tenetur voveo calcar.',
                  read: false,
                  id: '9614024',
                  date: 4041907889750
                },
                {
                  title: 'Tamisium delicate carcer. Soluta subito antepono dignissimos dens. Ipsa solvo adopto nesciunt vomer ocer claro.\nApto tergiversatio tollo sollicito neque totidem calculus aspernatur supellex. Aegrus aurum depulso harum triumphus deputo dolores abutor studio. Sortitus vestrum voco talio umquam tollo cetera cerno damnatio nobis.\nNam nulla dedico auctor astrum. In libero aufero cupiditate excepturi arma temperantia. Debilito aeternus aranea correptius desolo volaticus deporto undique vae.',
                  read: false,
                  id: '3041329',
                  date: 7413162689028
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
        customerId: '123',
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
                  title: 'Videlicet fuga averto antepono depopulo saepe vomica.',
                  read: false,
                  id: '4653378',
                  date: 1540594791161
                }
              ]
            }
          ]
        }
      }
    })
  })
})
