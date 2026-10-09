import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

describe('WIP directive', () => {
  const client = new GraphQLClient(targetURL)
  const wipQuery = gql`
    query Query {
      wipExample
    }
  `

  it('noddy test to show a query with a WIP field', async () => {
    const response = await client.request(wipQuery)

    expect(response).not.toHaveProperty('errors')
    expect(response.wipExample).toBe(null)
  })
})
