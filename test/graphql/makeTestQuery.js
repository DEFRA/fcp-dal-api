import { graphql } from 'graphql'
import { authorisedEntities } from '../../app/config.js'
import { buildContext } from '../../app/graphql/context.js'
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
  // the auth gate is skipped as `auth` is substituted below to simulate the calling service
  const ctx = await buildContext({ headers: headers ?? defaultHeaders }, { enforceAuth: false })
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
