import fetch from 'node-fetch'
import qs from 'qs'

describe('customers contract', () => {
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

  it('should return customer business', async () => {
    const response = await fetch(`${process.env.ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query Customer {
            customer(crn: "${process.env.RP_INTERNAL_HEALTH_CHECK_CUSTOMER_CRN}") {
              crn
              businesses {
                sbi
                name
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
    expect(parsedResponse).toHaveProperty('data.customer')
    expect(parsedResponse).toHaveProperty('data.customer.crn')

    expect(parsedResponse.data.customer.businesses.length).toBeGreaterThan(0)

    expect(parsedResponse).toHaveProperty('data.customer.businesses[0].sbi')
    expect(parsedResponse).toHaveProperty('data.customer.businesses[0].name')
  })

  it('should return customers permission for a business', async () => {
    const response = await fetch(`${process.env.ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        email: process.env.RURAL_PAYMENTS_PORTAL_EMAIL,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query CustomerBusinessPermissions {
            customer(crn: "${process.env.RP_INTERNAL_HEALTH_CHECK_CUSTOMER_CRN}") {
              crn
              business(sbi: "${process.env.RP_INTERNAL_HEALTH_CHECK_ORGANISATION_SBI}") {
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
    expect(parsedResponse).toHaveProperty('data.customer')
    expect(parsedResponse).toHaveProperty('data.customer.business')
    expect(parsedResponse).toHaveProperty('data.customer.business.role')
    expect(parsedResponse).toHaveProperty('data.customer.business.permissionGroups')

    expect(parsedResponse.data.customer.business.permissionGroups.length).toBeGreaterThan(0)

    expect(parsedResponse).toHaveProperty('data.customer.business.permissionGroups[0].id')
    expect(parsedResponse).toHaveProperty('data.customer.business.permissionGroups[0].level')
  })
})
