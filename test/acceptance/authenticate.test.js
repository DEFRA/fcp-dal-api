import fetch from 'node-fetch'
import qs from 'qs'

describe('authenticate contract', () => {
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
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query CustomerAuthenticateQuestions {
            customer(crn: "${process.env.RP_INTERNAL_HEALTH_CHECK_CUSTOMER_CRN}") {
              crn
              authenticationQuestions(entraIdUserObjectId: "${process.env.ENTRA_HEALTH_CHECK_USER_OBJECT_ID}") {
                isFound
                updatedAt
                memorableDate
                memorableEvent
                memorablePlace
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
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.isFound')
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.memorableDate')
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.memorablePlace')
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.memorableEvent')
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.updatedAt')
  })
})
