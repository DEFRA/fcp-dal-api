import { graphql } from 'graphql'

import { schema } from '../../../app/graphql/server.js'
import { context } from '../../../app/graphql/context.js'

describe('Query.customer without authorization header', () => {
  it('should return customer data', async () => {
    const unAuthedContext = await context({})
    const result = await graphql({
      source: `#graphql
        query Customer {
          customer(id: "5090008") {
            id
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
      variableValues: {
        customerId: '5090008'
      },
      schema,
      contextValue: unAuthedContext
    })
    expect(result.data.customer).toBeNull()
    expect(result.errors).toHaveLength(1)
  })
})
