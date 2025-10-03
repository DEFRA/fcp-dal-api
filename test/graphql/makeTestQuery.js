import { graphql } from 'graphql'
import { config } from '../../app/config.js'
import { context } from '../../app/graphql/context.js'
import { createSchema } from '../../app/graphql/schema.js'

export async function makeTestQuery(
  source,
  isAuthenticated = true,
  variableValues = {},
  headers = { email: 'test@defra.gov.uk', 'gateway-type': 'internal' }
) {
  const ctx = await context({ request: { headers } })
  const response = await graphql({
    source,
    schema: await createSchema(),
    contextValue: {
      ...ctx,
      auth: isAuthenticated ? { groups: [config.get('auth.groups.ADMIN')] } : {}
    },
    variableValues: variableValues
  })
  await ctx.db.dropDatabase()
  return response
}
