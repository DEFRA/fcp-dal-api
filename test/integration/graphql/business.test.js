import { deepEqual } from 'assert'

import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { context } from '../../../app/graphql/context.js'

import mockServer from '../../../mocks/server.js'

import { transformOrganisationToBusiness } from '../../../app/transformers/rural-payments-portal/business.js'
import { organisation as organisationFixture } from '../../../mocks/fixtures/organisation.js'

const ruralPaymentsPortalApiUrl = process.env.RURAL_PAYMENTS_PORTAL_API_URL
const ruralPaymentsPortalEmail = process.env.RURAL_PAYMENTS_PORTAL_EMAIL

describe('Query.customer', () => {
  before(async () => {
    const mockUrl = await mockServer.start()
    process.env.RURAL_PAYMENTS_PORTAL_API_URL = `${mockUrl}/rpp/`
    process.env.RURAL_PAYMENTS_PORTAL_EMAIL = 'test-email'
  })
  after(async () => {
    process.env.RURAL_PAYMENTS_PORTAL_API_URL = ruralPaymentsPortalApiUrl
    process.env.RURAL_PAYMENTS_PORTAL_EMAIL = ruralPaymentsPortalEmail
    await mockServer.stop()
  })

  it('should return business data', async () => {
    await mockServer.selectBase('base')
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
