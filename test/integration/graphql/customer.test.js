import { deepEqual } from 'assert'

import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { context } from '../../../app/graphql/context.js'

import mockServer from '../../../mocks/server.js'

import { ruralPaymentsPortalCustomerTransformer } from '../../../app/transformers/rural-payments-portal/customer.js'
import { person as personFixture } from '../../../mocks/fixtures/person.js'

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
