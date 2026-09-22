import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

const permittedFunctionsQuery = gql`
  query InternalUserPermittedFunctions($functions: [String!]!) {
    internalUser {
      permittedFunctions(functions: $functions) {
        name
        permitted
      }
    }
  }
`

describe('internalUser Query', () => {
  it('should return whether the internal user is permitted each requested function', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      permittedFunctionsQuery,
      {
        functions: ['addOrRemoveOrTransferLand', 'caseManagement', 'createNewCustomer', 'viewLand']
      },
      { email: 'internal-user@defra.gov.uk' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.internalUser.permittedFunctions).toEqual([
      { name: 'addOrRemoveOrTransferLand', permitted: true },
      { name: 'caseManagement', permitted: false },
      { name: 'createNewCustomer', permitted: true },
      { name: 'viewLand', permitted: false }
    ])
  })

  it('should echo an unrecognised function name back as not permitted', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      permittedFunctionsQuery,
      { functions: ['someBrandNewFunction'] },
      { email: 'internal-user@defra.gov.uk' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.internalUser.permittedFunctions).toEqual([
      { name: 'someBrandNewFunction', permitted: false }
    ])
  })

  it("should vary the permitted functions with the internal user's email", async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      permittedFunctionsQuery,
      { functions: ['caseManagement', 'search'] },
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.internalUser.permittedFunctions).toEqual([
      { name: 'caseManagement', permitted: true },
      { name: 'search', permitted: true }
    ])
  })
})
