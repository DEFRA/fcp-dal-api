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
            businessTypes {
              code
              description
            }
            legalStatuses {
              code
              description
            }
            titles
          }
        }
      `,
      {},
      { email: 'some-email' }
    )

    expect(response).not.toHaveProperty('errors')
    expect(response.referenceData.countriesCurrencies).toEqual([
      { code: 'GB', currency: 'GBP' },
      { code: 'IE', currency: 'EUR' },
      { code: 'IRL', currency: 'EUR' },
      { code: 'PT', currency: 'EUR' }
    ])
    expect(response.referenceData.businessTypes).toEqual(
      expect.arrayContaining([
        { code: 101402, description: 'Agency/Agent' },
        { code: 101404, description: 'Farmer' }
      ])
    )
    expect(response.referenceData.legalStatuses).toEqual(
      expect.arrayContaining([
        { code: 102101, description: 'Charitable Incorporated Organisation (CIO)' },
        { code: 102114, description: 'Unlimited Company (Ultd)' }
      ])
    )
    expect(response.referenceData.titles).toEqual(
      expect.arrayContaining(['Miss', 'Mr', 'Mrs', 'Ms', 'Dame', 'Dr'])
    )
  })
})
