import { dirname, join } from 'path'
import { pathToFileURL, fileURLToPath } from 'url'

import { loadFiles } from '@graphql-tools/load-files'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'

const graphqlPath = dirname(fileURLToPath(import.meta.url))

export const schema = makeExecutableSchema({
  typeDefs: await loadFiles(join(graphqlPath, 'types'), {
    recursive: true,
    requireMethod: async path => import(pathToFileURL(path))
  }),
  resolvers: await loadFiles(join(graphqlPath, 'resolvers'), {
    recursive: true,
    requireMethod: async path => import(pathToFileURL(path))
  }),
  resolverValidationOptions: {
    requireResolversForArgs: 'error',
    requireResolversForAllField: 'error',
    requireResolversForResolveType: 'error',
    requireResolversToMatchSchema: 'error'
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
