import { graphql } from 'graphql'
import { config } from '../../app/config.js'
import { context } from '../../app/graphql/context.js'
import { createSchema } from '../../app/graphql/schema.js'

export async function makeTestQuery(source, isAuthenticated = true, variableValues = {}) {
  return graphql({
    source,
    schema: await createSchema(),
    contextValue: {
      ...(await context({ request: { headers: { email: 'test@defra.gov.uk' } } })),
      auth: isAuthenticated ? { groups: [config.get('auth.groups.ADMIN')] } : {}
    },
    variableValues: variableValues
  })
}
