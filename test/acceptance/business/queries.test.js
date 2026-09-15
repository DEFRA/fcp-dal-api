import { gql, GraphQLClient } from 'graphql-request'
import jwt from 'jsonwebtoken'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

// `agreements` is one of the Business fields that, for an externally authenticated request, is
// resolved via the DAL's own service account rather than the caller's Defra ID token (see
// useServiceAccountForExternal in app/graphql/resolvers/business/common.js). That routing must
// never let a request with an invalid Defra ID token slip through on the service account's
// credentials - the token is verified once, eagerly, during context build
// (app/auth/defra-id.js), before any data source - including the service-account one - is ever
// constructed.
const businessAgreementsQuery = gql`
  query Business($sbi: ID!) {
    business(sbi: $sbi) {
      sbi
      agreements {
        contractId
        name
        status
      }
    }
  }
`

describe('Business Queries - DAL service account routing', () => {
  const client = new GraphQLClient(targetURL)

  it('resolves a service-account-routed field for a valid authenticated external request', async () => {
    const tokenValue = jwt.sign(
      { contactId: '1111111100', relationships: ['111111111:111111111'] },
      'test-secret'
    )

    const response = await client.request(
      businessAgreementsQuery,
      { sbi: '111111111' },
      { 'x-forwarded-authorization': tokenValue }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.business.sbi).toBe('111111111')
    expect(response.business.agreements.length).toBeGreaterThan(0)
  })

  it('rejects the whole request when the Defra ID token is invalid, rather than falling through to the DAL service account', async () => {
    await expect(
      client.request(
        businessAgreementsQuery,
        { sbi: '111111111' },
        { 'x-forwarded-authorization': 'not-a-jwt' }
      )
    ).rejects.toMatchObject({
      response: {
        status: 401,
        errors: [
          expect.objectContaining({
            extensions: expect.objectContaining({ code: 'UNAUTHORIZED' })
          })
        ]
      }
    })
  })
})
