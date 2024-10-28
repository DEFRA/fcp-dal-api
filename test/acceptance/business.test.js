import fetch from 'node-fetch'
import qs from 'qs'

describe('business contract', () => {
  let token
  beforeAll(async () => {
    const body = qs.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: `api://${process.env.CLIENT_ID}/.default`,
      grant_type: 'client_credentials'
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const response = await fetch(`${process.env.RP_INTERNAL_APIM_ACCESS_TOKEN_URL}${process.env.API_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      body,
      redirect: 'follow',
      headers
    })
    const parsedResponse = await response.json()
    token = parsedResponse.access_token
  })

  it('should return business customers', async () => {
    const response = await fetch(`${process.env.ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query BusinessCustomers {
            business(sbi: "${process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_SBI}") {
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
    const response = await fetch(`${process.env.ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query BusinessCustomerPermissions {
            business(sbi: "${process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_SBI}") {
              customer(crn: "${process.env.RP_INTERNAL_HEALTH_CHECK_CUSTOMER_CRN}") {
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
