import { graphql } from 'graphql'
import { authorisedEntities } from '../../app/config.js'
import { context } from '../../app/graphql/context.js'
import { createSchema } from '../../app/graphql/schema.js'

const defaultHeaders = { email: 'test@defra.gov.uk' }
export const makeTestQuery = async (
  source,
  headers,
  isAuthenticated = true,
  variableValues = {},
  authorizedEntityIds = [],
  dropDbOnCompletion = true
) => {
  const ctx = await context({ request: { headers: headers ?? defaultHeaders } })
  const entity = isAuthenticated
    ? Object.values(authorisedEntities).find(({ authName }) => authName === 'ADMIN')
    : Object.values(authorisedEntities).find(({ entityId }) =>
        authorizedEntityIds.includes(entityId)
      )
  try {
    return await graphql({
      source,
      schema: await createSchema(),
      contextValue: {
        ...ctx,
        auth: {
          entityId: entity?.entityId,
          authName: entity?.authName,
          serviceName: entity?.serviceName ?? 'unknown-unauthorised-service'
        }
      },
      variableValues
    })
  } finally {
    if (dropDbOnCompletion) {
      await ctx.db.dropDatabase()
    }
  }
}
