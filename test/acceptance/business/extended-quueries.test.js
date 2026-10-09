import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

describe('Business - extended queries', () => {
  const client = new GraphQLClient(targetURL)
  const bankAccountsQuery = gql`
    query Business($sbi: ID!) {
      business(sbi: $sbi) {
        bankAccounts {
          number
          currency
        }
      }
    }
  `

  it('resolves a business query with bank account details - internal', async () => {
    const response = await client.request(
      bankAccountsQuery,
      { sbi: '222222222' },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business.bankAccounts.length).toBeGreaterThan(0)
    expect(response.business.bankAccounts[0]).toHaveProperty('number')
    expect(response.business.bankAccounts[0]).toHaveProperty('currency')
  })

  it('resolves a business query with bank account details - external', async () => {
    const tokenValue = jwt.sign(
      {
        contactId: '22222222',
        relationships: ['222222222:222222222']
      },
      'test-secret'
    )
    const response = await client.request(
      bankAccountsQuery,
      { sbi: '222222222' },
      { 'x-forwarded-authorization': tokenValue }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business.bankAccounts.length).toBeGreaterThan(0)
    expect(response.business.bankAccounts[0]).toHaveProperty('number')
    expect(response.business.bankAccounts[0]).toHaveProperty('currency')
  })
})
