import { retrieveApimAccessToken } from '../test-helpers/apim.js'

describe('authenticate contract', () => {
  let token
  beforeAll(async () => {
    token = await retrieveApimAccessToken()
  })

  it('should return business customers', async () => {
    const response = await fetch(`${process.env.ACCEPTANCE_TEST_ENVIRONMENT_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `#graphql
          query CustomerAuthenticateQuestions {
            customer(crn: "${process.env.ACCEPTANCE_TEST_RP_INTERNAL_CUSTOMER_CRN}") {
              crn
              authenticationQuestions {
                isFound
                updatedAt
                memorableDate
                memorableEvent
                memorableLocation
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
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.memorableLocation')
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.memorableEvent')
    expect(parsedResponse).toHaveProperty('data.customer.authenticationQuestions.updatedAt')
  })
})
