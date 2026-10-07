import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const sendConfirmEmailAddressEmailMutation = gql`
  mutation SendConfirmEmailAddressEmail {
    sendConfirmEmailAddressEmail {
      success
    }
  }
`

const externalUserHeaders = (contactId) => ({
  'x-forwarded-authorization': jwt.sign({ contactId, relationships: [] }, 'test-secret')
})

describe('sendConfirmEmailAddressEmail Mutation', () => {
  it('should send a verification email to a customer whose email address is not yet verified', async () => {
    // person 11111121 (CRN 1111112100) has an unvalidated email address in the mock
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      sendConfirmEmailAddressEmailMutation,
      {},
      externalUserHeaders('1111112100')
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.sendConfirmEmailAddressEmail.success).toBe(true)
  })

  it('should allow the verification email to be re-sent', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      sendConfirmEmailAddressEmailMutation,
      {},
      externalUserHeaders('1111112100')
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.sendConfirmEmailAddressEmail.success).toBe(true)
  })

  it('should reject a customer whose email address is already verified', async () => {
    // person 11111119 (CRN 1111111900) has a validated email address in the mock
    const client = new GraphQLClient(targetURL)

    await expect(
      client.request(sendConfirmEmailAddressEmailMutation, {}, externalUserHeaders('1111111900'))
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message: 'Customer email address is already verified',
            extensions: expect.objectContaining({ code: 'EMAIL_ALREADY_VERIFIED' })
          })
        ]
      }
    })
  })

  it('should reject a customer with no email address', async () => {
    // person 3010085 (CRN 3010000085) has no email address in the mock
    const client = new GraphQLClient(targetURL)

    await expect(
      client.request(sendConfirmEmailAddressEmailMutation, {}, externalUserHeaders('3010000085'))
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message: 'Customer has no email address',
            extensions: expect.objectContaining({ code: 'NOT FOUND' })
          })
        ]
      }
    })
  })

  it('should reject a request without a Defra ID token', async () => {
    // NOTE: auth is disabled in the acceptance tests, so the @auth userType check on this field is
    // not applied - this exercises the resolver's own guard instead
    const client = new GraphQLClient(targetURL)

    await expect(
      client.request(sendConfirmEmailAddressEmailMutation, {}, { email: 'some-email' })
    ).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({
            message: 'A Defra ID token is required to send a confirm email address email',
            extensions: expect.objectContaining({ code: 'UNAUTHORIZED' })
          })
        ]
      }
    })
  })
})
