import { graphql } from 'graphql'

import { Unauthorized } from '../../../../app/errors/graphql.js'
import { context } from '../../../../app/graphql/context.js'
import { schema } from '../../../../app/graphql/server.js'

describe('Query.customer without authorization header', () => {
  const request = { headers: { email: 'test@defra.gov.uk' } }

  it('customer query should return an auth error', async () => {
    const unAuthedContext = await context({ request })
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(crn: "0866159801") {
            crn
            info {
              name {
                title
                otherTitle
                first
                middle
                last
              }
            }
          }
        }
      `,
      schema,
      contextValue: unAuthedContext
    })
    expect(result.data.customer).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })

  it('business query should return an auth error', async () => {
    const unAuthedContext = await context({ request })
    const result = await graphql({
      source: `#graphql
        query Business {
          business(sbi: "890000001") {
            land {
              parcels {
                id
                sheetId
                area
              }
            }
          }
        }
      `,
      schema,
      contextValue: unAuthedContext
    })
    expect(result.data.business).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })

  it('permissions query should return an auth error', async () => {
    const unAuthedContext = await context({ request })
    const result = await graphql({
      source: `#graphql
          query PermissionGroups($crn: ID!, $sbi: ID!) {
            permissionGroups {
              id
              name
              permissions {
                active(crn: $crn, sbi: $sbi)
                functions
                level
              }
            }
          }
        `,
      variableValues: {
        crn: '9102634220',
        sbi: '890000001'
      },
      schema,
      contextValue: unAuthedContext
    })
    expect(result.data.permissionGroups).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual(
      new Unauthorized('Authorization failed, you are not in the correct AD groups')
    )
  })
})
