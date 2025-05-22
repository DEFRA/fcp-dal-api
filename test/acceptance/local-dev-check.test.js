import { GraphQLClient, gql } from 'graphql-request'

const query = gql`
  query Business($sbi: ID!, $crn: ID!) {
    business(sbi: $sbi) {
      organisationId
      sbi
      info {
        name
        reference
        vat
        traderNumber
        vendorNumber
      }
      customer(crn: $crn) {
        personId
        firstName
        lastName
        crn
        role
        permissionGroups {
          id
          level
          functions
        }
      }
    }
  }
`

describe('Local Dev Check', () => {
  it('should return a valid response', async () => {
    const client = new GraphQLClient('http://localhost:3000/graphql')

    const response = await client.request(query, {
      sbi: '107183280',
      crn: '0866159801'
    })

    expect(response).toMatchObject({
      business: expect.objectContaining({
        organisationId: '5565448',
        sbi: '107183280',
        info: expect.objectContaining({ name: 'HENLEY, RE' }),
        customer: expect.objectContaining({
          personId: '5007136',
          firstName: 'David',
          lastName: 'Paul',
          permissionGroups: expect.arrayContaining([
            expect.objectContaining({
              id: 'BUSINESS_DETAILS',
              level: 'AMEND',
              functions: expect.arrayContaining(['View business details'])
            })
          ])
        })
      })
    })
  })
})
