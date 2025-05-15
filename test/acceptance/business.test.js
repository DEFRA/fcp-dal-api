import fetch from 'node-fetch'
import { retrieveAccessToken } from '../test-helpers/apim.js'

describe('business contract', () => {
  let token
  beforeAll(async () => {
    token = await retrieveAccessToken()
  })

  it('should return business customers', async () => {
    const response = await fetch(`${process.env.ACCEPTANCE_TEST_ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        email: process.env.ACCEPTANCE_TEST_RP_INTERNAL_USER_EMAIL,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `#graphql
          query BusinessCustomers {
            business(sbi: "${process.env.ACCEPTANCE_TEST_RP_INTERNAL_ORGANISATION_SBI}") {
              customers {
                firstName
                lastName
                crn
              }
            }
          }
        `
      })
    })

    expect(response.status).toBe(200)

    const parsedResponse = await response.json()

    expect(parsedResponse).not.toHaveProperty('errors')
    expect(parsedResponse).toHaveProperty('data')
    expect(parsedResponse).toHaveProperty('data.business.customers')

    expect(parsedResponse.data.business.customers.length).toBeGreaterThan(0)

    expect(parsedResponse).toHaveProperty('data.business.customers.[0].firstName')
    expect(parsedResponse).toHaveProperty('data.business.customers.[0].lastName')
    expect(parsedResponse).toHaveProperty('data.business.customers.[0].crn')
  })

  it('should return business customers permissions', async () => {
    const response = await fetch(`${process.env.ACCEPTANCE_TEST_ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        email: process.env.ACCEPTANCE_TEST_RP_INTERNAL_USER_EMAIL,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `#graphql
          query BusinessCustomerPermissions {
            business(sbi: "${process.env.ACCEPTANCE_TEST_RP_INTERNAL_ORGANISATION_SBI}") {
              customer(crn: "${process.env.ACCEPTANCE_TEST_RP_INTERNAL_CUSTOMER_CRN}") {
                role
                permissionGroups {
                  id
                  level
                }
              }
            }
          }
        `
      })
    })

    expect(response.status).toBe(200)

    const parsedResponse = await response.json()

    expect(parsedResponse).not.toHaveProperty('errors')
    expect(parsedResponse).toHaveProperty('data')
    expect(parsedResponse).toHaveProperty('data.business.customer')
    expect(parsedResponse).toHaveProperty('data.business.customer.role')
    expect(parsedResponse).toHaveProperty('data.business.customer.permissionGroups')

    expect(parsedResponse.data.business.customer.permissionGroups.length).toBeGreaterThan(0)

    expect(parsedResponse).toHaveProperty('data.business.customer.permissionGroups[0].id')
    expect(parsedResponse).toHaveProperty('data.business.customer.permissionGroups[0].level')
  })
})
