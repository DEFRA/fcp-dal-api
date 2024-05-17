import { graphql } from 'graphql'

import { context } from '../../../app/graphql/context.js'
import { schema } from '../../../app/graphql/server.js'

describe('Query.customer without authorization header', () => {
  it('should return customer data', async () => {
    const unAuthedContext = await context({})
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
  })
})
