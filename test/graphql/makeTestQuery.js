import { graphql } from 'graphql'
import { context } from '../../app/graphql/context.js'
import { createSchema } from '../../app/graphql/schema.js'

export async function makeTestQuery(source, isAuthenticated = true) {
  return graphql({
    source,
    schema: await createSchema(),
    contextValue: {
      ...(await context({ request: { headers: { email: 'test@defra.gov.uk' } } })),
      auth: isAuthenticated ? { groups: [process.env.ADMIN_AD_GROUP_ID] } : {}
    }
  })
}
