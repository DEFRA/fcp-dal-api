import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const isCustomerEmailRegisteredQuery = gql`
  query IsCustomerEmailRegistered($email: String!) {
    isCustomerEmailRegistered(email: $email)
  }
`

describe('isCustomerEmailRegistered Query', () => {
  it('should report a known email address as registered', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      isCustomerEmailRegisteredQuery,
      { email: 'skeleton@the-closet.net' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.isCustomerEmailRegistered).toBe(true)
  })

  it('should report an unknown email address as not registered', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      isCustomerEmailRegisteredQuery,
      { email: 'nobody-with-this-address@example.com' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.isCustomerEmailRegistered).toBe(false)
  })

  it('should match known email addresses case-insensitively', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      isCustomerEmailRegisteredQuery,
      { email: 'SKELETON@THE-CLOSET.NET' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.isCustomerEmailRegistered).toBe(true)
  })

  it('should correctly handle email addresses containing characters that are meaningful in a URL', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      isCustomerEmailRegisteredQuery,
      { email: 'nobody+with-a-plus/and-a-slash@example.com' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.isCustomerEmailRegistered).toBe(false)
  })
})
