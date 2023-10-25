import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { loadFiles } from '@graphql-tools/load-files'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'

const graphqlPath = dirname(fileURLToPath(import.meta.url))

export const schema = makeExecutableSchema({
  typeDefs: await loadFiles(join(graphqlPath, 'types')),
  resolvers: await loadFiles(join(graphqlPath, 'resolvers')),
  resolverValidationOptions: (function () {
    return {
      requireResolversForArgs: 'ignore',
      /**
       * Enable to require a resolver to be defined for any field which has
       * a return type that isn't a scalar. Defaults to `ignore`.
       */
      requireResolversForNonScalar: 'ignore',
      /**
       * Enable to require a resolver for be defined for all fields defined
       * in the schema. Defaults to `ignore`.
       */
      requireResolversForAllField: 'ignore',
      /**
       * Enable to require a `resolveType()` for Interface and Union types.
       * Defaults to `ignore`.
       */
      requireResolversForResolveType: 'ignore',
      /**
       * Enable to require all defined resolvers to match fields that
       * actually exist in the schema. Defaults to `error` to catch common errors.
       */
      requireResolversToMatchSchema: 'ignore',
    }
  })()
})

export const apolloServer = new ApolloServer({
  schema,
  plugins: [
    (() => {
      if (process.env?.NODE_ENV === 'production') {
        // todo: ensure validation for schema and resolvers args are enforced for production
        return ApolloServerPluginLandingPageDisabled()
      }

      return ApolloServerPluginLandingPageLocalDefault()
    })()
  ]
})
