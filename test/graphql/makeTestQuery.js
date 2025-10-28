import { graphql } from 'graphql'
import { config } from '../../app/config.js'
import { context } from '../../app/graphql/context.js'
import { createSchema } from '../../app/graphql/schema.js'

const defaultHeaders = { email: 'test@defra.gov.uk', 'gateway-type': 'internal' }
export const makeTestQuery = async (
  source,
  headers,
  isAuthenticated = true,
  variableValues = {},
  authGroups = []
) => {
  const ctx = await context({ request: { headers: headers ?? defaultHeaders } })
  try {
    const response = await graphql({
      source,
      schema: await createSchema(),
      contextValue: {
        ...ctx,
        auth: isAuthenticated
          ? { groups: [config.get('auth.groups.ADMIN')] }
          : { groups: authGroups }
      },
      variableValues
    })
    return response
  } finally {
    await ctx.db.dropDatabase()
  }
}
