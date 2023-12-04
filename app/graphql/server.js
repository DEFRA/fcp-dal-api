import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { loadFiles } from '@graphql-tools/load-files'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeResolvers } from '@graphql-tools/merge'

async function getFiles (path) {
  return loadFiles(join(dirname(fileURLToPath(import.meta.url)), path), {
    recursive: true,
    requireMethod: async path => import(pathToFileURL(path))
  })
}

export const schema = makeExecutableSchema({
  typeDefs: await getFiles('types'),
  resolvers: mergeResolvers(await getFiles('resolvers'))
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
