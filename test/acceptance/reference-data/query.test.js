import { gql, GraphQLClient } from 'graphql-request'

const targetURL = process.env.TARGET_URL ?? 'http://localhost:3000/graphql'

describe('reference data query', () => {
  it('should return all the reference data', async () => {
    const client = new GraphQLClient(targetURL)
    const response = await client.request(
      gql`
        query ReferenceData {
          referenceData {
            countriesCurrencies {
              code
              currency
            }
            legalStatuses {
              code
              description
            }
          }
        }
      `,
      {},
      { email: 'some-email', 'gateway-type': 'internal' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response).toEqual(
      expect.objectContaining({
        referenceData: {
          countriesCurrencies: [
            { code: 'GB', currency: 'GBP' },
            { code: 'IE', currency: 'EUR' },
            { code: 'IRL', currency: 'EUR' },
            { code: 'PT', currency: 'EUR' }
          ],
          legalStatuses: expect.arrayContaining([
            { code: 102101, description: 'Charitable Incorporated Organisation (CIO)' },
            { code: 102114, description: 'Unlimited Company (Ultd)' }
          ])
        }
      })
    )
  })
})
