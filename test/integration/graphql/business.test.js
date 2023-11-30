import { deepEqual } from 'assert'

import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { context } from '../../../app/graphql/context.js'

import { transformOrganisationToBusiness } from '../../../app/transformers/rural-payments-portal/business.js'
import { organisation as organisationFixture } from '../../../mocks/fixtures/organisation.js'

describe('Query.customer', () => {
  it('should return business data', async () => {
    const transformedOrganisation = transformOrganisationToBusiness(organisationFixture)

    const result = await graphql({
      source: `#graphql
        query Business {
          business(id: "5444918") {
            id
            info {
              sbi
              name
              reference
              vat
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
              legalStatus {
                code
                type
              }
              type {
                code
                type
              }
              registrationNumbers {
                companiesHouse
                charityCommission
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
        business: JSON.parse(JSON.stringify(transformedOrganisation))
      }
    })
  })
})
