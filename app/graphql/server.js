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
  resolverValidationOptions: {
    requireResolversForArgs: 'error',
    requireResolversForAllField: 'error',
    requireResolversForResolveType: 'error',
    requireResolversToMatchSchema: 'error',
  }
})

export const apolloServer = new ApolloServer({
  schema,
  plugins: [
    (() => {
      if (process.env?.NODE_ENV === 'production') {
        return ApolloServerPluginLandingPageDisabled()
      }

      return ApolloServerPluginLandingPageLocalDefault()
    })()
  ]
})
